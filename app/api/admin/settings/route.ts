import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { getRoomTypes, updateRoomTypeUnits, getPropertyFacts, countAwaitingConfirmation } from "@/lib/db/store";
import { propertyPolicies } from "@/data/policies";
import { propertyAddons } from "@/data/addons";

export async function GET(req: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomTypes = await getRoomTypes();
  const facts = await getPropertyFacts();
  const awaitingCount = countAwaitingConfirmation(facts);
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const token = process.env.ICAL_FEED_TOKEN || "rizq_demo_ical_token_secure_2026";

  const outboundFeeds = roomTypes.map((r) => ({
    roomId: r.id,
    roomName: r.name,
    slug: r.slug,
    exportUrl: `${origin}/api/ical/${r.slug}.ics?token=${token}`,
  }));

  return NextResponse.json({
    roomTypes,
    policies: propertyPolicies,
    facts,
    awaitingCount,
    addons: propertyAddons,
    outboundFeeds,
  });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (body.units && typeof body.units === "object") {
      for (const [roomId, count] of Object.entries(body.units)) {
        if (typeof count === "number" && count > 0) {
          await updateRoomTypeUnits(roomId, count);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 400 });
  }
}
