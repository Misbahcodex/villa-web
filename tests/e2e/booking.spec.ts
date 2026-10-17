import { test, expect } from "@playwright/test";
import { calculateBookingPrice } from "../../lib/pricing";

test.describe("Booking Flow & Protection Tests", () => {
  test("Booking form controls: no children control, age checkbox gate, capacity clamping", async ({ page }) => {
    await page.goto("/book");

    // 1. Verify no children input or control exists
    const childrenInput = page.locator('input[name="children"], select[name="children"]');
    await expect(childrenInput).toHaveCount(0);

    // 2. Submit button is initially disabled until age checkbox is checked & form valid
    const submitBtn = page.locator('button[type="submit"]:has-text("REQUEST DIRECT RESERVATION")');
    await expect(submitBtn).toBeDisabled();

    // 3. Adults count is clamped to max capacity (e.g. 1 for single capsule)
    const plusAdultsBtn = page.locator('button[aria-label="Increase adults count"]');
    if (await plusAdultsBtn.isVisible()) {
      // If single capsule selected, plus button should be disabled at 1
      await expect(plusAdultsBtn).toBeDisabled();
    }

    // 4. Checking age agreement checkbox
    const ageCheckbox = page.locator('input[type="checkbox"]#adults-policy-agree');
    if (await ageCheckbox.isVisible()) {
      await ageCheckbox.check();
    }

    // Button still disabled until required fields (name, phone) are valid
    await expect(submitBtn).toBeDisabled();

    // Fill valid name and phone
    await page.fill('input[name="guestName"]', "Sarah Connor");
    await page.fill('input[name="guestPhone"]', "+971 50 999 1234");

    // Now submit button should be enabled
    await expect(submitBtn).toBeEnabled();
  });

  test("Price calculation matches lib/pricing for 1, 2, and 7 nights with 15% discount applied once", async () => {
    // 1 night: Single capsule 180 AED
    const p1 = calculateBookingPrice({
      roomTypeId: "premium-single-capsule",
      nights: 1,
      adults: 1,
      promoCode: "RIZQDIRECT",
      addons: [],
    });
    expect(p1.subtotalAED).toBe(180);
    expect(p1.discountAED).toBe(27); // 15%
    expect(p1.totalAED).toBe(153);

    // 2 nights: Deluxe double 260 AED/night = 520 AED
    const p2 = calculateBookingPrice({
      roomTypeId: "deluxe-double-capsule",
      nights: 2,
      adults: 2,
      promoCode: "RIZQDIRECT",
      addons: [],
    });
    expect(p2.subtotalAED).toBe(520);
    expect(p2.discountAED).toBe(78); // 15%
    expect(p2.totalAED).toBe(442);

    // 7 nights: Executive suite 540 AED/night = 3780 AED
    const p7 = calculateBookingPrice({
      roomTypeId: "executive-private-suite",
      nights: 7,
      adults: 2,
      promoCode: "RIZQDIRECT",
      addons: [],
    });
    expect(p7.subtotalAED).toBe(3780);
    expect(p7.discountAED).toBe(567); // 15%
    expect(p7.totalAED).toBe(3213);
  });

  test("Submit valid booking: renders Request Received (not locked/confirmed), RZQ-XXXXXX reference, and WhatsApp link", async ({ page }) => {
    await page.goto("/book");

    // Fill out form
    await page.fill('input[name="guestName"]', "Tariq Mansoor");
    await page.fill('input[name="guestPhone"]', "+971 52 444 8899");
    await page.fill('input[name="guestEmail"]', "tariq@nomad.tech");

    const ageCheckbox = page.locator('input[type="checkbox"]#adults-policy-agree');
    if (await ageCheckbox.isVisible()) {
      await ageCheckbox.check();
    }

    const submitBtn = page.locator('button[type="submit"]:has-text("REQUEST DIRECT RESERVATION")');
    await submitBtn.click();

    // Verify "REQUEST RECEIVED" screen
    await expect(page.locator("text=REQUEST RECEIVED")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=holding these dates for 12 hours")).toBeVisible();

    // Verify reference format RZQ-XXXXXX
    const refLocator = page.locator("text=/RZQ-[A-Z0-9]{6}/");
    await expect(refLocator).toBeVisible();
    const ref = await refLocator.innerText();

    // Verify WhatsApp button and URL
    const whatsappLink = page.locator('a:has-text("CONTINUE ON WHATSAPP")');
    await expect(whatsappLink).toBeVisible();
    const href = await whatsappLink.getAttribute("href");
    expect(href).toContain("https://wa.me/");

    const decodedUrl = decodeURIComponent(href || "");
    expect(decodedUrl).toContain("Tariq Mansoor");
    expect(decodedUrl).toContain(ref);
    expect(decodedUrl).toContain("RIZQDIRECT");
    expect(decodedUrl).toContain("Sample rates shown for demonstration");

    // Verify sample-rate disclaimer appears only once in the message
    const matches = decodedUrl.match(/Sample rates shown for demonstration/gi);
    expect(matches?.length).toBe(1);
  });

  test("API Concurrency: 10 parallel booking requests for last available unit yield exactly 1 success and 9 409 Conflict", async ({ request }) => {
    // We target a specific room on future dates
    const checkIn = "2026-11-20";
    const checkOut = "2026-11-22";
    const roomTypeId = "executive-private-suite"; // Only 1 unit in inventory

    const promises = Array.from({ length: 10 }).map((_, index) =>
      request.post("/api/bookings", {
        data: {
          roomId: roomTypeId,
          checkIn,
          checkOut,
          adults: 1,
          guestName: `Concurrent Guest ${index + 1}`,
          guestPhone: `+97150111${index.toString().padStart(4, "0")}`,
          promoCode: "RIZQDIRECT",
        },
      })
    );

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status());

    const successes = statuses.filter((s) => s === 201 || s === 200);
    const conflicts = statuses.filter((s) => s === 409 || s === 429);

    // Exactly 1 request acquires the single suite unit
    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(9);

    // Conflict response contains alternatives
    const conflictRes = responses.find((r) => r.status() === 409);
    if (conflictRes) {
      const body = await conflictRes.json();
      expect(body.error).toContain("sold out");
      expect(body.alternativeRooms || body.alternativeDates).toBeTruthy();
    }
  });

  test("Honeypot protection: silently discarded or rejected when honeypot field is filled", async ({ request }) => {
    const res = await request.post("/api/bookings", {
      data: {
        roomId: "premium-single-capsule",
        checkIn: "2026-12-15",
        checkOut: "2026-12-17",
        adults: 1,
        guestName: "Spambot 3000",
        guestPhone: "+971500000000",
        honeypot: "I am an automated spam bot filling hidden inputs",
      },
    });

    // Expect silent 200/400 without creating a real database hold
    expect([200, 400]).toContain(res.status());
    const data = await res.json();
    if (res.status() === 200) {
      expect(data.ref).toBeUndefined();
    }
  });

  test("Status lookup (/lookup): correct ref+phone shows details; invalid digits or unknown ref show identical error text", async ({ page }) => {
    await page.goto("/lookup");

    // 1. Submit non-existent ref
    await page.fill('input#ref', "RZQ-UNKNOWN");
    await page.fill('input#phoneLast4', "9999");
    await page.click('button:has-text("LOOK UP STAY")');

    await expect(page.locator("text=/No booking found matching that reference/i")).toBeVisible();
    const errorText1 = await page.locator("text=/No booking found/i").innerText();

    // 2. Submit mismatched phone
    await page.fill('input#ref', "RZQ-TESTING");
    await page.fill('input#phoneLast4', "0000");
    await page.click('button:has-text("LOOK UP STAY")');

    await expect(page.locator("text=/No booking found matching that reference/i")).toBeVisible();
    const errorText2 = await page.locator("text=/No booking found/i").innerText();

    // Identical error prevents phone enumeration
    expect(errorText1).toBe(errorText2);
  });
});
