export interface BuildWhatsAppParams {
  whatsappNumber: string;
  guestName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests?: number;
  adults?: number;
  minGuestAge?: number;
  promoCode?: string;
  discountPercent?: number;
  estimatedTotalAED: number;
  notes?: string;
}

/**
 * Sanitizes phone number to digits only for WhatsApp wa.me link.
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Generates the human-readable formatted message text for direct booking.
 */
export function generateWhatsAppMessageText(params: BuildWhatsAppParams): string {
  const {
    guestName,
    roomName,
    checkIn,
    checkOut,
    nights,
    guests,
    adults,
    minGuestAge = 18,
    promoCode = "RIZQDIRECT",
    discountPercent = 15,
    estimatedTotalAED,
    notes,
  } = params;

  const adultCount = adults ?? guests ?? 1;

  const lines = [
    `Hello Rizq Luxurious Villa Team,`,
    ``,
    `I would like to request a direct reservation:`,
    ``,
    `• Guest Name: ${guestName.trim()}`,
    `• Room / Space: ${roomName.trim()}`,
    `• Check-In: ${checkIn}`,
    `• Check-Out: ${checkOut} (${nights} ${nights === 1 ? "night" : "nights"})`,
    `• Guests: ${adultCount} adult(s) (all ${minGuestAge}+)`,
    `• Direct Offer: Code ${promoCode} (${discountPercent}% direct privilege applied)`,
    `• Estimated Total: AED ${estimatedTotalAED.toLocaleString("en-US")} (Sample rate, final rate confirmed on WhatsApp)`,
  ];

  if (notes && notes.trim().length > 0) {
    lines.push(`• Special Requests: ${notes.trim()}`);
  }

  lines.push(``);
  lines.push(`Please confirm availability and room assignment. Thank you!`);

  return lines.join("\n");
}

/**
 * Builds the official WhatsApp direct reservation click URL.
 */
export function buildWhatsAppLink(params: BuildWhatsAppParams): string {
  const cleanNumber = sanitizeWhatsAppNumber(params.whatsappNumber);
  const message = generateWhatsAppMessageText(params);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
