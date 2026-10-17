import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";
import { getCalendar } from "@/lib/availability";
import { getRoomTypes, getBookings, getBlocks } from "@/lib/db/store";
import { validRoomIds } from "@/lib/validation";

const querySchema = z.object({
  room: z.enum(validRoomIds, {
    errorMap: () => ({ message: "Invalid room type" }),
  }),
  month: z.string().regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format"),
});

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimit = checkRateLimit(ip, 60, 60 * 1000);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawParams = {
    room: searchParams.get("room"),
    month: searchParams.get("month"),
  };

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { room, month } = parsed.data;

  const [roomTypes, bookings, blocks] = await Promise.all([
    getRoomTypes(),
    getBookings(),
    getBlocks(),
  ]);

  const calendar = getCalendar(room, month, { roomTypes, bookings, blocks });

  return NextResponse.json(calendar);
}
