import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { cancelBooking } from "@/lib/db/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reason = "Cancelled by manager";
  try {
    const body = await req.json();
    if (body.reason && typeof body.reason === "string") {
      reason = body.reason.trim();
    }
  } catch {
    // Default reason
  }

  const booking = await cancelBooking(params.id, reason, "admin");
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, booking });
}
