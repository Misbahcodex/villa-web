/**
 * Rizq Luxurious Villa — Availability & Occupancy Engine
 *
 * PURE ENGINE:
 * Calculates real-time room availability, nightly occupancy, and month calendar states.
 * Works with confirmed bookings, active holds, and calendar blocks (manual + iCal).
 * Check-out day is NOT an occupied night.
 */

import {
  BookingRecord,
  BlockRecord,
  RoomTypeRecord,
  AvailabilityResult,
  CalendarMonthResult,
  CalendarDayItem,
  DayCalendarState,
} from "@/types";
import { propertyPolicies } from "@/data/policies";
import { parseISO, addDays, format, getDaysInMonth, startOfMonth, isBefore, isAfter, isEqual } from "date-fns";

// Unambiguous alphabet for booking references: excludes 0, 1, I, O, L
export const UNAMBIGUOUS_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generates an unambiguous booking reference in the format RZQ-XXXXXX
 */
export function generateBookingReference(): string {
  const chars: string[] = [];
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * UNAMBIGUOUS_ALPHABET.length);
    chars.push(UNAMBIGUOUS_ALPHABET[randomIndex]);
  }
  return `RZQ-${chars.join("")}`;
}

/**
 * Returns an array of date strings (YYYY-MM-DD) for every night of a stay.
 * Check-in night is included; Check-out day is EXCLUDED.
 */
export function getNightsBetween(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);

  if (isBefore(end, start) || isEqual(start, end)) {
    return [];
  }

  let current = start;
  while (isBefore(current, end)) {
    nights.push(format(current, "yyyy-MM-dd"));
    current = addDays(current, 1);
  }

  return nights;
}

/**
 * Checks if a specific night is covered by a booking.
 * Note: A booking from Oct 1 to Oct 3 covers nights Oct 1 and Oct 2; Oct 3 is checkout.
 */
export function doesBookingCoverNight(
  booking: { checkIn: string; checkOut: string },
  nightStr: string
): boolean {
  return nightStr >= booking.checkIn && nightStr < booking.checkOut;
}

/**
 * Checks if a specific night is covered by a block.
 * Start date is inclusive; end date is exclusive.
 */
export function doesBlockCoverNight(
  block: { startDate: string; endDate: string },
  nightStr: string
): boolean {
  return nightStr >= block.startDate && nightStr < block.endDate;
}

/**
 * Determines whether a booking is actively holding inventory for a given reference time.
 * - 'confirmed': always occupies inventory
 * - 'pending': occupies inventory only if holdExpiresAt > now
 * - 'declined', 'expired', 'cancelled': never occupy inventory
 */
export function isBookingActive(
  booking: Pick<BookingRecord, "status" | "holdExpiresAt">,
  now: Date = new Date()
): boolean {
  if (booking.status === "confirmed") {
    return true;
  }
  if (booking.status === "pending") {
    if (!booking.holdExpiresAt) return true;
    const expiresAt = new Date(booking.holdExpiresAt);
    return expiresAt.getTime() > now.getTime();
  }
  return false;
}

/**
 * Calculates occupied units for a room type on a specific night.
 */
export function getNightOccupancy(
  roomTypeId: string,
  nightStr: string,
  bookings: BookingRecord[],
  blocks: BlockRecord[],
  now: Date = new Date()
): {
  confirmedCount: number;
  pendingCount: number;
  blockedCount: number;
  occupiedTotal: number;
} {
  let confirmedCount = 0;
  let pendingCount = 0;
  let blockedCount = 0;

  // Active bookings for this room type and night
  for (const b of bookings) {
    if (b.roomTypeId !== roomTypeId) continue;
    if (!doesBookingCoverNight(b, nightStr)) continue;

    if (b.status === "confirmed") {
      confirmedCount += 1;
    } else if (b.status === "pending" && isBookingActive(b, now)) {
      pendingCount += 1;
    }
  }

  // Blocks for this room type and night
  for (const blk of blocks) {
    if (blk.roomTypeId !== roomTypeId) continue;
    if (doesBlockCoverNight(blk, nightStr)) {
      blockedCount += blk.units;
    }
  }

  const occupiedTotal = confirmedCount + pendingCount + blockedCount;

  return {
    confirmedCount,
    pendingCount,
    blockedCount,
    occupiedTotal,
  };
}

/**
 * Calculates full availability across a requested stay.
 */
