/**
 * Rizq Luxurious Villa — Owner WhatsApp Helper
 *
 * Generates pre-filled wa.me links for the property owner to message guests
 * with one tap from the operations dashboard.
 *
 * NOTE: ZERO paid WhatsApp APIs are used. This generates client-side deep links.
 */

import { BookingRecord } from "@/types";
import { sanitizeWhatsAppNumber } from "@/lib/whatsapp";

/**
 * Builds a one-tap WhatsApp confirmation link for the owner to send to the guest.
 */
export function buildOwnerConfirmationWhatsAppLink(
  booking: BookingRecord,
  roomName: string
): string {
  const cleanPhone = sanitizeWhatsAppNumber(booking.guestPhone);

  const message = `Hi ${booking.guestName}! ✨

Your booking at Rizq Luxurious Villa is CONFIRMED.

• Ref: ${booking.ref}
• Space: ${roomName}
• Check-in: ${booking.checkIn} (from 15:00)
• Check-out: ${booking.checkOut} (until 11:00)
• Estimated Total: AED ${booking.estimatedTotalAED}

Location: Al Quoz / Business Bay Border, Dubai (Coordinates: 25.1575° N, 55.2702° E)
500 Mbps Wi-Fi & pool access included.

Looking forward to welcoming you! Please let us know your arrival time.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a one-tap WhatsApp decline/reschedule link for the owner to send to the guest.
 */
export function buildOwnerDeclineWhatsAppLink(
  booking: BookingRecord,
  roomName: string,
  reason?: string
): string {
  const cleanPhone = sanitizeWhatsAppNumber(booking.guestPhone);

  const message = `Hi ${booking.guestName},

Thank you for your inquiry for ${roomName} at Rizq Luxurious Villa (Ref: ${booking.ref}).

Unfortunately, we are unable to accept this booking for ${booking.checkIn} to ${booking.checkOut}${
    reason ? ` (${reason})` : ""
  }.

We would be delighted to check alternative dates or spaces for your stay in Dubai if you're flexible.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
