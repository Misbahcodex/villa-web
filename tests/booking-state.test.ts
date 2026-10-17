import { describe, it, expect, beforeEach } from "vitest";
import {
  createBookingRequest,
  confirmBooking,
  declineBooking,
  cancelBooking,
  expireHolds,
  clearDemoData,
  getBookingById,
  getAuditLogs,
} from "@/lib/db/store";
import {
  buildOwnerConfirmationWhatsAppLink,
  buildOwnerDeclineWhatsAppLink,
} from "@/lib/notify/whatsappHelper";

describe("Booking State Machine & WhatsApp Helper Tests", () => {
  beforeEach(async () => {
    await clearDemoData();
  });

  it("transitions booking from pending to confirmed with audit logging", async () => {
    const res = await createBookingRequest({
      roomTypeId: "premium-single-capsule",
      checkIn: "2026-11-10",
      checkOut: "2026-11-14",
      adults: 1,
      children: 0,
      guestName: "Zaid Tariq",
      guestPhone: "+971501234567",
      estimatedTotalAED: 612,
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.booking.status).toBe("pending");
    expect(res.booking.holdExpiresAt).not.toBeNull();

    // Confirm booking
    const confirmed = await confirmBooking(res.booking.id, "owner-telegram");
    expect(confirmed).not.toBeNull();
    expect(confirmed?.status).toBe("confirmed");
    expect(confirmed?.holdExpiresAt).toBeNull(); // Hold converted to confirmed

    // Audit log check
    const logs = await getAuditLogs(res.booking.id);
    const confirmLog = logs.find((l) => l.action === "confirmed");
    expect(confirmLog).toBeDefined();
    expect(confirmLog?.actor).toBe("owner-telegram");
  });

  it("transitions booking from pending to declined and records decline reason", async () => {
    const res = await createBookingRequest({
      roomTypeId: "deluxe-double-capsule",
      checkIn: "2026-11-12",
      checkOut: "2026-11-16",
      adults: 2,
      children: 0,
      guestName: "Sara Khan",
      guestPhone: "+971507654321",
      estimatedTotalAED: 884,
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    const declined = await declineBooking(res.booking.id, "Private villa buyout on selected dates", "admin");
    expect(declined).not.toBeNull();
    expect(declined?.status).toBe("declined");
    expect(declined?.declineReason).toBe("Private villa buyout on selected dates");
  });

  it("expires holds automatically when hold time has elapsed", async () => {
    const res = await createBookingRequest({
      roomTypeId: "premium-single-capsule",
      checkIn: "2026-11-05",
      checkOut: "2026-11-08",
      adults: 1,
      children: 0,
      guestName: "Late Responding Guest",
      guestPhone: "+971505555555",
      estimatedTotalAED: 459,
      holdHours: 12,
    });

    expect(res.success).toBe(true);
    if (!res.success) return;

    // Fast-forward simulated time by 13 hours
    const futureTime = new Date(Date.now() + 13 * 3600000);
    const expiredCount = await expireHolds(futureTime);

    expect(expiredCount).toBeGreaterThanOrEqual(1);

    const updated = await getBookingById(res.booking.id);
    expect(updated?.status).toBe("expired");
  });

  it("generates correct, pre-filled WhatsApp confirmation deep link for owner", () => {
    const mockBooking = {
      id: "b-test",
      ref: "RZQ-WA772K",
      roomTypeId: "deluxe-double-capsule",
      checkIn: "2026-11-10",
      checkOut: "2026-11-14",
      adults: 2,
      children: 0,
      guestName: "Elena Rostova",
      guestPhone: "+971 50 123 4567",
      guestEmail: null,
      notes: "",
      promoCode: "RIZQDIRECT",
      estimatedTotalAED: 884,
      addons: [],
      status: "confirmed" as const,
      holdExpiresAt: null,
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const link = buildOwnerConfirmationWhatsAppLink(mockBooking, "Deluxe Double Capsule Pod");
    expect(link).toContain("https://wa.me/971501234567");
    expect(link).toContain(encodeURIComponent("RZQ-WA772K"));
    expect(link).toContain(encodeURIComponent("Elena Rostova"));
    expect(link).toContain(encodeURIComponent("CONFIRMED"));
  });

  it("generates polite WhatsApp decline link with reason", () => {
    const mockBooking = {
      id: "b-test-dec",
      ref: "RZQ-DEC881",
      roomTypeId: "executive-private-suite",
      checkIn: "2026-11-15",
      checkOut: "2026-11-18",
      adults: 2,
      children: 0,
      guestName: "John Smith",
      guestPhone: "+44 7700 900123",
      guestEmail: null,
      notes: "",
      promoCode: "RIZQDIRECT",
      estimatedTotalAED: 1620,
      addons: [],
      status: "declined" as const,
      holdExpiresAt: null,
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const link = buildOwnerDeclineWhatsAppLink(mockBooking, "Executive Private Suite", "Maintenance underway");
    expect(link).toContain("https://wa.me/447700900123");
    expect(link).toContain(encodeURIComponent("RZQ-DEC881"));
    expect(link).toContain(encodeURIComponent("Maintenance underway"));
  });
});
