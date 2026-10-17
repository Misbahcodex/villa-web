import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { confirmBooking } from "@/lib/db/store";
import { dispatchBookingConfirmedNotification } from "@/lib/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await confirmBooking(params.id, "admin");
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Non-blocking guest confirmation email
  dispatchBookingConfirmedNotification(booking).catch(() => {});

  return NextResponse.json({ success: true, booking });
}
