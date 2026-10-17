import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { getIcalFeeds, createIcalFeed } from "@/lib/db/store";
import { z } from "zod";
import { validRoomIds } from "@/lib/validation";

const createFeedSchema = z.object({
  roomTypeId: z.enum(validRoomIds),
  url: z.string().url("Please provide a valid iCal feed URL (e.g. https://...)"),
  label: z.string().min(2, "Feed label must have at least 2 characters"),
});

export async function GET() {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feeds = await getIcalFeeds();
  return NextResponse.json({ feeds });
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

  const parsed = createFeedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const feed = await createIcalFeed(parsed.data);
  return NextResponse.json({ success: true, feed });
}
