import { describe, it, expect } from "vitest";
import {
  getNightsBetween,
  getNightOccupancy,
  getAvailability,
  getCalendar,
  doesBookingCoverNight,
  doesBlockCoverNight,
} from "@/lib/availability";
import { BookingRecord, BlockRecord, RoomTypeRecord } from "@/types";

describe("Availability Engine — Unit Tests & Boundary Conditions", () => {
  const sampleRoom: RoomTypeRecord = {
    id: "deluxe-double-capsule",
    slug: "double-capsule",
    name: "Deluxe Double Capsule Pod",
    unitsTotal: 2, // 2 units for testing boundary conditions
    baseRateAED: 260,
    maxGuests: 2,
  };

  const context = {
    roomTypes: [sampleRoom],
    bookings: [] as BookingRecord[],
    blocks: [] as BlockRecord[],
  };

  it("calculates stay nights correctly (excluding check-out day)", () => {
    const nights = getNightsBetween("2026-11-01", "2026-11-04");
    expect(nights).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
    expect(nights.length).toBe(3);
  });

  it("handles same-day turnover without collision", () => {
    // Guest A stays Oct 1 to Oct 5 (nights: Oct 1, 2, 3, 4)
    // Guest B arrives Oct 5 to Oct 8 (nights: Oct 5, 6, 7)
    const bookingA: BookingRecord = {
      id: "b-a",
      ref: "RZQ-TESTA1",
      roomTypeId: "deluxe-double-capsule",
      checkIn: "2026-10-01",
      checkOut: "2026-10-05",
      adults: 2,
      children: 0,
      guestName: "Guest A",
      guestPhone: "+971501111111",
      guestEmail: null,
      notes: "",
      promoCode: "RIZQDIRECT",
      estimatedTotalAED: 1040,
      addons: [],
      status: "confirmed",
      holdExpiresAt: null,
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // On night of Oct 5, Guest A is already checked out!
    expect(doesBookingCoverNight(bookingA, "2026-10-04")).toBe(true);
    expect(doesBookingCoverNight(bookingA, "2026-10-05")).toBe(false);

    const avail = getAvailability("deluxe-double-capsule", "2026-10-05", "2026-10-08", {
      roomTypes: [sampleRoom],
      bookings: [bookingA],
      blocks: [],
    });

    expect(avail.isAvailable).toBe(true);
    expect(avail.minUnitsLeft).toBe(2);
  });

  it("correctly identifies the last unit and prevents overbooking", () => {
    const singleUnitRoom: RoomTypeRecord = {
      id: "executive-private-suite",
      slug: "private-suite",
      name: "Executive Private Suite",
      unitsTotal: 1, // Only 1 unit in total
      baseRateAED: 540,
      maxGuests: 2,
    };

    const existingBooking: BookingRecord = {
      id: "b-suite-1",
      ref: "RZQ-SUITE1",
      roomTypeId: "executive-private-suite",
      checkIn: "2026-11-10",
      checkOut: "2026-11-15",
      adults: 2,
      children: 0,
      guestName: "VIP Guest",
      guestPhone: "+971502222222",
      guestEmail: null,
      notes: "",
      promoCode: "RIZQDIRECT",
      estimatedTotalAED: 2700,
      addons: [],
      status: "confirmed",
      holdExpiresAt: null,
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check availability during the booked window
    const availOverlap = getAvailability("executive-private-suite", "2026-11-12", "2026-11-14", {
      roomTypes: [singleUnitRoom],
      bookings: [existingBooking],
      blocks: [],
    });

    expect(availOverlap.isAvailable).toBe(false);
    expect(availOverlap.minUnitsLeft).toBe(0);

    // Check availability right after check-out
    const availAfter = getAvailability("executive-private-suite", "2026-11-15", "2026-11-18", {
      roomTypes: [singleUnitRoom],
      bookings: [existingBooking],
      blocks: [],
    });

    expect(availAfter.isAvailable).toBe(true);
    expect(availAfter.minUnitsLeft).toBe(1);
  });

  it("releases inventory when pending hold has expired", () => {
    const expiredBooking: BookingRecord = {
      id: "b-exp",
      ref: "RZQ-EXP001",
      roomTypeId: "deluxe-double-capsule",
      checkIn: "2026-11-20",
      checkOut: "2026-11-25",
      adults: 2,
      children: 0,
      guestName: "Expired Guest",
      guestPhone: "+971503333333",
      guestEmail: null,
      notes: "",
      promoCode: "RIZQDIRECT",
      estimatedTotalAED: 1040,
      addons: [],
      status: "pending",
      // Expired 2 hours ago
      holdExpiresAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const avail = getAvailability("deluxe-double-capsule", "2026-11-20", "2026-11-25", {
      roomTypes: [sampleRoom],
      bookings: [expiredBooking],
      blocks: [],
      now: new Date(),
    });

    // Since hold has expired, unitsLeft must remain 2!
    expect(avail.isAvailable).toBe(true);
    expect(avail.minUnitsLeft).toBe(2);
  });

  it("reduces availability when manual blocks or iCal blocks are present", () => {
    const maintenanceBlock: BlockRecord = {
      id: "blk-ac",
      roomTypeId: "deluxe-double-capsule",
      startDate: "2026-11-01",
      endDate: "2026-11-03", // 2 nights: Nov 1, Nov 2
      units: 1,
      reason: "AC Filter Service",
      source: "manual",
      createdAt: new Date().toISOString(),
    };

    const avail = getAvailability("deluxe-double-capsule", "2026-11-01", "2026-11-04", {
      roomTypes: [sampleRoom], // total units = 2
      bookings: [],
      blocks: [maintenanceBlock],
    });

    expect(avail.isAvailable).toBe(true);
    expect(avail.minUnitsLeft).toBe(1); // 2 - 1 block = 1 left
    expect(avail.perNight["2026-11-01"]).toBe(1);
    expect(avail.perNight["2026-11-02"]).toBe(1);
    expect(avail.perNight["2026-11-03"]).toBe(2); // Block ended!
  });

  it("accurately computes min units across multi-night stays", () => {
    // 2 total units
    // Night 1 (Nov 1): 0 booked -> 2 left
    // Night 2 (Nov 2): 1 booked -> 1 left
    // Night 3 (Nov 3): 0 booked -> 2 left
    const bookingMid: BookingRecord = {
      id: "b-mid",
      ref: "RZQ-MID001",
      roomTypeId: "deluxe-double-capsule",
      checkIn: "2026-11-02",
      checkOut: "2026-11-03",
      adults: 2,
      children: 0,
      guestName: "One Night Guest",
      guestPhone: "+971504444444",
      guestEmail: null,
      notes: "",
      promoCode: "RIZQDIRECT",
      estimatedTotalAED: 260,
      addons: [],
      status: "confirmed",
      holdExpiresAt: null,
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const avail = getAvailability("deluxe-double-capsule", "2026-11-01", "2026-11-04", {
      roomTypes: [sampleRoom],
      bookings: [bookingMid],
      blocks: [],
    });

    expect(avail.minUnitsLeft).toBe(1);
    expect(avail.perNight["2026-11-01"]).toBe(2);
    expect(avail.perNight["2026-11-02"]).toBe(1);
    expect(avail.perNight["2026-11-03"]).toBe(2);
  });
});
