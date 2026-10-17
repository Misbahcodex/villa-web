import { NextRequest, NextResponse } from "next/server";
import { getRoomTypes, getBookings, getBlocks } from "@/lib/db/store";
import { generateRoomIcalFeed } from "@/lib/ical";

const EXPECTED_TOKEN = process.env.ICAL_FEED_TOKEN || "rizq_demo_ical_token_secure_2026";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomSlug: string } }
) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  // Clean roomSlug (strip any trailing .ics)
  const roomSlug = params.roomSlug.replace(/\.ics$/i, "");

  // Verify private token
  if (!token || token !== EXPECTED_TOKEN) {
    return new NextResponse("Unauthorized: Invalid iCal feed token", { status: 401 });
  }

  const roomTypes = await getRoomTypes();
  const room = roomTypes.find((r) => r.slug === roomSlug || r.id === roomSlug);

  if (!room) {
    return new NextResponse("Room type not found", { status: 404 });
  }

  const [bookings, blocks] = await Promise.all([getBookings(), getBlocks()]);

  // Generate RFC 5545 iCal stream with zero guest PII
  const icalString = generateRoomIcalFeed(room, bookings, blocks);

  return new NextResponse(icalString, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${room.slug}.ics"`,
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
    },
  });
}
