import { NextRequest, NextResponse } from "next/server";
import { expireHolds } from "@/lib/db/store";

const CRON_SECRET = process.env.CRON_SECRET || "demo_cron_secret_2026";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, "");

  if (providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  const expiredCount = await expireHolds();

  return NextResponse.json({
    success: true,
    expiredHoldsCount: expiredCount,
    timestamp: new Date().toISOString(),
  });
}
