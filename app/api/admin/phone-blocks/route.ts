import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { getBlockedPhoneNumbers, blockPhoneNumber } from "@/lib/db/store";
import { z } from "zod";

const blockPhoneSchema = z.object({
  phone: z.string().min(6, "Phone number must be at least 6 digits"),
});

export async function GET() {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await getBlockedPhoneNumbers();
  return NextResponse.json({ blockedPhoneNumbers: blocked });
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

  const parsed = blockPhoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone number", details: parsed.error.flatten() }, { status: 400 });
  }

  await blockPhoneNumber(parsed.data.phone, "admin");
  const blocked = await getBlockedPhoneNumbers();
  return NextResponse.json({ success: true, blockedPhoneNumbers: blocked });
}
