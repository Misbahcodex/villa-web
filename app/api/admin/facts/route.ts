import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import {
  getPropertyFacts,
  updatePropertyFact,
  countAwaitingConfirmation,
} from "@/lib/db/store";

export async function GET() {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const facts = await getPropertyFacts();
  const awaitingCount = countAwaitingConfirmation(facts);

  return NextResponse.json({ facts, awaitingCount });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.key && (body.status !== undefined || body.value !== undefined)) {
      const updated = await updatePropertyFact(body.key, {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.sources !== undefined && { sources: body.sources }),
        ...(body.note !== undefined && { note: body.note }),
      });
      const awaitingCount = countAwaitingConfirmation(updated);
      return NextResponse.json({ success: true, facts: updated, awaitingCount });
    }

    if (body.facts && typeof body.facts === "object") {
      let currentFacts = await getPropertyFacts();
      for (const [key, factData] of Object.entries(body.facts)) {
        if (typeof factData === "object" && factData !== null) {
          currentFacts = await updatePropertyFact(key, factData as any);
        }
      }
      const awaitingCount = countAwaitingConfirmation(currentFacts);
      return NextResponse.json({ success: true, facts: currentFacts, awaitingCount });
    }

    return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update property facts" }, { status: 400 });
  }
}
