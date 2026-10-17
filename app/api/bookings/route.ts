import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { bookingCreationSchema } from "@/lib/validation";
import { createBookingRequest, getRoomTypes, getBookings, getBlocks } from "@/lib/db/store";
import { calculateBookingPrice } from "@/lib/pricing";
import { propertyPolicies } from "@/data/policies";
import { propertyAddons } from "@/data/addons";
import { rooms } from "@/data/rooms";
import { siteConfig } from "@/data/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { findAlternativeDates, findAlternativeRooms } from "@/lib/availability";
import { dispatchNewBookingNotifications } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  // Rate limit: 3 booking requests per 10 minutes per IP
  const rateLimit = checkRateLimit(ip, 3, 10 * 60 * 1000);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many reservation requests from this address. Please try again in a few minutes or contact us directly on WhatsApp." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  // Adults-only policy: reject any request with children > 0
  if (body && typeof body === "object" && "children" in body) {
    const rawChildren = (body as Record<string, unknown>).children;
    if (typeof rawChildren === "number" && rawChildren > 0) {
      return NextResponse.json(
        { error: "Children are not permitted at this adults-only property. Stays are restricted to adult guests." },
        { status: 400 }
      );
    }
  }

  const parsed = bookingCreationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Honeypot trap check
  if (data.honeypot && data.honeypot.length > 0) {
    // Pretend success to fool spam bots
    return NextResponse.json({
      ref: "RZQ-SPAM00",
      status: "pending",
      holdExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      whatsappUrl: `https://wa.me/${siteConfig.whatsappNumber}`,
    });
  }

  const room = rooms.find((r) => r.id === data.roomId);
  if (!room) {
    return NextResponse.json({ error: "Room type not found" }, { status: 400 });
  }

  // Calculate pricing
  const pricing = calculateBookingPrice({
    startingRateAED: room.startingRateAED,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    discountPercent: propertyPolicies.directDiscountPercent,
  });

  // Map selected add-ons
  const selectedAddons = (data.addons || []).map((addonId) => {
    const addon = propertyAddons.find((a) => a.id === addonId);
    return {
      id: addonId,
      name: addon?.name || addonId,
      priceAED: addon?.priceAED || 0,
      priceConfirmed: addon?.priceConfirmed || false,
      requested: true,
    };
  });

  // Race-safe booking creation with IP tracking
  const result = await createBookingRequest({
    roomTypeId: data.roomId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    adults: data.adults,
    children: 0,
    guestName: data.guestName,
    guestPhone: data.guestPhone,
    guestEmail: data.guestEmail || null,
    notes: data.notes || "",
    promoCode: data.promoCode || "RIZQDIRECT",
    estimatedTotalAED: pricing.totalAED,
    addons: selectedAddons,
    holdHours: propertyPolicies.holdDurationHours,
    source: "website",
    ip,
  });

  if (!result.success) {
    if (result.code === "BLOCKED") {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 403 });
    }
    if (result.code === "LIMIT_EXCEEDED") {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 429 });
    }

    // Sold out: find friendly alternatives
    const [roomTypes, bookings, blocks] = await Promise.all([
      getRoomTypes(),
      getBookings(),
      getBlocks(),
    ]);

    const context = { roomTypes, bookings, blocks };
    const alternativeDates = findAlternativeDates(data.roomId, data.checkIn, data.checkOut, context);
    const alternativeRooms = findAlternativeRooms(data.checkIn, data.checkOut, data.roomId, context);

    return NextResponse.json(
      {
        error: "This space is unfortunately fully booked for your selected dates.",
        code: "SOLD_OUT",
        alternativeDates,
        alternativeRooms,
      },
      { status: 409 }
    );
  }

  const booking = result.booking;

  // Build WhatsApp URL with the newly generated Reference code
  const whatsappUrl = buildWhatsAppLink({
    whatsappNumber: siteConfig.whatsappNumber,
    guestName: booking.guestName,
    roomName: room.name,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: pricing.nights,
    adults: data.adults,
    minGuestAge: propertyPolicies.minGuestAge.value || 18,
    promoCode: booking.promoCode,
    discountPercent: propertyPolicies.directDiscountPercent,
    estimatedTotalAED: booking.estimatedTotalAED,
    notes: `Booking Ref: ${booking.ref}. ${booking.notes || ""}`.trim(),
  });

  // Non-blocking asynchronous owner notifications
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  dispatchNewBookingNotifications(booking, origin).catch(() => {});

  return NextResponse.json({
    ref: booking.ref,
    status: booking.status,
    holdExpiresAt: booking.holdExpiresAt,
    whatsappUrl,
  });
}
