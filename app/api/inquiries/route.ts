import { NextRequest, NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { rooms } from "@/data/rooms";
import { calculateBookingPrice } from "@/lib/pricing";
import { InquiryRecord } from "@/types";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import { addInquiryToStore } from "@/lib/inquiryStore";
import { sendOwnerInquiryNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    // 1. IP extraction & rate limiting (5 req / min / IP)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too many reservation inquiries. Please wait a moment or message us directly on WhatsApp.",
          resetInSeconds: rateCheck.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.resetInSeconds),
          },
        }
      );
    }

    // 2. Parse request body
    const body = await request.json();

    // 3. Honeypot check (anti-bot trap)
    if (body.honeypot && body.honeypot.trim().length > 0) {
      // Return 200 to trick spam bots without storing garbage
      return NextResponse.json({
        success: true,
        inquiryId: "bot-ignored",
      });
    }

    // 4. Zod schema validation
    const validationResult = inquirySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid reservation data",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 5. Look up room starting rate
    const room = rooms.find((r) => r.id === data.roomId);
    const nightlyRate = room ? room.startingRateAED : 180;

    // 6. Calculate verified pricing
    const pricing = calculateBookingPrice({
      startingRateAED: nightlyRate,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      discountPercent: 15,
    });

    const inquiryId = `inq-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const inquiry: InquiryRecord = {
      id: inquiryId,
      createdAt: new Date().toISOString(),
      guestName: data.guestName,
      guestEmail: data.guestEmail || undefined,
      guestPhone: data.guestPhone || undefined,
      roomId: data.roomId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights: pricing.nights,
      guests: data.guests,
      estimatedTotalAED: pricing.totalAED,
      promoCode: data.promoCode || "RIZQDIRECT",
      specialRequests: data.specialRequests || undefined,
      status: "New",
    };

    // 7. Store inquiry in Supabase if configured; always record in fallback store
    if (isSupabaseConfigured && supabaseServer) {
      try {
        await supabaseServer.from("inquiries").insert({
          id: inquiry.id,
          guest_name: inquiry.guestName,
          guest_email: inquiry.guestEmail || null,
          guest_phone: inquiry.guestPhone || null,
          room_id: inquiry.roomId,
          check_in: inquiry.checkIn,
          check_out: inquiry.checkOut,
          nights: inquiry.nights,
          guests: inquiry.guests,
          estimated_total_aed: inquiry.estimatedTotalAED,
          promo_code: inquiry.promoCode,
          special_requests: inquiry.specialRequests || null,
          status: "New",
        });
      } catch (dbErr) {
        // eslint-disable-next-line no-console
        console.error("[Supabase Insert Error]:", dbErr);
      }
    }

    addInquiryToStore(inquiry);

    // 8. Fire-and-forget notification email to villa owner
    sendOwnerInquiryNotification(inquiry).catch(() => {});

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
      estimatedTotalAED: inquiry.estimatedTotalAED,
      nights: inquiry.nights,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Inquiry API Error]:", error);
    return NextResponse.json(
      { error: "Internal server error processing inquiry" },
      { status: 500 }
    );
  }
}
