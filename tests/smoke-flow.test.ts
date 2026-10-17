import { describe, it, expect, beforeEach } from "vitest";
import {
  createBookingRequest,
  confirmBooking,
  getBookings,
  getRoomTypes,
  getBlocks,
  clearDemoData,
} from "@/lib/db/store";
import { getAvailability, getCalendar } from "@/lib/availability";

describe("Smoke Flow: Submit Booking -> Pending State -> Confirm in Admin -> Calendar Update", () => {
  beforeEach(async () => {
    await clearDemoData();
  });

  it("completes full lifecycle: guest submits booking, enters pending hold, admin confirms, calendar updates", async () => {
    const roomTypeId = "deluxe-double-capsule";
    const checkIn = "2026-12-10";
    const checkOut = "2026-12-14"; // 4 nights

    const [roomTypesBefore, bookingsBefore, blocksBefore] = await Promise.all([
      getRoomTypes(),
      getBookings(),
      getBlocks(),
    ]);

    // 1. Check initial availability: all 6 units are available
    const initialAvail = getAvailability(roomTypeId, checkIn, checkOut, {
      roomTypes: roomTypesBefore,
      bookings: bookingsBefore,
      blocks: blocksBefore,
    });
    expect(initialAvail.isAvailable).toBe(true);
    expect(initialAvail.minUnitsLeft).toBe(6);

    // 2. Step 1: Guest submits booking request
    const createResult = await createBookingRequest({
      roomTypeId,
      checkIn,
      checkOut,
      adults: 2,
      children: 0,
      guestName: "Marcus Lindqvist",
      guestPhone: "+46 70 123 4567",
      guestEmail: "marcus@stockholm-tech.io",
      notes: "High speed Wi-Fi needed for coding sessions",
      estimatedTotalAED: 884,
      holdHours: 12,
      source: "website",
    });

    expect(createResult.success).toBe(true);
    if (!createResult.success) return;

    const booking = createResult.booking;
    expect(booking.ref).toMatch(/^RZQ-[A-Z0-9]{6}$/);

    // 3. Step 2: Verify Pending Hold State & Inventory Lock
    expect(booking.status).toBe("pending");
    expect(booking.holdExpiresAt).not.toBeNull();

    // Verify calendar immediately reflects 1 unit held (5 left)
    const [roomTypesDuring, bookingsDuring, blocksDuring] = await Promise.all([
      getRoomTypes(),
      getBookings(),
      getBlocks(),
    ]);

    const availDuringHold = getAvailability(roomTypeId, checkIn, checkOut, {
      roomTypes: roomTypesDuring,
      bookings: bookingsDuring,
      blocks: blocksDuring,
    });
    expect(availDuringHold.isAvailable).toBe(true);
    expect(availDuringHold.minUnitsLeft).toBe(5); // 6 - 1 held = 5

    // 4. Step 3: Admin confirms the booking in the operations dashboard
    const confirmedBooking = await confirmBooking(booking.id, "admin");
    expect(confirmedBooking).not.toBeNull();
    expect(confirmedBooking?.status).toBe("confirmed");
    expect(confirmedBooking?.holdExpiresAt).toBeNull(); // Lock finalized

    // 5. Step 4: Verify Calendar Updates & Reflects Confirmed Stay
    const [roomTypesAfter, bookingsAfter, blocksAfter] = await Promise.all([
      getRoomTypes(),
      getBookings(),
      getBlocks(),
    ]);

    const calendar = getCalendar(roomTypeId, "2026-12", {
      roomTypes: roomTypesAfter,
      bookings: bookingsAfter,
      blocks: blocksAfter,
    });

    // Check days 10, 11, 12, 13 (nights of stay)
    const stayDays = calendar.days.filter((d) =>
      ["2026-12-10", "2026-12-11", "2026-12-12", "2026-12-13"].includes(d.date)
    );

    expect(stayDays.length).toBe(4);
    for (const day of stayDays) {
      expect(day.unitsLeft).toBe(5);
      expect(day.state).toBe("available");
    }

    // Check-out day (Dec 14) is not occupied!
    const checkoutDay = calendar.days.find((d) => d.date === "2026-12-14");
    expect(checkoutDay?.unitsLeft).toBe(6);
  });
});
