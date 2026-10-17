/**
 * Rizq Luxurious Villa — Central Data Store
 *
 * Hybrid architecture:
 * - If SUPABASE is configured (env vars set and ENABLE_BACKEND=true), delegates to Supabase RPC with Postgres advisory locks.
 * - Otherwise (Zero env vars / local demo mode), runs a 100% offline in-memory / JSON-backed store with a Mutex queue
 *   to ensure strict concurrency safety and race-free reservations.
 */

import {
  BookingRecord,
  BlockRecord,
  IcalFeedRecord,
  AuditLogRecord,
  RoomTypeRecord,
  BookingStatus,
} from "@/types";
import { propertyPolicies, Verified } from "@/data/policies";
import { propertyAddons } from "@/data/addons";
import {
  getAvailability,
  generateBookingReference,
} from "@/lib/availability";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase";
import fs from "fs";
import path from "path";

// ----------------------------------------------------
// CONCURRENCY MUTEX FOR LOCAL STORE
// ----------------------------------------------------
class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const execute = () => {
        this.locked = true;
        resolve(() => this.release());
      };

      if (!this.locked) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

const bookingMutex = new AsyncMutex();

// ----------------------------------------------------
// INITIAL ROOM TYPES
// ----------------------------------------------------
const initialRoomTypes: RoomTypeRecord[] = [
  {
    id: "premium-single-capsule",
    slug: "single-capsule",
    name: "Premium Single Capsule Pod",
    unitsTotal: propertyPolicies.unitsTotal["premium-single-capsule"],
    baseRateAED: propertyPolicies.baseRatesAED["premium-single-capsule"],
    maxGuests: 1,
  },
  {
    id: "deluxe-double-capsule",
    slug: "double-capsule",
    name: "Deluxe Double Capsule Pod",
    unitsTotal: propertyPolicies.unitsTotal["deluxe-double-capsule"],
    baseRateAED: propertyPolicies.baseRatesAED["deluxe-double-capsule"],
    maxGuests: 2,
  },
  {
    id: "executive-private-suite",
    slug: "private-suite",
    name: "Executive Private Suite",
    unitsTotal: propertyPolicies.unitsTotal["executive-private-suite"],
    baseRateAED: propertyPolicies.baseRatesAED["executive-private-suite"],
    maxGuests: 2,
  },
];

