import { describe, it, expect } from "vitest";
import {
  buildWhatsAppLink,
  generateWhatsAppMessageText,
  sanitizeWhatsAppNumber,
} from "@/lib/whatsapp";

describe("WhatsApp Deep Link Generation", () => {
  const baseParams = {
    whatsappNumber: "+971 (50) 000-0000",
    guestName: "Alex Vance",
    roomName: "Premium Single Capsule Pod",
    checkIn: "2026-11-10",
    checkOut: "2026-11-14",
    nights: 4,
    guests: 1,
    promoCode: "RIZQDIRECT",
    discountPercent: 15,
    estimatedTotalAED: 612,
  };

  it("sanitizes whatsapp phone numbers to digits only", () => {
    expect(sanitizeWhatsAppNumber("+971 50 123-4567")).toBe("971501234567");
    expect(sanitizeWhatsAppNumber("971-50-000-0000")).toBe("971500000000");
  });

  it("handles empty-notes case by omitting the special requests line", () => {
    // Empty notes
    const messageEmpty = generateWhatsAppMessageText({
      ...baseParams,
      notes: "",
    });
    expect(messageEmpty).not.toContain("Special Requests");

    // Undefined notes
    const messageUndefined = generateWhatsAppMessageText({
      ...baseParams,
      notes: undefined,
    });
    expect(messageUndefined).not.toContain("Special Requests");
  });

  it("includes special requests when provided", () => {
    const messageWithNotes = generateWhatsAppMessageText({
      ...baseParams,
      notes: "Quiet upper pod requested if available, arriving around 4 PM",
    });
    expect(messageWithNotes).toContain("• Special Requests: Quiet upper pod requested if available, arriving around 4 PM");
  });

  it("formats newlines and lines clearly in human-readable structure with sample rate note", () => {
    const text = generateWhatsAppMessageText(baseParams);
    const lines = text.split("\n");
    expect(lines.length).toBeGreaterThan(8);
    expect(text).toContain("Hello Rizq Luxurious Villa Team");
    expect(text).toContain("• Direct Offer: Code RIZQDIRECT (15% direct privilege applied)");
    expect(text).toContain("• Estimated Total: AED 612 (Sample rate, final rate confirmed on WhatsApp)");
  });

  it("encodes URL components properly without illegal characters", () => {
    const link = buildWhatsAppLink({
      ...baseParams,
      notes: "Quiet pod & fast check-in? 100% ready!",
    });

    expect(link.startsWith("https://wa.me/971500000000?text=")).toBe(true);

    // Extract query parameter and decode
    const url = new URL(link);
    const textParam = url.searchParams.get("text");
    expect(textParam).toBeDefined();
    expect(textParam).toContain("Quiet pod & fast check-in? 100% ready!");
    expect(textParam).toContain("Alex Vance");
  });

  it("formats adults-only guest line with minGuestAge", () => {
    const text = generateWhatsAppMessageText({
      ...baseParams,
      adults: 2,
      minGuestAge: 18,
    });
    expect(text).toContain("• Guests: 2 adult(s) (all 18+)");
  });
});
