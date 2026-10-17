import { InquiryRecord, InquiryStatus, RoomId } from "@/types";

// Seed data so the /admin dashboard has immediate realistic data to demonstrate
// filters, status updates, and CSV export even without an external database connected.
const globalInquiries: InquiryRecord[] = [
  {
    id: "inq-9821a301",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    guestName: "Marcus Lindqvist",
    guestEmail: "marcus.l@stockholm-tech.io",
    guestPhone: "+46 70 123 4567",
    roomId: "deluxe-double-capsule",
    checkIn: "2026-11-05",
    checkOut: "2026-11-12",
    nights: 7,
    guests: 2,
    estimatedTotalAED: 1547,
    promoCode: "RIZQDIRECT",
    specialRequests: "Arriving on evening flight from Stockholm. Need dual quiet workspace.",
    status: "New",
  },
  {
    id: "inq-8842b109",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    guestName: "Elena Rostova",
    guestEmail: "elena@remote-design.co",
    guestPhone: "+44 7700 900123",
    roomId: "executive-private-suite",
    checkIn: "2026-11-15",
    checkOut: "2026-11-22",
    nights: 7,
    guests: 1,
    estimatedTotalAED: 3213,
    promoCode: "RIZQDIRECT",
    specialRequests: "Private call hours between 2 PM and 6 PM UK time.",
    status: "Contacted",
  },
  {
    id: "inq-7719c402",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    guestName: "Tariq Al-Hashemi",
    guestEmail: "tariq@mena-ventures.com",
    guestPhone: "+971 50 999 1234",
    roomId: "premium-single-capsule",
    checkIn: "2026-11-02",
    checkOut: "2026-11-06",
    nights: 4,
    guests: 1,
    estimatedTotalAED: 612,
    promoCode: "RIZQDIRECT",
    specialRequests: "Early check-in request if possible.",
    status: "Confirmed",
  },
];

export function getInquiriesStore(): InquiryRecord[] {
  return globalInquiries;
}

export function addInquiryToStore(inquiry: InquiryRecord): void {
  globalInquiries.unshift(inquiry);
}

export function updateInquiryStatusInStore(id: string, status: InquiryStatus, notes?: string): boolean {
  const item = globalInquiries.find((i) => i.id === id);
  if (!item) return false;
  item.status = status;
  if (notes !== undefined) {
    item.notes = notes;
  }
  return true;
}