// ----------------------------------------------------
// INITIAL SEED DEMO DATA
// ----------------------------------------------------
const initialBookings: BookingRecord[] = [
  {
    id: "b-001",
    ref: "RZQ-X7K92M",
    roomTypeId: "deluxe-double-capsule",
    checkIn: "2026-11-05",
    checkOut: "2026-11-12",
    adults: 2,
    children: 0,
    guestName: "Marcus Lindqvist",
    guestPhone: "+46 70 123 4567",
    guestEmail: "marcus.l@stockholm-tech.io",
    notes: "Arriving on evening flight from Stockholm. Need dual quiet workspace.",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 1547,
    addons: [{ id: "airport-shuttle", name: "Airport Transfer", priceAED: 120, priceConfirmed: false, requested: true }],
    status: "confirmed",
    holdExpiresAt: null,
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "b-002",
    ref: "RZQ-H3W84T",
    roomTypeId: "executive-private-suite",
    checkIn: "2026-11-15",
    checkOut: "2026-11-22",
    adults: 1,
    children: 0,
    guestName: "Elena Rostova",
    guestPhone: "+44 7700 900123",
    guestEmail: "elena@remote-design.co",
    notes: "Private call hours between 2 PM and 6 PM UK time.",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 3213,
    addons: [{ id: "early-checkin", name: "Early Check-in", priceAED: 60, priceConfirmed: false, requested: true }],
    status: "confirmed",
    holdExpiresAt: null,
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "b-003",
    ref: "RZQ-Y2P76J",
    roomTypeId: "premium-single-capsule",
    checkIn: "2026-11-02",
    checkOut: "2026-11-06",
    adults: 1,
    children: 0,
    guestName: "Tariq Al-Hashemi",
    guestPhone: "+971 50 999 1234",
    guestEmail: "tariq@mena-ventures.com",
    notes: "Attending tech conference in Business Bay.",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 612,
    addons: [],
    status: "pending",
    holdExpiresAt: new Date(Date.now() + 3600000 * 8).toISOString(),
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "b-004",
    ref: "RZQ-N5B91R",
    roomTypeId: "deluxe-double-capsule",
    checkIn: "2026-11-18",
    checkOut: "2026-11-21",
    adults: 2,
    children: 0,
    guestName: "Chloe Martin",
    guestPhone: "+33 6 12 34 56 78",
    guestEmail: "chloe@paris-digital.fr",
    notes: "Requested quiet capsule away from main entrance.",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 663,
    addons: [],
    status: "pending",
    holdExpiresAt: new Date(Date.now() + 3600000 * 11).toISOString(),
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "b-005",
    ref: "RZQ-C4D82V",
    roomTypeId: "premium-single-capsule",
    checkIn: "2026-10-25",
    checkOut: "2026-10-28",
    adults: 1,
    children: 0,
    guestName: "Kenji Sato",
    guestPhone: "+81 90 1234 5678",
    guestEmail: "kenji@tokyo-lab.jp",
    notes: "",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 459,
    addons: [],
    status: "declined",
    declineReason: "Guest dates conflicted with scheduled deep maintenance",
    holdExpiresAt: null,
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: "b-006",
    ref: "RZQ-E9F33K",
    roomTypeId: "premium-single-capsule",
    checkIn: "2026-10-20",
    checkOut: "2026-10-23",
    adults: 1,
    children: 0,
    guestName: "David Miller",
    guestPhone: "+1 415 555 2671",
    guestEmail: "david@sf-foundry.com",
    notes: "",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 459,
    addons: [],
    status: "expired",
    holdExpiresAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "b-007",
    ref: "RZQ-A1M77S",
    roomTypeId: "executive-private-suite",
    checkIn: "2026-11-25",
    checkOut: "2026-11-30",
    adults: 2,
    children: 0,
    guestName: "Fatima Al-Mansoor",
    guestPhone: "+971 52 888 4321",
    guestEmail: "fatima@gulf-invest.ae",
    notes: "VIP guest, prefers late check-in",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 2295,
    addons: [{ id: "airport-shuttle", name: "Airport Transfer", priceAED: 120, priceConfirmed: false, requested: true }],
    status: "confirmed",
    holdExpiresAt: null,
    source: "whatsapp",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "b-008",
    ref: "RZQ-P6Q22Z",
    roomTypeId: "deluxe-double-capsule",
    checkIn: "2026-11-10",
    checkOut: "2026-11-14",
    adults: 1,
    children: 0,
    guestName: "Alexandre Dupont",
    guestPhone: "+33 7 89 01 23 45",
    guestEmail: "alex@lyon-design.eu",
    notes: "",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 884,
    addons: [],
    status: "confirmed",
    holdExpiresAt: null,
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "b-009",
    ref: "RZQ-L8R55X",
    roomTypeId: "premium-single-capsule",
    checkIn: "2026-11-08",
    checkOut: "2026-11-11",
    adults: 1,
    children: 0,
    guestName: "Zainab Qasim",
    guestPhone: "+971 54 321 0987",
    guestEmail: null,
    notes: "Requires high-speed ethernet port if available",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 459,
    addons: [],
    status: "confirmed",
    holdExpiresAt: null,
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: "b-010",
    ref: "RZQ-T9V44B",
    roomTypeId: "executive-private-suite",
    checkIn: "2026-10-15",
    checkOut: "2026-10-18",
    adults: 2,
    children: 0,
    guestName: "Oliver Schmidt",
    guestPhone: "+49 170 1234567",
    guestEmail: "oliver@berlin-ventures.de",
    notes: "Trip cancelled due to flight rescheduling",
    promoCode: "RIZQDIRECT",
    estimatedTotalAED: 1377,
    addons: [],
    status: "cancelled",
    holdExpiresAt: null,
    source: "website",
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 110).toISOString(),
  },
];

