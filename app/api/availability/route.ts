import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAvailability, findAlternativeDates, findAlternativeRooms } from "@/lib/availability";
import { getRoomTypes, getBookings, getBlocks } from "@/lib/db/store";
import { validRoomIds } from "@/lib/validation";

const querySchema = z
  .object({
    room: z.enum(validRoomIds, {
      errorMap: () => ({ message: "Invalid room type" }),
    }),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "checkIn must be YYYY-MM-DD"),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "checkOut must be YYYY-MM-DD"),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimit = checkRateLimit(ip, 60, 60 * 1000); // 60 per minute for reads

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawParams = {
    room: searchParams.get("room"),
    checkIn: searchParams.get("checkIn"),
    checkOut: searchParams.get("checkOut"),
  };

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { room, checkIn, checkOut } = parsed.data;

  const [roomTypes, bookings, blocks] = await Promise.all([
    getRoomTypes(),
    getBookings(),
    getBlocks(),
  ]);

  const context = { roomTypes, bookings, blocks };
  const availability = getAvailability(room, checkIn, checkOut, context);

  let alternativeDates: { checkIn: string; checkOut: string; minUnitsLeft: number }[] = [];
  let alternativeRooms: { roomTypeId: string; roomName: string; minUnitsLeft: number }[] = [];

  if (!availability.isAvailable) {
    alternativeDates = findAlternativeDates(room, checkIn, checkOut, context);
    alternativeRooms = findAlternativeRooms(checkIn, checkOut, room, context);
  }

  return NextResponse.json({
    ...availability,
    alternativeDates,
    alternativeRooms,
  });
}
