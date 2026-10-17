import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { getBookingByRef } from "@/lib/db/store";
import { rooms } from "@/data/rooms";
import { getNightsBetween } from "@/lib/availability";

export async function GET(
  req: NextRequest,
  { params }: { params: { ref: string } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const ref = params.ref?.trim().toUpperCase();

  // Rate limit: 5 attempts per 15 min per IP and per ref
  const rateLimitIp = checkRateLimit(`lookup-ip:${ip}`, 5, 15 * 60 * 1000);
  const rateLimitRef = ref ? checkRateLimit(`lookup-ref:${ref}`, 5, 15 * 60 * 1000) : { success: true, remaining: 5, resetInSeconds: 0 };

  if (!rateLimitIp.success || !rateLimitRef.success) {
    const reset = Math.max(rateLimitIp.resetInSeconds, rateLimitRef.resetInSeconds);
    return NextResponse.json(
      { error: "Too many lookup attempts. Please wait 15 minutes before trying again." },
      { status: 429, headers: { "Retry-After": String(reset) } }
    );
  }

  if (!ref || !ref.startsWith("RZQ-")) {
    return NextResponse.json({ error: "Invalid booking reference format" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const phoneLast4 = searchParams.get("phoneLast4")?.trim();

  if (!phoneLast4 || phoneLast4.length !== 4 || !/^\d{4}$/.test(phoneLast4)) {
    return NextResponse.json(
      { error: "Verification failed. Please provide the last 4 digits of your phone number." },
      { status: 400 }
    );
  }

  const booking = await getBookingByRef(ref);
  const GENERIC_NOT_FOUND_MESSAGE =
    "No reservation found matching that reference number and phone digits. Please verify your details.";

  if (!booking) {
    return NextResponse.json({ error: GENERIC_NOT_FOUND_MESSAGE }, { status: 404 });
  }

  // Validate phone last 4 digits
  const cleanPhone = booking.guestPhone.replace(/\D/g, "");
  const bookingPhoneLast4 = cleanPhone.slice(-4);

  if (bookingPhoneLast4 !== phoneLast4) {
    return NextResponse.json(
      { error: GENERIC_NOT_FOUND_MESSAGE },
      { status: 404 }
    );
  }

  const room = rooms.find((r) => r.id === booking.roomTypeId);
  const nights = getNightsBetween(booking.checkIn, booking.checkOut).length;

  // STRICT PRIVACY: Return ONLY safe public status information. Never expose PII.
  return NextResponse.json({
    ref: booking.ref,
    roomTypeName: room ? room.name : booking.roomTypeId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights,
    adults: booking.adults,
    children: booking.children,
    status: booking.status,
    holdExpiresAt: booking.holdExpiresAt,
    createdAt: booking.createdAt,
    estimatedTotalAED: booking.estimatedTotalAED,
  });
}