const initialBlocks: BlockRecord[] = [
  {
    id: "blk-001",
    roomTypeId: "deluxe-double-capsule",
    startDate: "2026-11-01",
    endDate: "2026-11-04",
    units: 1,
    reason: "Scheduled AC maintenance and filter replacement",
    source: "manual",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

const initialFeeds: IcalFeedRecord[] = [
  {
    id: "feed-001",
    roomTypeId: "executive-private-suite",
    url: "https://calendar.google.com/calendar/ical/sample-ota-feed/public/basic.ics",
    label: "Partner Calendar / OTA Export",
    lastSyncedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastStatus: "success",
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
];

const initialAuditLogs: AuditLogRecord[] = [
  {
    id: "log-001",
    bookingId: "b-001",
    actor: "system",
    action: "seed_initialized",
    meta: { ref: "RZQ-X7K92M", info: "Demo seed booking initialized" },
    createdAt: new Date().toISOString(),
  },
];

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// ----------------------------------------------------
// PERSISTENT IN-MEMORY / JSON STORE STATE
// ----------------------------------------------------
interface StoreData {
  roomTypes: RoomTypeRecord[];
  bookings: BookingRecord[];
  blocks: BlockRecord[];
  icalFeeds: IcalFeedRecord[];
  auditLogs: AuditLogRecord[];
  blockedPhoneNumbers?: string[];
  propertyFacts?: Record<string, Verified<any>>;
}

// Global persistent state across hot-reloads
const globalStore: { current: StoreData } = (globalThis as unknown as { __rizqVillaStore?: { current: StoreData } }).__rizqVillaStore || {
  current: {
    roomTypes: [...initialRoomTypes],
    bookings: [...initialBookings],
    blocks: [...initialBlocks],
    icalFeeds: [...initialFeeds],
    auditLogs: [...initialAuditLogs],
    blockedPhoneNumbers: [],
  },
};

(globalThis as unknown as { __rizqVillaStore: typeof globalStore }).__rizqVillaStore = globalStore;

const STORE_FILE_PATH = path.join(process.cwd(), "data", "store.json");

// Helper to load from file on startup if present
function tryLoadFromFile(): void {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const content = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content) as StoreData;
      if (parsed.roomTypes && parsed.bookings) {
        globalStore.current = parsed;
      }
    }
  } catch {
    // Ignore file load errors (fallback to memory)
  }
}

// Helper to save to file
function trySaveToFile(): void {
  try {
    const dir = path.dirname(STORE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(globalStore.current, null, 2), "utf-8");
  } catch {
    // Read-only filesystem / serverless, safe to ignore
  }
}

// Initialize on first import
tryLoadFromFile();

// ----------------------------------------------------
// STORE SERVICE METHODS
// ----------------------------------------------------

export async function getRoomTypes(): Promise<RoomTypeRecord[]> {
  return [...globalStore.current.roomTypes];
}

export async function getRoomTypeById(id: string): Promise<RoomTypeRecord | undefined> {
  return globalStore.current.roomTypes.find((r) => r.id === id);
}

export async function updateRoomTypeUnits(id: string, unitsTotal: number): Promise<boolean> {
  const room = globalStore.current.roomTypes.find((r) => r.id === id);
  if (!room) return false;
  room.unitsTotal = unitsTotal;
  trySaveToFile();
  return true;
}

export async function getBlockedPhoneNumbers(): Promise<string[]> {
  return [...(globalStore.current.blockedPhoneNumbers || [])];
}

export function isPhoneNumberBlocked(phone: string): boolean {
  const norm = normalizePhone(phone);
  const list = globalStore.current.blockedPhoneNumbers || [];
  return list.some((p) => normalizePhone(p) === norm);
}

export async function blockPhoneNumber(phone: string, actor = "admin"): Promise<boolean> {
  const norm = normalizePhone(phone);
  if (!globalStore.current.blockedPhoneNumbers) {
    globalStore.current.blockedPhoneNumbers = [];
  }
  if (!globalStore.current.blockedPhoneNumbers.some((p) => normalizePhone(p) === norm)) {
    globalStore.current.blockedPhoneNumbers.push(norm);
    await addAuditLog({
      actor,
      action: "blocked_phone_number",
      meta: { phone: phone.slice(0, 4) + "***" },
    });
    trySaveToFile();
  }
  return true;
}

export async function unblockPhoneNumber(phone: string, actor = "admin"): Promise<boolean> {
  const norm = normalizePhone(phone);
  if (!globalStore.current.blockedPhoneNumbers) return false;
  const initial = globalStore.current.blockedPhoneNumbers.length;
  globalStore.current.blockedPhoneNumbers = globalStore.current.blockedPhoneNumbers.filter(
    (p) => normalizePhone(p) !== norm
  );
  if (globalStore.current.blockedPhoneNumbers.length < initial) {
    await addAuditLog({
      actor,
      action: "unblocked_phone_number",
      meta: { phone: phone.slice(0, 4) + "***" },
    });
    trySaveToFile();
    return true;
  }
  return false;
}

