import { describe, it, expect } from "vitest";
import {
  calculateNights,
  calculateDiscount,
  calculateBookingPrice,
  formatAED,
} from "@/lib/pricing";

describe("Pricing and Nights Calculations", () => {
  it("calculates correct calendar nights between two dates", () => {
    const nights = calculateNights("2026-11-01", "2026-11-05");
    expect(nights).toBe(4);
  });

  it("handles date-order edge case: check-out equal to or before check-in returns 0", () => {
    // Same day check-out
    expect(calculateNights("2026-11-05", "2026-11-05")).toBe(0);
    // Reverse order
    expect(calculateNights("2026-11-10", "2026-11-05")).toBe(0);
  });

  it("handles missing or invalid dates gracefully", () => {
    expect(calculateNights(undefined, "2026-11-05")).toBe(0);
    expect(calculateNights("2026-11-01", null)).toBe(0);
    expect(calculateNights("invalid-date", "2026-11-05")).toBe(0);
  });

  it("calculates exact 15% direct discount correctly", () => {
    // Subtotal 1,000 AED with 15% discount -> 150 AED
    expect(calculateDiscount(1000, 15)).toBe(150);
    // Subtotal 180 AED with 15% discount -> 27 AED
    expect(calculateDiscount(180, 15)).toBe(27);
    // 0 subtotal -> 0 discount
    expect(calculateDiscount(0, 15)).toBe(0);
  });

  it("calculates comprehensive booking price breakdown", () => {
    const rate = 180; // Single capsule
    const pricing = calculateBookingPrice({
      startingRateAED: rate,
      checkIn: "2026-11-01",
      checkOut: "2026-11-04", // 3 nights
      discountPercent: 15,
    });

    expect(pricing.nights).toBe(3);
    expect(pricing.nightlyRate).toBe(180);
    expect(pricing.subtotal).toBe(540); // 3 * 180
    expect(pricing.discountPercent).toBe(15);
    expect(pricing.discountAmount).toBe(81); // 540 * 0.15 = 81
    expect(pricing.totalAED).toBe(459); // 540 - 81
  });

  it("formats AED amounts cleanly without decimals", () => {
    expect(formatAED(459)).toBe("AED 459");
    expect(formatAED(12500)).toBe("AED 12,500");
    expect(formatAED(0)).toBe("AED 0");
  });

  it("calculates direct booking commission savings correctly", () => {
    const bookings = 25;
    const avgValue = 850;
    const commission = 15; // 15%

    const monthlySavings = Math.round(bookings * avgValue * (commission / 100));
    const yearlySavings = monthlySavings * 12;

    expect(monthlySavings).toBe(3188); // 25 * 850 * 0.15 = 3187.5 -> 3188
    expect(yearlySavings).toBe(38256); // 3188 * 12
    expect(formatAED(monthlySavings)).toBe("AED 3,188");
    expect(formatAED(yearlySavings)).toBe("AED 38,256");
  });
});
