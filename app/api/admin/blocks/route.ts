import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { getBlocks, createBlock } from "@/lib/db/store";
import { z } from "zod";
import { validRoomIds } from "@/lib/validation";

const createBlockSchema = z.object({
  roomTypeId: z.enum(validRoomIds),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  units: z.coerce.number().min(1).default(1),
  reason: z.string().min(1).default("Manual calendar block"),
});

export async function GET() {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocks = await getBlocks();
  return NextResponse.json({ blocks });
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

  const parsed = createBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const block = await createBlock({
    ...parsed.data,
    source: "manual",
    actor: "admin",
  });

  return NextResponse.json({ success: true, block });
}