export function getAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  context: {
    roomTypes: RoomTypeRecord[];
    bookings: BookingRecord[];
    blocks: BlockRecord[];
    now?: Date;
  }
): AvailabilityResult {
  const now = context.now || new Date();
  const room = context.roomTypes.find((r) => r.id === roomTypeId);
  const unitsTotal = room ? room.unitsTotal : (propertyPolicies.unitsTotal as Record<string, number>)[roomTypeId] || 1;

  const nights = getNightsBetween(checkIn, checkOut);
  const perNight: Record<string, number> = {};

  if (nights.length === 0) {
    return {
      roomTypeId,
      checkIn,
      checkOut,
      nightsCount: 0,
      unitsTotal,
      minUnitsLeft: 0,
      isAvailable: false,
      perNight: {},
    };
  }

  let minUnitsLeft = unitsTotal;

  for (const night of nights) {
    const { occupiedTotal } = getNightOccupancy(
      roomTypeId,
      night,
      context.bookings,
      context.blocks,
      now
    );
    const left = Math.max(0, unitsTotal - occupiedTotal);
    perNight[night] = left;
    if (left < minUnitsLeft) {
      minUnitsLeft = left;
    }
  }

  return {
    roomTypeId,
    checkIn,
    checkOut,
    nightsCount: nights.length,
    unitsTotal,
    minUnitsLeft,
    isAvailable: minUnitsLeft >= 1,
    perNight,
  };
}

/**
 * Generates month calendar day states for the date picker widget.
 */
export function getCalendar(
  roomTypeId: string,
  monthStr: string, // YYYY-MM
  context: {
    roomTypes: RoomTypeRecord[];
    bookings: BookingRecord[];
    blocks: BlockRecord[];
    now?: Date;
  }
): CalendarMonthResult {
  const now = context.now || new Date();
  const room = context.roomTypes.find((r) => r.id === roomTypeId);
  const unitsTotal = room ? room.unitsTotal : (propertyPolicies.unitsTotal as Record<string, number>)[roomTypeId] || 1;

  // e.g. "2026-11" -> parse 1st day of that month
  const [yearStr, monthNumStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthNumStr, 10) - 1;
  const monthDate = new Date(year, monthIndex, 1);
  const totalDays = getDaysInMonth(monthDate);

  const days: CalendarDayItem[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const dateObj = new Date(year, monthIndex, day);
    const dateFormatted = format(dateObj, "yyyy-MM-dd");

    const { occupiedTotal } = getNightOccupancy(
      roomTypeId,
      dateFormatted,
      context.bookings,
      context.blocks,
      now
    );

    const unitsLeft = Math.max(0, unitsTotal - occupiedTotal);

    let state: DayCalendarState = "available";
    if (unitsLeft <= 0) {
      state = "sold-out";
    } else if (unitsLeft <= 2) {
      state = "few-left";
    }

    days.push({
      date: dateFormatted,
      dayOfMonth: day,
      unitsLeft,
      unitsTotal,
      state,
    });
  }

  return {
    roomTypeId,
    month: monthStr,
    days,
  };
}

/**
 * Searches alternative dates (up to +/- 7 days) if requested stay is sold out.
 */
export function findAlternativeDates(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  context: {
    roomTypes: RoomTypeRecord[];
    bookings: BookingRecord[];
    blocks: BlockRecord[];
    now?: Date;
  }
): { checkIn: string; checkOut: string; minUnitsLeft: number }[] {
  const nights = getNightsBetween(checkIn, checkOut).length;
  if (nights <= 0) return [];

  const alternatives: { checkIn: string; checkOut: string; minUnitsLeft: number }[] = [];
  const baseStart = parseISO(checkIn);

  // Search shifts from -7 to +7 days
  const shifts = [1, 2, 3, -1, -2, -3, 4, 5, 6, 7, -4, -5, -6, -7];

  for (const shift of shifts) {
    const newStart = addDays(baseStart, shift);
    const newEnd = addDays(newStart, nights);
    const newCheckIn = format(newStart, "yyyy-MM-dd");
    const newCheckOut = format(newEnd, "yyyy-MM-dd");

    const avail = getAvailability(roomTypeId, newCheckIn, newCheckOut, context);
    if (avail.isAvailable) {
      alternatives.push({
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        minUnitsLeft: avail.minUnitsLeft,
      });
      if (alternatives.length >= 3) break;
    }
  }

  return alternatives;
}

/**
 * Searches other room types that have availability for the exact same dates.
 */
export function findAlternativeRooms(
  checkIn: string,
  checkOut: string,
  excludeRoomTypeId: string,
  context: {
    roomTypes: RoomTypeRecord[];
    bookings: BookingRecord[];
    blocks: BlockRecord[];
    now?: Date;
  }
): { roomTypeId: string; roomName: string; minUnitsLeft: number }[] {
  const alternatives: { roomTypeId: string; roomName: string; minUnitsLeft: number }[] = [];

  for (const room of context.roomTypes) {
    if (room.id === excludeRoomTypeId) continue;
    const avail = getAvailability(room.id, checkIn, checkOut, context);
    if (avail.isAvailable) {
      alternatives.push({
        roomTypeId: room.id,
        roomName: room.name,
        minUnitsLeft: avail.minUnitsLeft,
      });
    }
  }

  return alternatives;
}
