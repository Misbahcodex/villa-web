/**
 * Rizq Luxurious Villa — Property Policies & Operational Rules
 *
 * Verification-status data model:
 * Facts about the property undergo approval before being confirmed to guests.
 * Items that are unconfirmed or conflicting show neutral fallback wording in the public UI.
 */

export type VerificationStatus = "confirmed" | "unconfirmed" | "conflicting";

export interface Verified<T> {
  value: T | null;
  status: VerificationStatus;
  sources?: string[]; // Internal research sources, never rendered in public UI
  note?: string;      // Internal operational note, never rendered in public UI
}

export interface PropertyPolicies {
  // Check-in and check-out windows
  checkInWindow: Verified<string>;
  checkOutTime: Verified<string>;

  // Age and guest policies
  adultsOnly: Verified<boolean>;
  minGuestAge: Verified<number>;

  // Core verified amenities from client brief
  outdoorPool: Verified<boolean>;
  coworking: Verified<boolean>;
  socialLounge: Verified<boolean>;
  wifiMbps: Verified<number>;

  // Unconfirmed amenities from third-party listings
  freeParking: Verified<boolean>;
  selfServeLaundry: Verified<boolean>;
  gym: Verified<boolean>;
  shuttle: Verified<boolean>;
  paymentPolicy: Verified<string>;

  // Unit inventory counts (operational for availability engine)
  unitsTotal: {
    "premium-single-capsule": number;
    "deluxe-double-capsule": number;
    "executive-private-suite": number;
  };

  // Base nightly rates in AED
  baseRatesAED: {
    "premium-single-capsule": number;
    "deluxe-double-capsule": number;
    "executive-private-suite": number;
  };

  // Direct privilege discount percentage
  directDiscountPercent: number;

  // Booking hold duration for unconfirmed requests
  holdDurationHours: number;

  // Data retention policy for privacy compliance
  retentionPeriodDays: number;
}

export const propertyPolicies: PropertyPolicies = {
  // Check-in window (conflicting across third-party listings)
  checkInWindow: {
    value: null,
    status: "conflicting",
    sources: [
      "Listing A: 09:00–23:00",
      "Listing B: 13:30–22:30",
      "Listing C: 15:00–00:00",
    ],
    note: "Arrival windows conflict across third-party channels.",
  },

  // Check-out time (conflicting between 11:00 and 12:00)
  checkOutTime: {
    value: null,
    status: "conflicting",
    sources: [
      "Listing A: 11:00",
      "Listing B: 12:00",
    ],
    note: "Check-out time varies between 11:00 and 12:00 across third-party channels.",
  },

  // Adults-only policy (CONFIRMED: multiple listings state children are not allowed)
  adultsOnly: {
    value: true,
    status: "confirmed",
    sources: [
      "Multiple booking listings state children are not allowed at this property.",
    ],
    note: "Strictly adults-only property.",
  },

  // Minimum guest age cutoff (unconfirmed: listings suggest 18)
  minGuestAge: {
    value: 18,
    status: "unconfirmed",
    sources: [
      "Listings suggest 18, but exact cutoff must be confirmed with owner.",
    ],
    note: "Exact age cutoff pending approval by property owner.",
  },

  // Verified amenities from client's brief
  outdoorPool: {
    value: true,
    status: "confirmed",
    sources: ["Client brief: outdoor swimming pool."],
  },

  coworking: {
    value: true,
    status: "confirmed",
    sources: ["Client brief: coworking desks inside the villa."],
  },

  socialLounge: {
    value: true,
    status: "confirmed",
    sources: ["Client brief: shared social lounge and café area."],
  },

  wifiMbps: {
    value: 500,
    status: "confirmed",
    sources: ["Client brief: high-speed 500 Mbps connection."],
  },

  // Unconfirmed amenities from third-party listings
  freeParking: {
    value: null,
    status: "unconfirmed",
    sources: ["Mentioned in some descriptions, parking availability unconfirmed."],
    note: "On-site parking spaces vs street parking unconfirmed.",
  },

  selfServeLaundry: {
    value: null,
    status: "unconfirmed",
    sources: ["Mentioned in some descriptions as self-serve laundry, unconfirmed."],
    note: "Washer/dryer availability and fees unconfirmed.",
  },

  gym: {
    value: null,
    status: "unconfirmed",
    sources: ["Unconfirmed facility."],
    note: "No gym or fitness equipment verified on property.",
  },

  shuttle: {
    value: null,
    status: "unconfirmed",
    sources: ["Mentioned in some listings, no official vehicle or schedule confirmed."],
    note: "Transfer service unconfirmed; request only.",
  },

  paymentPolicy: {
    value: null,
    status: "unconfirmed",
    sources: ["Listings conflict on deposit requirements."],
    note: "Payment schedule and accepted methods to be confirmed by owner.",
  },

  // Unit inventory counts
  unitsTotal: {
    "premium-single-capsule": 8,
    "deluxe-double-capsule": 6,
    "executive-private-suite": 2,
  },

  // Base rates in AED
  baseRatesAED: {
    "premium-single-capsule": 180,
    "deluxe-double-capsule": 260,
    "executive-private-suite": 540,
  },

  directDiscountPercent: 15,
  holdDurationHours: 12,
  retentionPeriodDays: 90,
};

/**
 * Returns the verified policy value if confirmed; otherwise returns neutral wording.
 * Never exposes source notes, internal notes, or raw conflicting data to guests.
 */
export function showPolicy<T>(
  p: Verified<T> | null | undefined,
  fallbackText: string = "Times confirmed when your booking is accepted"
): string {
  if (p && p.status === "confirmed" && p.value !== null && p.value !== undefined) {
    return String(p.value);
  }
  return fallbackText;
}
