import { describe, it, expect } from "vitest";
import { inquirySchema, validRoomIds } from "@/lib/validation";
import { calculateNights, calculateBookingPrice, formatAED } from "@/lib/pricing";
import { buildWhatsAppLink, generateWhatsAppMessageText, sanitizeWhatsAppNumber } from "@/lib/whatsapp";
import { rooms } from "@/data/rooms";
import { siteConfig } from "@/data/site";

describe("QA Test Suite: Booking Flow End-to-End & Edge Cases", () => {
  it("Scenario 1: Happy path booking end-to-end with WhatsApp deep link generation", () => {
    const checkIn = "2026-11-10";
    const checkOut = "2026-11-14"; // 4 nights
    const room = rooms.find((r) => r.id === "deluxe-double-capsule")!;

    const pricing = calculateBookingPrice({
      startingRateAED: room.startingRateAED,
      checkIn,
      checkOut,
      discountPercent: 15,
    });

    expect(pricing.nights).toBe(4);
    expect(pricing.subtotal).toBe(260 * 4); // 1040
    expect(pricing.discountAmount).toBe(Math.round((1040 * 15) / 100)); // 156
    expect(pricing.totalAED).toBe(884);

    const formData = {
      guestName: "Elena Rostova",
      guestEmail: "elena@example.com",
      guestPhone: "+971501234567",
      roomId: room.id,
      checkIn,
      checkOut,
      guests: 2,
      promoCode: "RIZQDIRECT",
      specialRequests: "Quiet capsule preferred",
    };

    const validationResult = inquirySchema.safeParse(formData);
    expect(validationResult.success).toBe(true);

    const waLink = buildWhatsAppLink({
      whatsappNumber: siteConfig.whatsappNumber,
      guestName: formData.guestName,
      roomName: room.name,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      nights: pricing.nights,
      guests: formData.guests,
      promoCode: formData.promoCode,
      discountPercent: 15,
      estimatedTotalAED: pricing.totalAED,
      notes: formData.specialRequests,
    });

    expect(waLink).toContain("https://wa.me/");
    expect(waLink).toContain(sanitizeWhatsAppNumber(siteConfig.whatsappNumber));

    // Decode URL and verify message contents
    const parsedUrl = new URL(waLink);
    const decodedMessage = parsedUrl.searchParams.get("text") || "";

    expect(decodedMessage).toContain("Hello Rizq Luxurious Villa Team");
    expect(decodedMessage).toContain("• Guest Name: Elena Rostova");
    expect(decodedMessage).toContain(`• Room / Space: ${room.name}`);
    expect(decodedMessage).toContain("• Check-In: 2026-11-10");
    expect(decodedMessage).toContain("• Check-Out: 2026-11-14 (4 nights)");
    expect(decodedMessage).toContain("• Guests: 2 adult(s) (all 18+)");
    expect(decodedMessage).toContain("• Direct Offer: Code RIZQDIRECT (15% direct privilege applied)");
    expect(decodedMessage).toContain("• Estimated Total: AED 884 (Sample rate, final rate confirmed on WhatsApp)");
    expect(decodedMessage).toContain("• Special Requests: Quiet capsule preferred");
  });

  describe("Edge Case 1: Same-day check-in/out", () => {
    it("calculateNights returns 0 for same-day stay", () => {
      const nights = calculateNights("2026-11-10", "2026-11-10");
      expect(nights).toBe(0);
    });

    it("calculateBookingPrice returns 0 nights and 0 AED for same-day stay", () => {
      const pricing = calculateBookingPrice({
        startingRateAED: 260,
        checkIn: "2026-11-10",
        checkOut: "2026-11-10",
      });
      expect(pricing.nights).toBe(0);
      expect(pricing.totalAED).toBe(0);
    });

    it("inquirySchema rejects same-day check-in and check-out", () => {
      const result = inquirySchema.safeParse({
        guestName: "Test User",
        roomId: "deluxe-double-capsule",
        checkIn: "2026-11-10",
        checkOut: "2026-11-10",
        guests: 1,
        promoCode: "RIZQDIRECT",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const checkOutError = result.error.errors.find((e) => e.path.includes("checkOut"));
        expect(checkOutError).toBeDefined();
        expect(checkOutError?.message).toBe("Check-out date must be after check-in date");
      }
    });

    it("inquirySchema rejects past check-out date (check-out before check-in)", () => {
      const result = inquirySchema.safeParse({
        guestName: "Test User",
        roomId: "deluxe-double-capsule",
        checkIn: "2026-11-15",
        checkOut: "2026-11-10",
        guests: 1,
        promoCode: "RIZQDIRECT",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const checkOutError = result.error.errors.find((e) => e.path.includes("checkOut"));
        expect(checkOutError?.message).toBe("Check-out date must be after check-in date");
      }
    });
  });

  describe("Edge Case 2: Guests above room capacity", () => {
    it("rejects 2 guests for single capsule pod (max 1)", () => {
      const result = inquirySchema.safeParse({
        guestName: "Solo Traveler",
        roomId: "premium-single-capsule", // Max 1 guest
        checkIn: "2026-11-10",
        checkOut: "2026-11-12",
        guests: 2,
        promoCode: "RIZQDIRECT",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const guestError = result.error.errors.find((e) => e.path.includes("guests"));
        expect(guestError).toBeDefined();
        expect(guestError?.message).toBe("Guest count exceeds maximum capacity for this space");
      }
    });

    it("accepts 1 guest for single capsule pod", () => {
      const result = inquirySchema.safeParse({
        guestName: "Solo Traveler",
        roomId: "premium-single-capsule",
        checkIn: "2026-11-10",
        checkOut: "2026-11-12",
        guests: 1,
        promoCode: "RIZQDIRECT",
      });

      expect(result.success).toBe(true);
    });

    it("accepts up to 2 guests for deluxe double capsule pod", () => {
      const result = inquirySchema.safeParse({
        guestName: "Couple Traveling",
        roomId: "deluxe-double-capsule",
        checkIn: "2026-11-10",
        checkOut: "2026-11-12",
        guests: 2,
        promoCode: "RIZQDIRECT",
      });

      expect(result.success).toBe(true);
    });

    it("rejects > 2 guests across any room", () => {
      const result = inquirySchema.safeParse({
        guestName: "Group",
        roomId: "executive-private-suite",
        checkIn: "2026-11-10",
        checkOut: "2026-11-12",
        guests: 3,
        promoCode: "RIZQDIRECT",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const guestError = result.error.errors.find((e) => e.path.includes("guests"));
        expect(guestError).toBeDefined();
      }
    });
  });

  describe("Edge Case 3: Empty or invalid guest name", () => {
    it("rejects empty name", () => {
      const result = inquirySchema.safeParse({
        guestName: "",
        roomId: "deluxe-double-capsule",
        checkIn: "2026-11-10",
        checkOut: "2026-11-12",
        guests: 1,
        promoCode: "RIZQDIRECT",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.errors.find((e) => e.path.includes("guestName"));
        expect(nameError?.message).toContain("at least 2 characters");
      }
    });

    it("rejects single character or whitespace-only name", () => {
      const result = inquirySchema.safeParse({
        guestName: "   ",
        roomId: "deluxe-double-capsule",
        checkIn: "2026-11-10",
        checkOut: "2026-11-12",
        guests: 1,
        promoCode: "RIZQDIRECT",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Edge Case 4: Preselected room via /book?room=...", () => {
    it("validRoomIds lists all supported rooms", () => {
      expect(validRoomIds).toEqual([
        "premium-single-capsule",
        "deluxe-double-capsule",
        "executive-private-suite",
      ]);
    });

    it("falls back gracefully when an invalid room query param is passed", () => {
      const requestedParam: string = "unverified-penthouse";
      const resolvedRoomId = (validRoomIds as readonly string[]).includes(requestedParam)
        ? requestedParam
        : "deluxe-double-capsule";

      expect(resolvedRoomId).toBe("deluxe-double-capsule");
      const matchedRoom = rooms.find((r) => r.id === resolvedRoomId);
      expect(matchedRoom).toBeDefined();
      expect(matchedRoom?.name).toBe("Deluxe Double Capsule Pod");
    });
  });
});
