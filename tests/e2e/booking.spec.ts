import { test, expect } from "@playwright/test";
import { calculateBookingPrice } from "../../lib/pricing";

test.describe("Booking Flow & Protection Tests", () => {
  test("Booking form controls: no children control, age checkbox gate, capacity clamping", async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.40" });
    await page.goto("/book");

    // 1. Verify no children input or control exists
    const childrenInput = page.locator('input[name="children"], select[name="children"]');
    await expect(childrenInput).toHaveCount(0);

    // 2. Submit button is initially disabled until age checkbox is checked & form valid
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // 3. Select single capsule card (max 1 guest)
    await page.click('div[role="radio"]:has-text("Premium Single Capsule")');
    const plusAdultsBtn = page.locator('button[aria-label="Increase adult count"]');
    await expect(plusAdultsBtn).toBeDisabled();

    // 4. Select double capsule card (max 2 guests)
    await page.click('div[role="radio"]:has-text("Deluxe Double Capsule")');
    await expect(plusAdultsBtn).toBeEnabled();
    await plusAdultsBtn.click();
    // After incrementing to 2, plus button is clamped and disabled
    await expect(plusAdultsBtn).toBeDisabled();

    // 5. Checking age agreement checkbox
    const ageCheckbox = page.locator('input[type="checkbox"]#adults-age-confirmation-checkbox');
    await expect(ageCheckbox).toBeVisible();
    await ageCheckbox.check();

    // Button still disabled until required fields (name, phone) are valid
    await expect(submitBtn).toBeDisabled();

    // Fill valid name and phone
    await page.fill('input#guestName', "Sarah Connor");
    await page.fill('input#guestPhone', "+971 50 999 1234");

    // Now submit button should be enabled
    await expect(submitBtn).toBeEnabled();
  });

  test("Price calculation matches lib/pricing for 1, 2, and 7 nights with 15% discount applied once", async () => {
    // 1 night: Single capsule 180 AED
    const p1 = calculateBookingPrice({
      startingRateAED: 180,
      checkIn: "2026-11-01",
      checkOut: "2026-11-02",
      discountPercent: 15,
    });
    expect(p1.nights).toBe(1);
    expect(p1.subtotal).toBe(180);
    expect(p1.discountAmount).toBe(27); // 15%
    expect(p1.totalAED).toBe(153);

    // 2 nights: Deluxe double 260 AED/night = 520 AED
    const p2 = calculateBookingPrice({
      startingRateAED: 260,
      checkIn: "2026-11-01",
      checkOut: "2026-11-03",
      discountPercent: 15,
    });
    expect(p2.nights).toBe(2);
    expect(p2.subtotal).toBe(520);
    expect(p2.discountAmount).toBe(78); // 15%
    expect(p2.totalAED).toBe(442);

    // 7 nights: Executive suite 540 AED/night = 3780 AED
    const p7 = calculateBookingPrice({
      startingRateAED: 540,
      checkIn: "2026-11-01",
      checkOut: "2026-11-08",
      discountPercent: 15,
    });
    expect(p7.nights).toBe(7);
    expect(p7.subtotal).toBe(3780);
    expect(p7.discountAmount).toBe(567); // 15%
    expect(p7.totalAED).toBe(3213);
  });

  test("Submit valid booking: renders Request Received (not locked/confirmed), RZQ-XXXXXX reference, and WhatsApp link", async ({ page, context }) => {
    const testIp = `198.51.100.${Math.floor(Math.random() * 150) + 50}`;
    const testPhone = `+971 52 ${Math.floor(Math.random() * 800) + 100} ${Math.floor(Math.random() * 8000) + 1000}`;
    await context.setExtraHTTPHeaders({ "x-forwarded-for": testIp });
    await page.goto("/book");

    // Fill out form
    await page.fill('input#guestName', "Tariq Mansoor");
    await page.fill('input#guestPhone', testPhone);
    await page.fill('input#guestEmail', "tariq@nomad.tech");

    const ageCheckbox = page.locator('input[type="checkbox"]#adults-age-confirmation-checkbox');
    await ageCheckbox.check();

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify "REQUEST RECEIVED" screen
    await expect(page.locator("text=REQUEST RECEIVED")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=/holding these dates for 12 hours/i")).toBeVisible();

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
    expect(decodedUrl).toMatch(/sample rate/i);

    // Verify sample-rate disclaimer appears only once in the message
    const matches = decodedUrl.match(/sample rate/gi);
    expect(matches?.length).toBe(1);
  });

  test("API Concurrency: 10 parallel booking requests for last available unit yield exactly 1 success and 9 409 Conflict", async ({ request }) => {
    // Dynamic future dates guaranteeing unit availability
    const randomOffset = Math.floor(Math.random() * 200) + 60;
    const checkInDate = new Date(Date.now() + randomOffset * 86400000);
    const checkOutDate = new Date(Date.now() + (randomOffset + 2) * 86400000);
    const checkIn = checkInDate.toISOString().slice(0, 10);
    const checkOut = checkOutDate.toISOString().slice(0, 10);
    const roomId = "executive-private-suite"; // Only 1 unit in inventory

    const promises = Array.from({ length: 10 }).map((_, index) =>
      request.post("/api/bookings", {
        headers: {
          "x-forwarded-for": `192.168.120.${index + 1}`,
        },
        data: {
          roomId,
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
    const bodies = await Promise.all(responses.map(async (r) => {
      try { return await r.json(); } catch { return await r.text(); }
    }));
    console.log("Concurrency test statuses:", statuses, "bodies:", bodies);

    const successes = statuses.filter((s) => s === 201 || s === 200);
    const conflicts = statuses.filter((s) => s === 409 || s === 429);

    // Exactly 1 request acquires the single suite unit, 9 get 409 Conflict (or 429)
    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(9);

    // Conflict response contains alternatives
    const conflictRes = responses.find((r) => r.status() === 409);
    expect(conflictRes).toBeDefined();
    if (conflictRes) {
      const body = await conflictRes.json();
      expect(body.error).toMatch(/fully booked|sold out/i);
      expect(body.alternativeRooms || body.alternativeDates).toBeTruthy();
    }
  });

  test("Hold limit: attempting to hold more than 2 pending requests from the same phone/IP is rejected", async ({ request }) => {
    const testIp = `10.20.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 10}`;
    const testPhone = `+97150${Math.floor(1000000 + Math.random() * 9000000)}`;

    // Request 1
    const res1 = await request.post("/api/bookings", {
      headers: { "x-forwarded-for": testIp },
      data: {
        roomId: "premium-single-capsule",
        checkIn: "2027-02-05",
        checkOut: "2027-02-07",
        adults: 1,
        guestName: "Active Guest Hold 1",
        guestPhone: testPhone,
      },
    });
    expect([200, 201]).toContain(res1.status());

    // Request 2
    const res2 = await request.post("/api/bookings", {
      headers: { "x-forwarded-for": testIp },
      data: {
        roomId: "premium-single-capsule",
        checkIn: "2027-02-08",
        checkOut: "2027-02-10",
        adults: 1,
        guestName: "Active Guest Hold 2",
        guestPhone: testPhone,
      },
    });
    expect([200, 201]).toContain(res2.status());

    // Request 3 (should be rejected because activeHolds.length >= 2)
    const res3 = await request.post("/api/bookings", {
      headers: { "x-forwarded-for": testIp },
      data: {
        roomId: "premium-single-capsule",
        checkIn: "2027-02-11",
        checkOut: "2027-02-13",
        adults: 1,
        guestName: "Active Guest Hold 3",
        guestPhone: testPhone,
      },
    });
    expect(res3.status()).toBe(429);
    const body3 = await res3.json();
    expect(body3.error).toContain("maximum of 2 active reservation requests");
  });

  test("Rate limiting: 4th POST within 10 min from same IP returns 429", async ({ request }) => {
    const testIp = `172.16.50.${Math.floor(Math.random() * 200) + 10}`;
    const responses = [];

    for (let i = 0; i < 4; i++) {
      const res = await request.post("/api/bookings", {
        headers: { "x-forwarded-for": testIp },
        data: {
          roomId: "premium-single-capsule",
          checkIn: "2027-03-01",
          checkOut: "2027-03-03",
          adults: 1,
          guestName: `Spammer ${i}`,
          guestPhone: `+97150777${i}000`,
          promoCode: "RIZQDIRECT",
        },
      });
      responses.push(res.status());
    }

    // First 3 can succeed or conflict, but 4th MUST be 429 Too Many Requests
    expect(responses[3]).toBe(429);
  });

  test("Honeypot protection: silently handled without creating real database hold", async ({ request }) => {
    const honeypotIp = `10.99.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 10}`;
    const res = await request.post("/api/bookings", {
      headers: { "x-forwarded-for": honeypotIp },
      data: {
        roomId: "premium-single-capsule",
        checkIn: "2027-04-15",
        checkOut: "2027-04-17",
        adults: 1,
        guestName: "Spambot 3000",
        guestPhone: "+971500000000",
        honeypot: "I am an automated spam bot filling hidden inputs",
      },
    });

    expect([200, 400]).toContain(res.status());
    const data = await res.json();
    if (res.status() === 200) {
      // Fake spam reference returned to mislead bot without real hold
      expect(data.ref).toBe("RZQ-SPAM00");
    }
  });

  test("Status lookup (/lookup): correct ref+phone shows details; invalid digits or unknown ref show identical error text", async ({ page, request, context }) => {
    const testLookupIp = `198.51.100.${Math.floor(Math.random() * 100) + 120}`;
    const testLookupPhone = `+97150${Math.floor(1000000 + Math.random() * 9000000)}`;
    const last4 = testLookupPhone.slice(-4);
    await context.setExtraHTTPHeaders({ "x-forwarded-for": testLookupIp });

    // Create a known reservation for lookup verification
    const bookingRes = await request.post("/api/bookings", {
      headers: { "x-forwarded-for": testLookupIp },
      data: {
        roomId: "deluxe-double-capsule",
        checkIn: "2027-05-10",
        checkOut: "2027-05-13",
        adults: 2,
        guestName: "Lookup Guest",
        guestPhone: testLookupPhone,
        guestEmail: "lookup@test.com",
      },
    });
    expect([200, 201]).toContain(bookingRes.status());
    const { ref: activeRef } = await bookingRes.json();
    expect(activeRef).toMatch(/^RZQ-[A-Z0-9]{6}$/);

    await page.goto("/lookup");

    // 1. Submit non-existent ref
    await page.fill('input#ref', "RZQ-UNKNOWN");
    await page.fill('input#phoneLast4', "9999");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/No reservation found matching that reference/i")).toBeVisible();
    const errorText1 = await page.locator("text=/No reservation found/i").innerText();

    // 2. Submit mismatched phone with valid ref
    await page.fill('input#ref', activeRef);
    await page.fill('input#phoneLast4', "0000");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/No reservation found matching that reference/i")).toBeVisible();
    const errorText2 = await page.locator("text=/No reservation found/i").innerText();

    // Identical error prevents phone enumeration
    expect(errorText1).toBe(errorText2);

    // 3. Submit correct ref + phone
    await page.fill('input#ref', activeRef);
    await page.fill('input#phoneLast4', last4);
    await page.click('button[type="submit"]');

    // Details are revealed
    await expect(page.locator(`span:text-is("${activeRef}")`)).toBeVisible();
    await expect(page.locator("text=Awaiting confirmation")).toBeVisible();
    await expect(page.locator("text=Deluxe Double Capsule Pod")).toBeVisible();
  });
});
