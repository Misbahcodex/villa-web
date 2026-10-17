export type RoomId = "premium-single-capsule" | "deluxe-double-capsule" | "executive-private-suite";

export interface RoomFeature {
  label: string;
  icon: string;
}

export interface RoomImage {
  slot: string;
  src: string;
  alt: string;
}

export interface Room {
  id: RoomId;
  name: string;
  tagline: string;
  description: string;
  maxGuests: number;
  bedConfig: string;
  sizeSqm?: number;
  startingRateAED: number; // TODO: CONFIRM WITH CLIENT
  features: RoomFeature[];
  imageSlots: string[];
  images: RoomImage[];
  highlight?: "Most Popular" | "Best for Teams" | "Private";
}

export interface DirectBenefit {
  title: string;
  description: string;
  icon: string;
}

export interface AmenityCategory {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  badge?: string;
  specs: { label: string; value: string }[];
  bullets: string[];
  imageSlot: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  authorTitle: string; // Clearly flagged placeholder, no invented named people
  verifiedGuest: boolean;
  source: "Google" | "Direct Guest";
  rating: number;
}

export interface SiteConfig {
  name: string;
  whatsappNumber: string; // digits only, e.g. "971XXXXXXXXX", TODO: CONFIRM WITH CLIENT
  promoCode: "RIZQDIRECT";
  discountPercent: number;
  rating: {
    score: 4.7;
    reviews: 2324;
    source: "Google";
  };
  address: string; // TODO: CONFIRM WITH CLIENT
  locationNote: string;
  geo: {
    lat: 25.1575396;
    lng: 55.2702367;
  };
  currency: "AED";
  checkInTime: string; // TODO: CONFIRM WITH CLIENT
  checkOutTime: string; // TODO: CONFIRM WITH CLIENT
  contactEmail: string; // TODO: CONFIRM WITH CLIENT
  demoNotice: string;
  proposedDirectOfferNotice: string;
  siteUrl?: string;
  retentionPeriodDays?: number;
}

export interface PricingCalculation {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAED: number;
}

export interface BookingFormData {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  roomId: RoomId;
  guests: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  promoCode: string;
  specialRequests?: string;
  honeypot?: string; // anti-spam bot trap
}

// ----------------------------------------------------
// BACKEND DATA MODEL (Postgres & Local Fallback Store)
// ----------------------------------------------------

export type BookingStatus = "pending" | "confirmed" | "declined" | "expired" | "cancelled";

export interface RoomTypeRecord {
  id: string; // e.g. "premium-single-capsule"
  slug: string; // e.g. "single-capsule"
  name: string;
  unitsTotal: number;
  baseRateAED: number;
  maxGuests: number;
}

export interface BookingAddonItem {
  id: string;
  name: string;
  priceAED: number;
  priceConfirmed: boolean;
  requested: boolean;
}

export interface BookingRecord {
  id: string; // uuid
  ref: string; // RZQ-XXXXXX
  roomTypeId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  notes: string;
  promoCode: string;
  estimatedTotalAED: number;
  addons: BookingAddonItem[];
  status: BookingStatus;
  holdExpiresAt: string | null; // ISO 8601
  source: string; // 'website' | 'whatsapp' | 'manual' | etc.
  declineReason?: string | null;
  halfwayReminderSent?: boolean;
  ip?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface BlockRecord {
  id: string; // uuid
  roomTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (exclusive)
  units: number;
  reason: string;
  source: string; // 'manual' | 'Airbnb iCal' | 'Booking.com iCal' etc.
  createdAt: string;
}

export interface IcalFeedRecord {
  id: string; // uuid
  roomTypeId: string;
  url: string;
  label: string;
  lastSyncedAt: string | null;
  lastStatus: string | null; // 'success' | 'error: ...'
  createdAt: string;
}

export interface AuditLogRecord {
  id: string; // uuid
  bookingId?: string | null;
  actor: string; // 'guest' | 'owner' | 'telegram-bot' | 'cron' | 'system'
  action: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

// Availability Engine Types
export interface NightAvailability {
  date: string; // YYYY-MM-DD
  unitsTotal: number;
  confirmedCount: number;
  pendingCount: number;
  blockedCount: number;
  occupiedTotal: number;
  unitsLeft: number;
}

export interface AvailabilityResult {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  nightsCount: number;
  unitsTotal: number;
  minUnitsLeft: number;
  isAvailable: boolean;
  perNight: Record<string, number>; // date -> unitsLeft
}

export type DayCalendarState = "available" | "few-left" | "sold-out";

export interface CalendarDayItem {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  unitsLeft: number;
  unitsTotal: number;
  state: DayCalendarState;
}

export interface CalendarMonthResult {
  roomTypeId: string;
  month: string; // YYYY-MM
  days: CalendarDayItem[];
}

// Legacy inquiry types preserved for backwards compatibility
export type InquiryStatus = "New" | "Contacted" | "Confirmed" | "Lost";

export interface InquiryRecord {
  id: string;
  createdAt: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomId: RoomId;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  estimatedTotalAED: number;
  promoCode: string;
  specialRequests?: string;
  status: InquiryStatus;
  notes?: string;
}