export async function getBookings(): Promise<BookingRecord[]> {
  await expireHolds();
  return [...globalStore.current.bookings];
}

export async function getBookingById(id: string): Promise<BookingRecord | undefined> {
  return globalStore.current.bookings.find((b) => b.id === id);
}

export async function getBookingByRef(ref: string): Promise<BookingRecord | undefined> {
  await expireHolds();
  return globalStore.current.bookings.find((b) => b.ref.toUpperCase() === ref.toUpperCase());
}

export async function getBlocks(): Promise<BlockRecord[]> {
  return [...globalStore.current.blocks];
}

export async function getIcalFeeds(): Promise<IcalFeedRecord[]> {
  return [...globalStore.current.icalFeeds];
}

export async function getAuditLogs(bookingId?: string): Promise<AuditLogRecord[]> {
  if (bookingId) {
    return globalStore.current.auditLogs.filter((log) => log.bookingId === bookingId);
  }
  return [...globalStore.current.auditLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addAuditLog(entry: {
  bookingId?: string | null;
  actor: string;
  action: string;
  meta?: Record<string, unknown>;
}): Promise<AuditLogRecord> {
  const log: AuditLogRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bookingId: entry.bookingId || null,
    actor: entry.actor,
    action: entry.action,
    meta: entry.meta || {},
    createdAt: new Date().toISOString(),
  };
  globalStore.current.auditLogs.unshift(log);
  trySaveToFile();
  return log;
}

/**
 * Creates a race-safe pending booking request with a 12-hour hold.
 * Protected by an async mutex in local mode and Postgres advisory locks in Supabase mode.
 */
export async function createBookingRequest(data: {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  notes?: string;
  promoCode?: string;
  estimatedTotalAED: number;
  addons?: { id: string; name: string; priceAED: number; priceConfirmed: boolean; requested: boolean }[];
  holdHours?: number;
  source?: string;
  ip?: string;
}): Promise<{ success: true; booking: BookingRecord } | { success: false; error: string; code: "SOLD_OUT" | "INVALID_INPUT" | "BLOCKED" | "LIMIT_EXCEEDED" }> {
  // Check if phone number is blocked
  if (isPhoneNumberBlocked(data.guestPhone)) {
    return {
      success: false,
      error: "This phone number cannot submit booking requests at this time.",
      code: "BLOCKED",
    };
  }

  // Check active pending holds for normalized phone and IP
  const normPhone = normalizePhone(data.guestPhone);
  const nowMs = Date.now();
  const activeHolds = globalStore.current.bookings.filter((b) => {
    if (b.status !== "pending" || !b.holdExpiresAt) return false;
    const expiresMs = new Date(b.holdExpiresAt).getTime();
    if (expiresMs <= nowMs) return false;
    const matchPhone = normalizePhone(b.guestPhone) === normPhone;
    const matchIp = Boolean(data.ip && b.ip && b.ip === data.ip);
    return matchPhone || matchIp;
  });

  if (activeHolds.length >= 2) {
    return {
      success: false,
      error: "You have reached the maximum of 2 active reservation requests. Please wait for our team to confirm or contact us on WhatsApp.",
      code: "LIMIT_EXCEEDED",
    };
  }

  // If Supabase is connected and backend enabled, attempt RPC call
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const ref = generateBookingReference();
      const { data: dbBooking, error } = await supabaseServer.rpc("create_booking_request", {
        p_ref: ref,
        p_room_type_id: data.roomTypeId,
        p_check_in: data.checkIn,
        p_check_out: data.checkOut,
        p_adults: data.adults,
        p_children: data.children,
        p_guest_name: data.guestName,
        p_guest_phone: data.guestPhone,
        p_guest_email: data.guestEmail || null,
        p_notes: data.notes || "",
        p_promo_code: data.promoCode || "",
        p_estimated_total_aed: data.estimatedTotalAED,
        p_addons: JSON.stringify(data.addons || []),
        p_hold_hours: data.holdHours || propertyPolicies.holdDurationHours,
        p_source: data.source || "website",
      });

      if (!error && dbBooking) {
        return { success: true, booking: dbBooking as BookingRecord };
      }
      if (error && error.code === "P0001") {
        return { success: false, error: "Selected dates are sold out for this space.", code: "SOLD_OUT" };
      }
      // If RPC failed due to table missing in demo, seamlessly fallback to local store
    } catch {
      // Fallback to local store below
    }
  }

  // LOCAL FALLBACK MUTEX SERIALIZATION (Guarantees race-safety)
  const release = await bookingMutex.acquire();

  try {
    const store = globalStore.current;

    // Check availability inside the lock
    const availability = getAvailability(data.roomTypeId, data.checkIn, data.checkOut, {
      roomTypes: store.roomTypes,
      bookings: store.bookings,
      blocks: store.blocks,
    });

    if (!availability.isAvailable) {
      return {
        success: false,
        error: "Selected dates are sold out for this room type.",
        code: "SOLD_OUT",
      };
    }

    const holdHours = data.holdHours || propertyPolicies.holdDurationHours;
    const holdExpiresAt = new Date(Date.now() + holdHours * 3600000).toISOString();
    const ref = generateBookingReference();

    const newBooking: BookingRecord = {
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ref,
      roomTypeId: data.roomTypeId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      adults: data.adults,
      children: data.children,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail || null,
      notes: data.notes || "",
      promoCode: data.promoCode || propertyPolicies.directDiscountPercent ? "RIZQDIRECT" : "",
      estimatedTotalAED: data.estimatedTotalAED,
      addons: data.addons || [],
      status: "pending",
      holdExpiresAt,
      source: data.source || "website",
      ip: data.ip || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.bookings.unshift(newBooking);

    // Audit log
    await addAuditLog({
      bookingId: newBooking.id,
      actor: "guest",
      action: "created_pending_hold",
      meta: {
        ref: newBooking.ref,
        holdExpiresAt,
        nights: availability.nightsCount,
        source: newBooking.source,
      },
    });

    trySaveToFile();

    return { success: true, booking: newBooking };
  } finally {
    release();
  }
}

