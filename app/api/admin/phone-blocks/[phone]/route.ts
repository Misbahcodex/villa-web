import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { unblockPhoneNumber, getBlockedPhoneNumbers } from "@/lib/db/store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { phone: string } }
) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phone = decodeURIComponent(params.phone || "");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
  }

  const removed = await unblockPhoneNumber(phone, "admin");
  const blocked = await getBlockedPhoneNumbers();

  return NextResponse.json({
    success: removed,
    blockedPhoneNumbers: blocked,
  });
}
