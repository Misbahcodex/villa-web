import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { getInquiriesStore, updateInquiryStatusInStore } from "@/lib/inquiryStore";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import { InquiryRecord, InquiryStatus } from "@/types";

export async function GET(request: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const searchQuery = searchParams.get("q")?.toLowerCase();

  let inquiries: InquiryRecord[] = [];

  if (isSupabaseConfigured && supabaseServer) {
    try {
      let query = supabaseServer
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "All") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        inquiries = data.map((d) => ({
          id: d.id,
          createdAt: d.created_at,
          guestName: d.guest_name,
          guestEmail: d.guest_email || undefined,
          guestPhone: d.guest_phone || undefined,
          roomId: d.room_id,
          checkIn: d.check_in,
          checkOut: d.check_out,
          nights: d.nights,
          guests: d.guests,
          estimatedTotalAED: Number(d.estimated_total_aed),
          promoCode: d.promo_code,
          specialRequests: d.special_requests || undefined,
          status: d.status,
          notes: d.internal_notes || undefined,
        }));
      }
    } catch {
      // Fallback to store on database query error
      inquiries = getInquiriesStore();
    }
  } else {
    inquiries = getInquiriesStore();
  }

  if (statusFilter && statusFilter !== "All") {
    inquiries = inquiries.filter((i) => i.status === statusFilter);
  }

  if (searchQuery) {
    inquiries = inquiries.filter(
      (i) =>
        i.guestName.toLowerCase().includes(searchQuery) ||
        (i.guestEmail && i.guestEmail.toLowerCase().includes(searchQuery)) ||
        i.roomId.toLowerCase().includes(searchQuery)
    );
  }

  return NextResponse.json({ inquiries });
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status, notes } = (await request.json()) as {
      id: string;
      status: InquiryStatus;
      notes?: string;
    };

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer
        .from("inquiries")
        .update({
          status,
          internal_notes: notes ?? null,
        })
        .eq("id", id);
    }

    updateInquiryStatusInStore(id, status, notes);

    return NextResponse.json({ success: true, id, status });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