/**
 * Confirm a pending booking (e.g. by owner via Admin or Telegram bot).
 */
export async function confirmBooking(id: string, actor = "owner", meta?: Record<string, unknown>): Promise<BookingRecord | null> {
  const booking = globalStore.current.bookings.find((b) => b.id === id);
  if (!booking) return null;

  booking.status = "confirmed";
  booking.holdExpiresAt = null; // Lock is now confirmed
  booking.updatedAt = new Date().toISOString();

  await addAuditLog({
    bookingId: booking.id,
    actor,
    action: "confirmed",
    meta: { ref: booking.ref, ...meta },
  });

  trySaveToFile();
  return booking;
}

/**
 * Decline a booking request with a reason.
 */
export async function declineBooking(id: string, reason: string, actor = "owner"): Promise<BookingRecord | null> {
  const booking = globalStore.current.bookings.find((b) => b.id === id);
  if (!booking) return null;

  booking.status = "declined";
  booking.declineReason = reason;
  booking.holdExpiresAt = null; // Releases inventory immediately
  booking.updatedAt = new Date().toISOString();

  await addAuditLog({
    bookingId: booking.id,
    actor,
    action: "declined",
    meta: { ref: booking.ref, reason },
  });

  trySaveToFile();
  return booking;
}

/**
 * Cancel a booking.
 */
export async function cancelBooking(id: string, reason: string, actor = "owner"): Promise<BookingRecord | null> {
  const booking = globalStore.current.bookings.find((b) => b.id === id);
  if (!booking) return null;

  booking.status = "cancelled";
  booking.declineReason = reason;
  booking.holdExpiresAt = null;
  booking.updatedAt = new Date().toISOString();

  await addAuditLog({
    bookingId: booking.id,
    actor,
    action: "cancelled",
    meta: { ref: booking.ref, reason },
  });

  trySaveToFile();
  return booking;
}

/**
 * Create a direct manual booking from the operations dashboard.
 */
