import { describe, it, expect } from "vitest";
import { generateRoomIcalFeed, parseIcal } from "@/lib/ical";
import { BookingRecord, BlockRecord, RoomTypeRecord } from "@/types";

describe("iCalendar Engine: Generation & Parsing Tests", () => {
  const sampleRoom: RoomTypeRecord = {
    id: "premium-single-capsule",
    slug: "single-capsule",
    name: "Premium Single Capsule Pod",
    unitsTotal: 8,
    baseRateAED: 180,
    maxGuests: 1,
  };

  const sampleBookings: BookingRecord[] = [
    {
      id: "b-01",
      ref: "RZQ-SECRET",
      roomTypeId: "premium-single-capsule",
      checkIn: "2026-11-10",
      checkOut: "2026-11-14",
      adults: 1,
      children: 0,
      guestName: "Secret Celebrity Guest",
      guestPhone: "+971501234567",
      guestEmail: "vip@topsecret.ae",
      notes: "Do not disclose presence to anyone",
      promoCode: "RIZQDIRECT",
      estimatedTotalAED: 612,
      addons: [],
      status: "confirmed",
      holdExpiresAt: null,
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "b-pending",
      ref: "RZQ-PENDING",
      roomTypeId: "premium-single-capsule",
      checkIn: "2026-11-20",
      checkOut: "2026-11-25",
      adults: 1,
      children: 0,
      guestName: "Pending Hold Guest",
      guestPhone: "+971509999999",
      guestEmail: null,
      notes: "",
      promoCode: "RIZQDIRECT",
      estimatedTotalAED: 765,
      addons: [],
      status: "pending", // Only confirmed bookings are published in external feeds
      holdExpiresAt: new Date().toISOString(),
      source: "website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleBlocks: BlockRecord[] = [
    {
      id: "blk-01",
      roomTypeId: "premium-single-capsule",
      startDate: "2026-11-01",
      endDate: "2026-11-04",
      units: 1,
      reason: "Quarterly Maintenance",
      source: "manual",
      createdAt: new Date().toISOString(),
    },
  ];

  it("generates a valid RFC 5545 iCalendar feed without guest PII", () => {
    const ics = generateRoomIcalFeed(sampleRoom, sampleBookings, sampleBlocks);

    // Structure validation
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("END:VCALENDAR");

    // Confirmed booking is included
    expect(ics).toContain("DTSTART;VALUE=DATE:20261110");
    expect(ics).toContain("DTEND;VALUE=DATE:20261114");
    expect(ics).toContain("SUMMARY:Booked");

    // Block is included
    expect(ics).toContain("DTSTART;VALUE=DATE:20261101");
    expect(ics).toContain("DTEND;VALUE=DATE:20261104");
    expect(ics).toContain("SUMMARY:Quarterly Maintenance");

    // STRICT PRIVACY RULES: PII must NEVER appear in outbound feeds
    expect(ics).not.toContain("Secret Celebrity Guest");
    expect(ics).not.toContain("vip@topsecret.ae");
    expect(ics).not.toContain("+971501234567");
    expect(ics).not.toContain("Do not disclose presence");
    expect(ics).not.toContain("Pending Hold Guest"); // Pending holds not published
  });

  it("parses valid RFC 5545 inbound feeds from external platforms", () => {
    const sampleOtaIcs = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Hosting Calendar 1.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:airbnb-reservation-12345@airbnb.com
DTSTART;VALUE=DATE:20261205
DTEND;VALUE=DATE:20261210
SUMMARY:Reserved - John Doe
END:VEVENT
BEGIN:VEVENT
UID:airbnb-reservation-67890@airbnb.com
DTSTART:20261215T120000Z
DTEND:20261218T100000Z
SUMMARY:Not Available
END:VEVENT
END:VCALENDAR
`.trim();

    const events = parseIcal(sampleOtaIcs);
    expect(events.length).toBe(2);

    expect(events[0].startDate).toBe("2026-12-05");
    expect(events[0].endDate).toBe("2026-12-10");
    expect(events[0].summary).toBe("Reserved - John Doe");

    expect(events[1].startDate).toBe("2026-12-15");
    expect(events[1].endDate).toBe("2026-12-18");
  });

  it("correctly unfolds multiline descriptions and summaries", () => {
    const foldedIcs = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:folded-event-1
DTSTART;VALUE=DATE:20261101
DTEND;VALUE=DATE:20261103
SUMMARY:Long Folded Summary That Continues
 On The Second Line
END:VEVENT
END:VCALENDAR
`.trim();

    const events = parseIcal(foldedIcs);
    expect(events.length).toBe(1);
    expect(events[0].summary).toBe("Long Folded Summary That ContinuesOn The Second Line");
  });

  it("gracefully handles malformed, corrupted, or empty .ics feeds without crashing", () => {
    const malformedCases = [
      "", // Empty string
      "CORRUPTED HEADER NOT ICAL",
      `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:broken\nSUMMARY:No Dates\nEND:VEVENT\nEND:VCALENDAR`, // Missing DTSTART & DTEND
      `BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:INVALID_DATE\nDTEND:INVALID_DATE\nEND:VEVENT`, // Invalid date string
      `BEGIN:VEVENT\nDTSTART;VALUE=DATE:20261101\n// Broken file abruptly ending without END:VEVENT`, // Incomplete file
    ];

    for (const badIcs of malformedCases) {
      expect(() => {
        const events = parseIcal(badIcs);
        expect(Array.isArray(events)).toBe(true);
      }).not.toThrow();
    }
  });
});
