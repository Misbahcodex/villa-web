import { describe, it, expect, beforeEach } from "vitest";
import {
  createBookingRequest,
  clearDemoData,
  updateRoomTypeUnits,
  getBookings,
} from "@/lib/db/store";

describe("Concurrency Test: Race-Safe Booking Creation", () => {
  beforeEach(async () => {
    // Clear existing bookings
    await clearDemoData();
    // Set Executive Private Suite to exactly 1 unit
    await updateRoomTypeUnits("executive-private-suite", 1);
  });

  it("fires 20 simultaneous requests at the last unit and asserts exactly one succeeds", async () => {
    const roomTypeId = "executive-private-suite";
    const checkIn = "2026-12-01";
    const checkOut = "2026-12-05";

    // Prepare 20 simultaneous booking requests
    const promises = Array.from({ length: 20 }, (_, i) =>
      createBookingRequest({
        roomTypeId,
        checkIn,
        checkOut,
        adults: 2,
        children: 0,
        guestName: `Concurrent Guest ${i + 1}`,
        guestPhone: `+971 50 000 ${String(i).padStart(4, "0")}`,
        guestEmail: `guest${i + 1}@test.com`,
        notes: `Simultaneous test request #${i + 1}`,
        estimatedTotalAED: 2160,
      })
    );

    // Fire all 20 requests simultaneously via Promise.all
    const results = await Promise.all(promises);

    const successful = results.filter((r) => r.success === true);
    const failed = results.filter((r) => r.success === false);

    // STRICT ASSERTION: Exactly 1 request succeeds, 19 fail
    expect(successful.length).toBe(1);
    expect(failed.length).toBe(19);

    if (successful[0].success) {
      expect(successful[0].booking.ref).toMatch(/^RZQ-[A-Z0-9]{6}$/);
      expect(successful[0].booking.status).toBe("pending");
      expect(successful[0].booking.holdExpiresAt).not.toBeNull();
    }

    // All failed requests must be rejected with SOLD_OUT
    for (const f of failed) {
      if (!f.success) {
        expect(f.code).toBe("SOLD_OUT");
      }
    }

    // Verify database state contains exactly 1 booking
    const allBookings = await getBookings();
    expect(allBookings.length).toBe(1);
  });
});
