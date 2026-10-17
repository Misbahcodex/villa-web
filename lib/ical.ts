/**
 * Rizq Luxurious Villa — RFC 5545 iCalendar Engine
 *
 * Implements:
 * 1. Outbound iCal generation (.ics) for OTAs (Airbnb, Booking.com, etc.).
 *    Strict Privacy Rule: NO guest PII in feed (Summary is strictly "Booked" or block reason).
 * 2. Inbound iCal parsing with multiline unfolding and fault-tolerant handling of malformed feeds.
 */

import { BookingRecord, BlockRecord, RoomTypeRecord } from "@/types";
import { format, parseISO } from "date-fns";

export interface ParsedIcalEvent {
  uid: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  summary: string;
}

/**
 * Formats a Date or YYYY-MM-DD string into RFC 5545 date value (YYYYMMDD).
 */
export function formatIcalDate(dateStr: string): string {
  // Strip any hyphens
  return dateStr.replace(/-/g, "");
}

/**
 * Parses an iCal date string into YYYY-MM-DD.
 * Handles:
 * - 20261115
 * - 20261115T120000Z
 * - 2026-11-15
 */
export function parseIcalDateString(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.trim();

  // YYYYMMDD or YYYYMMDDTHHMMSS
  const matchCompact = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (matchCompact) {
    return `${matchCompact[1]}-${matchCompact[2]}-${matchCompact[3]}`;
  }

  // YYYY-MM-DD
  const matchHyphen = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchHyphen) {
    return `${matchHyphen[1]}-${matchHyphen[2]}-${matchHyphen[3]}`;
  }

  return null;
}

/**
 * Generates an RFC 5545 compliant .ics string for a room type.
 * STRICT PRIVACY: Zero guest PII.
 */
export function generateRoomIcalFeed(
  room: RoomTypeRecord,
  bookings: BookingRecord[],
  blocks: BlockRecord[],
  prodId = "-//Rizq Luxurious Villa//Direct Booking iCal 1.0//EN"
): string {
  const confirmedBookings = bookings.filter(
    (b) => b.roomTypeId === room.id && b.status === "confirmed"
  );
  const roomBlocks = blocks.filter((b) => b.roomTypeId === room.id);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Rizq Villa - ${room.name}`,
    "X-WR-TIMEZONE:Asia/Dubai",
  ];

  const nowStamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let domain = "localhost";
  try {
    domain = new URL(rawSiteUrl).hostname;
  } catch {
    domain = "localhost";
  }

  // 1. Add confirmed bookings as anonymous "Booked" events
  for (const b of confirmedBookings) {
    const dtStart = formatIcalDate(b.checkIn);
    const dtEnd = formatIcalDate(b.checkOut);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:rizq-booking-${b.ref}@${domain}`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push("SUMMARY:Booked");
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  // 2. Add calendar blocks as anonymous or reason-based blocks
  for (const blk of roomBlocks) {
    const dtStart = formatIcalDate(blk.startDate);
    const dtEnd = formatIcalDate(blk.endDate);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:rizq-block-${blk.id}@${domain}`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${blk.reason || "Reserved / Blocked"}`);
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 specifies CRLF line endings
  return lines.join("\r\n") + "\r\n";
}

/**
 * Robust RFC 5545 parser.
 * Handles multiline unfolding (lines beginning with space or tab).
 * Tolerates malformed lines and missing fields gracefully.
 */
export function parseIcal(icsContent: string): ParsedIcalEvent[] {
  if (!icsContent || typeof icsContent !== "string") {
    return [];
  }

  // 1. Unfold lines (RFC 5545 section 3.1)
  const unfolded = icsContent.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const rawLines = unfolded.split(/\r?\n/);

  const events: ParsedIcalEvent[] = [];
  let inEvent = false;
  let currentUid = "";
  let currentStart = "";
  let currentEnd = "";
  let currentSummary = "";

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.toUpperCase() === "BEGIN:VEVENT") {
      inEvent = true;
      currentUid = "";
      currentStart = "";
      currentEnd = "";
      currentSummary = "";
      continue;
    }

    if (trimmed.toUpperCase() === "END:VEVENT") {
      if (inEvent && currentStart && currentEnd) {
        events.push({
          uid: currentUid || `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          startDate: currentStart,
          endDate: currentEnd,
          summary: currentSummary || "Booked (Imported)",
        });
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    // Parse Key:Value or Key;Param:Value
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const keyPart = trimmed.substring(0, colonIdx).toUpperCase();
    const value = trimmed.substring(colonIdx + 1).trim();

    if (keyPart === "UID") {
      currentUid = value;
    } else if (keyPart.startsWith("DTSTART")) {
      const parsed = parseIcalDateString(value);
      if (parsed) currentStart = parsed;
    } else if (keyPart.startsWith("DTEND")) {
      const parsed = parseIcalDateString(value);
      if (parsed) currentEnd = parsed;
    } else if (keyPart === "SUMMARY") {
      currentSummary = value;
    }
  }

  return events;
}