export async function createManualBooking(data: {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  notes?: string;
  totalAED: number;
  actor?: string;
}): Promise<BookingRecord> {
  const ref = generateBookingReference();
  const newBooking: BookingRecord = {
    id: `b-manual-${Date.now()}`,
    ref,
    roomTypeId: data.roomTypeId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    adults: data.adults,
    children: 0,
    guestName: data.guestName,
    guestPhone: data.guestPhone,
    guestEmail: data.guestEmail || null,
    notes: data.notes || "Manual admin booking",
    promoCode: "MANUAL",
    estimatedTotalAED: data.totalAED,
    addons: [],
    status: "confirmed",
    holdExpiresAt: null,
    source: "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  globalStore.current.bookings.unshift(newBooking);

  await addAuditLog({
    bookingId: newBooking.id,
    actor: data.actor || "owner",
    action: "created_manual_booking",
    meta: { ref: newBooking.ref },
  });

  trySaveToFile();
  return newBooking;
}

/**
 * Add a manual block to inventory.
 */
export async function createBlock(data: {
  roomTypeId: string;
  startDate: string;
  endDate: string;
  units: number;
  reason: string;
  source?: string;
  actor?: string;
}): Promise<BlockRecord> {
  const block: BlockRecord = {
    id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    roomTypeId: data.roomTypeId,
    startDate: data.startDate,
    endDate: data.endDate,
    units: data.units,
    reason: data.reason,
    source: data.source || "manual",
    createdAt: new Date().toISOString(),
  };

  globalStore.current.blocks.push(block);

  await addAuditLog({
    actor: data.actor || "owner",
    action: "created_block",
    meta: { blockId: block.id, roomTypeId: block.roomTypeId, dates: `${block.startDate} to ${block.endDate}` },
  });

  trySaveToFile();
  return block;
}

/**
 * Delete a block.
 */
export async function deleteBlock(id: string, actor = "owner"): Promise<boolean> {
  const idx = globalStore.current.blocks.findIndex((b) => b.id === id);
  if (idx === -1) return false;

  const [removed] = globalStore.current.blocks.splice(idx, 1);

  await addAuditLog({
    actor,
    action: "deleted_block",
    meta: { blockId: id, details: removed },
  });

  trySaveToFile();
  return true;
}

/**
 * Add an inbound iCal feed.
 */
export async function createIcalFeed(data: {
  roomTypeId: string;
  url: string;
  label: string;
}): Promise<IcalFeedRecord> {
  const feed: IcalFeedRecord = {
    id: `feed-${Date.now()}`,
    roomTypeId: data.roomTypeId,
    url: data.url,
    label: data.label,
    lastSyncedAt: null,
    lastStatus: null,
    createdAt: new Date().toISOString(),
  };

  globalStore.current.icalFeeds.push(feed);
  trySaveToFile();
  return feed;
}

/**
 * Delete an iCal feed and its associated imported blocks.
 */
export async function deleteIcalFeed(id: string): Promise<boolean> {
  const idx = globalStore.current.icalFeeds.findIndex((f) => f.id === id);
  if (idx === -1) return false;

  const [feed] = globalStore.current.icalFeeds.splice(idx, 1);
  // Remove blocks created by this feed
  globalStore.current.blocks = globalStore.current.blocks.filter((b) => b.source !== feed.label);

  trySaveToFile();
  return true;
}

/**
 * Replace blocks for a specific iCal feed.
 */
export async function replaceFeedBlocks(roomTypeId: string, feedLabel: string, blocks: Omit<BlockRecord, "id" | "createdAt">[]): Promise<void> {
  // Remove existing blocks for this feed label
  globalStore.current.blocks = globalStore.current.blocks.filter((b) => !(b.roomTypeId === roomTypeId && b.source === feedLabel));

  // Add new blocks
  for (const b of blocks) {
    globalStore.current.blocks.push({
      id: `blk-ical-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roomTypeId,
      startDate: b.startDate,
      endDate: b.endDate,
      units: b.units,
      reason: b.reason,
      source: feedLabel,
      createdAt: new Date().toISOString(),
    });
  }

  // Update feed status
  const feed = globalStore.current.icalFeeds.find((f) => f.label === feedLabel && f.roomTypeId === roomTypeId);
  if (feed) {
    feed.lastSyncedAt = new Date().toISOString();
    feed.lastStatus = `success (${blocks.length} events)`;
  }

  trySaveToFile();
}

/**
 * Expire pending holds where holdExpiresAt < now().
 * Releases locked inventory back to the pool.
 * Also checks for the 6-hour halfway reminder for pending holds.
 */
export async function expireHolds(now = new Date()): Promise<number> {
  let expiredCount = 0;
  const currentTime = now.getTime();

  for (const b of globalStore.current.bookings) {
    if (b.status === "pending" && b.holdExpiresAt) {
      const expiresAt = new Date(b.holdExpiresAt).getTime();
      const createdAt = new Date(b.createdAt).getTime();
      const halfwayTime = createdAt + (expiresAt - createdAt) / 2;

      // Halfway reminder check: if past halfway point and reminder not sent yet
      if (currentTime >= halfwayTime && !b.halfwayReminderSent) {
        b.halfwayReminderSent = true;
        import("@/lib/notify")
          .then((notify) => notify.dispatchHalfwayReminderNotification(b))
          .catch(() => {});
      }

      if (expiresAt <= currentTime) {
        b.status = "expired";
        b.updatedAt = new Date().toISOString();
        expiredCount++;

        await addAuditLog({
          bookingId: b.id,
          actor: "cron",
          action: "hold_expired",
          meta: { ref: b.ref, expiredAt: b.holdExpiresAt },
        });
      }
    }
  }

  if (expiredCount > 0) {
    trySaveToFile();
  }

  return expiredCount;
}

export const expireStaleHolds = expireHolds;

/**
 * Purge bookings older than retention period (e.g. 90 days).
 */
export async function purgeOldBookings(days = propertyPolicies.retentionPeriodDays): Promise<number> {
  const cutoffTime = Date.now() - days * 24 * 3600 * 1000;
  const initialLength = globalStore.current.bookings.length;

  globalStore.current.bookings = globalStore.current.bookings.filter((b) => {
    const bookingTime = new Date(b.createdAt).getTime();
    return bookingTime >= cutoffTime;
  });

  const purgedCount = initialLength - globalStore.current.bookings.length;

  if (purgedCount > 0) {
    await addAuditLog({
      actor: "system",
      action: "purge_old_bookings",
      meta: { days, purgedCount },
    });
    trySaveToFile();
  }

  return purgedCount;
}

/**
 * Seed demo data.
 */
export async function seedDemoData(): Promise<void> {
  globalStore.current.roomTypes = [...initialRoomTypes];
  globalStore.current.bookings = [...initialBookings];
  globalStore.current.blocks = [...initialBlocks];
  globalStore.current.icalFeeds = [...initialFeeds];
  globalStore.current.auditLogs = [...initialAuditLogs];
  globalStore.current.blockedPhoneNumbers = [];
  trySaveToFile();
}

/**
 * Clear all demo bookings and blocks.
 */
export async function clearDemoData(): Promise<void> {
  globalStore.current.bookings = [];
  globalStore.current.blocks = [];
  globalStore.current.blockedPhoneNumbers = [];
  globalStore.current.auditLogs = [
    {
      id: `log-cleared-${Date.now()}`,
      actor: "admin",
      action: "cleared_demo_data",
      meta: { timestamp: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    },
  ];
  trySaveToFile();
}

/**
 * Property facts verification-status operations
 */
export const defaultPropertyFacts: Record<string, Verified<any>> = {
  checkInWindow: propertyPolicies.checkInWindow,
  checkOutTime: propertyPolicies.checkOutTime,
  adultsOnly: propertyPolicies.adultsOnly,
  minGuestAge: propertyPolicies.minGuestAge,
  outdoorPool: propertyPolicies.outdoorPool,
  coworking: propertyPolicies.coworking,
  socialLounge: propertyPolicies.socialLounge,
  wifiMbps: propertyPolicies.wifiMbps,
  freeParking: propertyPolicies.freeParking,
  selfServeLaundry: propertyPolicies.selfServeLaundry,
  gym: propertyPolicies.gym,
  shuttle: propertyPolicies.shuttle,
  paymentPolicy: propertyPolicies.paymentPolicy,
};

export async function getPropertyFacts(): Promise<Record<string, Verified<any>>> {
  if (!globalStore.current.propertyFacts) {
    globalStore.current.propertyFacts = { ...defaultPropertyFacts };
  }
  return globalStore.current.propertyFacts;
}

export async function updatePropertyFact(
  key: string,
  fact: Partial<Verified<any>>
): Promise<Record<string, Verified<any>>> {
  if (!globalStore.current.propertyFacts) {
    globalStore.current.propertyFacts = { ...defaultPropertyFacts };
  }
  const existing = globalStore.current.propertyFacts[key] || defaultPropertyFacts[key] || {
    value: null,
    status: "unconfirmed",
  };
  globalStore.current.propertyFacts[key] = {
    ...existing,
    ...fact,
  };
  trySaveToFile();
  return globalStore.current.propertyFacts;
}

export function countAwaitingConfirmation(facts: Record<string, Verified<any>>): number {
  return Object.values(facts).filter((f) => f.status !== "confirmed").length;
}
