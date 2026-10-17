import { PricingCalculation } from "@/types";

/**
 * Calculates calendar nights between check-in and check-out dates.
 * Returns 0 if either date is missing or if check-out is on/before check-in.
 */
export function calculateNights(
  checkIn?: string | Date | null,
  checkOut?: string | Date | null
): number {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const startDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const endDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }

  // Normalize to UTC midnight to avoid DST or timezone edge cases
  const startUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  if (endUTC <= startUTC) {
    return 0;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((endUTC - startUTC) / msPerDay);
}

/**
 * Computes discount amount rounded to nearest integer AED.
 */
export function calculateDiscount(subtotal: number, discountPercent: number): number {
  if (subtotal <= 0 || discountPercent <= 0) {
    return 0;
  }
  return Math.round((subtotal * discountPercent) / 100);
}

export interface CalculateBookingPriceParams {
  startingRateAED: number;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  discountPercent?: number;
}

/**
 * Calculates complete pricing breakdown for a direct reservation.
 */
export function calculateBookingPrice({
  startingRateAED,
  checkIn,
  checkOut,
  discountPercent = 15,
}: CalculateBookingPriceParams): PricingCalculation {
  const rate = Math.max(0, startingRateAED);
  const nights = calculateNights(checkIn, checkOut);
  const subtotal = rate * nights;
  const discountAmount = calculateDiscount(subtotal, discountPercent);
  const totalAED = Math.max(0, subtotal - discountAmount);

  return {
    nights,
    nightlyRate: rate,
    subtotal,
    discountPercent,
    discountAmount,
    totalAED,
  };
}

/**
 * Formats AED currency values consistently without decimals.
 */
export function formatAED(amount: number): string {
  const safeAmount = Math.max(0, Math.round(amount || 0));
  return `AED ${safeAmount.toLocaleString("en-US")}`;
}
