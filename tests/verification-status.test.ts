import { describe, it, expect } from "vitest";
import { POST as handleBookingPost } from "@/app/api/bookings/route";
import { NextRequest } from "next/server";
import { propertyPolicies, showPolicy, Verified } from "@/data/policies";
import { propertyAddons } from "@/data/addons";
import { secondaryAmenities } from "@/data/amenities";
import { generateWhatsAppMessageText } from "@/lib/whatsapp";
import {
  getPropertyFacts,
  updatePropertyFact,
  countAwaitingConfirmation,
} from "@/lib/db/store";
import fs from "fs";
import path from "path";

describe("Verification-Status Model & Adults-Only Policy Tests", () => {
  describe("1. Adults-Only Policy & API Enforcement", () => {
    it("adultsOnly policy is confirmed with value true", () => {
      expect(propertyPolicies.adultsOnly.status).toBe("confirmed");
      expect(propertyPolicies.adultsOnly.value).toBe(true);
    });

    it("minGuestAge is seeded with value 18 and unconfirmed status", () => {
      expect(propertyPolicies.minGuestAge.status).toBe("unconfirmed");
      expect(propertyPolicies.minGuestAge.value).toBe(18);
    });

    it("API POST /api/bookings rejects any request with children > 0 with 400 and clear error message", async () => {
      const req = new NextRequest("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: "deluxe-double-capsule",
          checkIn: "2026-11-10",
          checkOut: "2026-11-14",
          adults: 2,
          children: 1, // Violates adults-only policy
          guestName: "Family Traveler",
          guestPhone: "+971 50 111 2222",
        }),
      });

      const response = await handleBookingPost(req);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toMatch(/Children are not permitted at this adults-only property/i);
    });
  });

  describe("2. WhatsApp Message Adults Formatting", () => {
    it("replaces children line with 'Guests: N adult(s) (all {minGuestAge}+)'", () => {
      const message = generateWhatsAppMessageText({
        whatsappNumber: "971500000000",
        guestName: "Liam Smith",
        roomName: "Deluxe Double Pod",
        checkIn: "2026-11-10",
        checkOut: "2026-11-14",
        nights: 4,
        adults: 2,
        minGuestAge: 18,
        estimatedTotalAED: 884,
      });

      expect(message).toContain("• Guests: 2 adult(s) (all 18+)");
      expect(message).not.toContain("Children");
    });
  });

  describe("3. showPolicy Helper & Verification Status Behavior", () => {
    it("returns neutral fallback when status is conflicting or unconfirmed", () => {
      const fallbackText = "Times confirmed when your booking is accepted";

      expect(showPolicy(propertyPolicies.checkInWindow)).toBe(fallbackText);
      expect(showPolicy(propertyPolicies.checkOutTime)).toBe(fallbackText);
      expect(showPolicy(propertyPolicies.paymentPolicy)).toBe(fallbackText);
    });

    it("returns stringified value only when status is confirmed", () => {
      expect(showPolicy(propertyPolicies.outdoorPool)).toBe("true");
      expect(showPolicy(propertyPolicies.coworking)).toBe("true");
      expect(showPolicy(propertyPolicies.wifiMbps)).toBe("500");
      expect(showPolicy(propertyPolicies.gym)).toBe("true");
      expect(showPolicy(propertyPolicies.shuttle)).toBe("true");
      expect(showPolicy(propertyPolicies.freeParking)).toBe("true");
      expect(showPolicy(propertyPolicies.selfServeLaundry)).toBe("true");

      const confirmedCheckIn: Verified<string> = {
        value: "15:00 – 23:00",
        status: "confirmed",
      };
      expect(showPolicy(confirmedCheckIn)).toBe("15:00 – 23:00");
    });
  });

  describe("4. Amenity Inclusions Rule", () => {
    it("public secondary amenities include confirmed items (gym, parking, laundry, shuttle)", () => {
      const titles = secondaryAmenities.map((a) => a.title.toLowerCase());
      expect(titles.some((t) => t.includes("gym"))).toBe(true);
      expect(titles.some((t) => t.includes("parking"))).toBe(true);
      expect(titles.some((t) => t.includes("laundry"))).toBe(true);
      expect(titles.some((t) => t.includes("shuttle"))).toBe(true);
    });

    it("shuttle add-on is disabled by default and has price 0", () => {
      const shuttle = propertyAddons.find((a) => a.id === "airport-shuttle");
      expect(shuttle).toBeDefined();
      expect(shuttle?.enabled).toBe(false);
      expect(shuttle?.priceAED).toBe(0);
      expect(shuttle?.priceConfirmed).toBe(false);
    });
  });

  describe("5. No 'TODO', 'unconfirmed', or source notes in Rendered UI / Public Files", () => {
    it("public page and component files do not contain 'TODO', 'unconfirmed', or listing source notes in user-facing JSX", () => {
      const publicFiles = [
        "app/page.tsx",
        "app/rooms/page.tsx",
        "app/amenities/page.tsx",
        "app/book/page.tsx",
        "app/lookup/page.tsx",
        "components/booking/BookingWidget.tsx",
        "components/rooms/RoomCard.tsx",
        "components/layout/Footer.tsx",
        "components/home/Hero.tsx",
        "components/home/TrustStrip.tsx",
        "components/home/CoworkingSection.tsx",
        "components/home/PoolSection.tsx",
        "components/home/SocialCafeSection.tsx",
        "data/amenities.ts",
      ];

      for (const file of publicFiles) {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");

          // Strip internal comments so we test rendered strings and JSX
          const contentWithoutComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

          expect(contentWithoutComments).not.toMatch(/\bTODO\b/);
          expect(contentWithoutComments).not.toMatch(/\bunconfirmed\b/i);
          expect(contentWithoutComments).not.toMatch(/Listing\s+[A-Z]:/i);
        }
      }
    });
  });

  describe("6. Admin Property Facts Store Operations", () => {
    it("getPropertyFacts returns all 12 verification-status facts", async () => {
      const facts = await getPropertyFacts();
      expect(Object.keys(facts).length).toBeGreaterThanOrEqual(12);
      expect(facts.adultsOnly.status).toBe("confirmed");
      expect(facts.minGuestAge.status).toBe("unconfirmed");
    });

    it("countAwaitingConfirmation counts facts whose status is not confirmed", async () => {
      const facts = await getPropertyFacts();
      const awaiting = countAwaitingConfirmation(facts);
      expect(awaiting).toBeGreaterThanOrEqual(3);
    });

    it("updatePropertyFact updates status and decreases awaiting count when confirmed", async () => {
      const initialFacts = await getPropertyFacts();
      const initialAwaiting = countAwaitingConfirmation(initialFacts);

      // Confirm minGuestAge
      const updated = await updatePropertyFact("minGuestAge", {
        value: 18,
        status: "confirmed",
      });

      expect(updated.minGuestAge.status).toBe("confirmed");
      expect(countAwaitingConfirmation(updated)).toBe(initialAwaiting - 1);

      // Revert back to unconfirmed for test hygiene
      await updatePropertyFact("minGuestAge", {
        value: 18,
        status: "unconfirmed",
      });
    });
  });
});
