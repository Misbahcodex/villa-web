import { NextRequest, NextResponse } from "next/server";
import { getIcalFeeds, replaceFeedBlocks, addAuditLog } from "@/lib/db/store";
import { parseIcal } from "@/lib/ical";

const CRON_SECRET = process.env.CRON_SECRET || "demo_cron_secret_2026";

export async function POST(req: NextRequest) {
  // Verify Bearer authorization
  const authHeader = req.headers.get("authorization");
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, "");

  if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  const feeds = await getIcalFeeds();
  const results: { feedId: string; label: string; eventsCount: number; status: string }[] = [];

  for (const feed of feeds) {
    try {
      // Fetch external .ics feed with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

      // Convert events to block records
      const newBlocks = events.map((ev) => ({
        roomTypeId: feed.roomTypeId,
        startDate: ev.startDate,
        endDate: ev.endDate,
        units: 1, // Assume 1 unit blocked per OTA event
        reason: ev.summary || `Imported from ${feed.label}`,
        source: feed.label,
      }));

      await replaceFeedBlocks(feed.roomTypeId, feed.label, newBlocks);

      results.push({
        feedId: feed.id,
        label: feed.label,
        eventsCount: events.length,
        status: "success",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({
        feedId: feed.id,
        label: feed.label,
        eventsCount: 0,
        status: `error: ${errorMsg}`,
      });
    }
  }

  await addAuditLog({
    actor: "cron",
    action: "ical_sync_batch",
    meta: { results, timestamp: new Date().toISOString() },
  });

  return NextResponse.json({ success: true, syncedFeeds: results.length, details: results });
}
