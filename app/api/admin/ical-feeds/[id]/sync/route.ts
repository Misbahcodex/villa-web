import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { getIcalFeeds, replaceFeedBlocks } from "@/lib/db/store";
import { parseIcal } from "@/lib/ical";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feeds = await getIcalFeeds();
  const feed = feeds.find((f) => f.id === params.id);

  if (!feed) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { "User-Agent": "RizqVilla-iCalSync/1.0" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const icsText = await res.text();
    const events = parseIcal(icsText);

    const newBlocks = events.map((ev) => ({
      roomTypeId: feed.roomTypeId,
      startDate: ev.startDate,
      endDate: ev.endDate,
      units: 1,
      reason: ev.summary || `Imported from ${feed.label}`,
      source: feed.label,
    }));

    await replaceFeedBlocks(feed.roomTypeId, feed.label, newBlocks);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${events.length} blocked events from ${feed.label}`,
      eventsCount: events.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Sync failed: ${errorMsg}` }, { status: 500 });
  }
}
