import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { getBookings, createManualBooking, getRoomTypes } from "@/lib/db/store";
import { z } from "zod";
import { validRoomIds } from "@/lib/validation";

const manualBookingSchema = z.object({
  roomTypeId: z.enum(validRoomIds),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.coerce.number().min(1).max(4),
  guestName: z.string().min(2),
  guestPhone: z.string().min(5),
  guestEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  totalAED: z.coerce.number().min(0),
});

export async function GET(req: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const room = searchParams.get("room");
  const q = searchParams.get("q")?.toLowerCase();

  let bookings = await getBookings();

  if (status && status !== "all") {
    bookings = bookings.filter((b) => b.status === status);
  }

  if (room && room !== "all") {
    bookings = bookings.filter((b) => b.roomTypeId === room);
  }

  if (q) {
    bookings = bookings.filter(
      (b) =>
        b.ref.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.guestPhone.includes(q) ||
        (b.guestEmail && b.guestEmail.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = manualBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const newBooking = await createManualBooking({
    ...parsed.data,
    actor: "admin",
  });

  return NextResponse.json({ success: true, booking: newBooking });
}
