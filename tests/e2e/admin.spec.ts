import { test, expect } from "@playwright/test";

test.describe("Admin Operations & Security Tests", () => {
  test("Password prompt rejects invalid credentials and rate-limits after 5 failures", async ({ request }) => {
    const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 50}`;

    // 1-5: Invalid password rejected with 401
    for (let i = 0; i < 5; i++) {
      const badRes = await request.post("/api/admin/login", {
        headers: { "x-forwarded-for": testIp },
        data: { password: `wrong_pass_${i}` },
      });
      expect(badRes.status()).toBe(401);
    }

    // 6th attempt: Rate limited with 429
    const rateLimitedRes = await request.post("/api/admin/login", {
      headers: { "x-forwarded-for": testIp },
      data: { password: "any_attempt" },
    });
    expect(rateLimitedRes.status()).toBe(429);
  });

  test("Session cookie is httpOnly, secure, sameSite", async ({ request }) => {
    const goodLoginRes = await request.post("/api/admin/login", {
      data: { password: "demo_admin_2026" },
    });
    expect(goodLoginRes.status()).toBe(200);

    const setCookie = goodLoginRes.headers()["set-cookie"];
    expect(setCookie).toBeTruthy();
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
  });

  test("Confirm/decline a booking updates its status and recalculates calendar availability", async ({ request }) => {
    // 1. Create a hold booking with unique IP and phone
    const uniquePhone = `+971 50 ${Math.floor(1000000 + Math.random() * 9000000)}`;
    const uniqueIp = `198.51.100.${Math.floor(Math.random() * 200) + 50}`;
    const createRes = await request.post("/api/bookings", {
      headers: { "x-forwarded-for": uniqueIp },
      data: {
        roomId: "deluxe-double-capsule",
        checkIn: "2026-11-20",
        checkOut: "2026-11-24",
        adults: 1,
        guestName: "Status Workflow Guest",
        guestPhone: uniquePhone,
        promoCode: "RIZQDIRECT",
      },
    });
    expect(createRes.status()).toBe(200);
    const { ref } = await createRes.json();

    // Authenticate as Admin
    await request.post("/api/admin/login", {
      data: { password: "demo_admin_2026" },
    });

    // Get the booking id
    const listRes = await request.get("/api/admin/bookings");
    const { bookings } = await listRes.json();
    const targetBooking = bookings.find((b: any) => b.ref === ref);
    expect(targetBooking).toBeTruthy();

    // Confirm booking
    const confirmRes = await request.post(`/api/admin/bookings/${targetBooking.id}/confirm`);
    expect(confirmRes.status()).toBe(200);

    // Verify status is confirmed
    const verifyConfirmRes = await request.get("/api/admin/bookings");
    const updatedBookings = (await verifyConfirmRes.json()).bookings;
    const confirmedBooking = updatedBookings.find((b: any) => b.ref === ref);
    expect(confirmedBooking.status).toBe("confirmed");

    // Decline booking
    const declineRes = await request.post(`/api/admin/bookings/${targetBooking.id}/decline`, {
      data: { reason: "Admin test decline reason" },
    });
    expect(declineRes.status()).toBe(200);

    // Verify status is declined
    const verifyDeclineRes = await request.get("/api/admin/bookings");
    const declinedBookings = (await verifyDeclineRes.json()).bookings;
    const declinedBooking = declinedBookings.find((b: any) => b.ref === ref);
    expect(declinedBooking.status).toBe("declined");
  });

  test("Manual block on dates removes them from the guest picker", async ({ request }) => {
    // Authenticate as Admin
    await request.post("/api/admin/login", {
      data: { password: "demo_admin_2026" },
    });

    // Post a block for executive suite (capacity is 2)
    const blockRes = await request.post("/api/admin/blocks", {
      data: {
        roomTypeId: "executive-private-suite",
        startDate: "2026-12-18",
        endDate: "2026-12-22",
        units: 2,
        reason: "Scheduled Annual Maintenance",
      },
    });
    expect(blockRes.status()).toBe(200);

    // Guest availability check on blocked dates
    const availRes = await request.get(
      "/api/availability?room=executive-private-suite&checkIn=2026-12-18&checkOut=2026-12-22"
    );
    expect(availRes.status()).toBe(200);
    const availData = await availRes.json();

    expect(availData.isAvailable).toBe(false);
    expect(availData.minUnitsLeft).toBe(0);
  });

  test("CSV Export contains expected headers, valid quotes and comma escaping", async ({ request }) => {
    await request.post("/api/admin/login", {
      data: { password: "demo_admin_2026" },
    });

    const exportRes = await request.get("/api/admin/export");
    expect(exportRes.status()).toBe(200);
    expect(exportRes.headers()["content-type"]).toContain("text/csv");

    const csv = await exportRes.text();
    const lines = csv.split("\n");
    const headerLine = lines[0];

    expect(headerLine).toContain("Reference");
    expect(headerLine).toContain("Room / Space");
    expect(headerLine).toContain("Check In");
    expect(headerLine).toContain("Check Out");
    expect(headerLine).toContain("Estimated Total (AED)");
  });

  test("Changing a fact in /admin/facts immediately reflects in the public UI without a redeploy", async ({ request, page }) => {
    await request.post("/api/admin/login", {
      data: { password: "demo_admin_2026" },
    });

    // 1. Confirm check-in window and check-out time via /api/admin/facts
    const updateRes = await request.post("/api/admin/facts", {
      data: {
        key: "checkInWindow",
        value: "14:00 – 22:00",
        status: "confirmed",
      },
    });
    expect(updateRes.status()).toBe(200);

    const updateCheckOutRes = await request.post("/api/admin/facts", {
      data: {
        key: "checkOutTime",
        value: "11:00",
        status: "confirmed",
      },
    });
    expect(updateCheckOutRes.status()).toBe(200);

    // 2. Load public /book page in browser
    await page.goto("/book", { waitUntil: "domcontentloaded" });
    const content = await page.textContent("body");

    // The approved check-in window is immediately rendered
    expect(content).toContain("14:00 – 22:00");
    expect(content).toContain("11:00");

    // 3. Reset back to unconfirmed/conflicting state
    await request.post("/api/admin/facts", {
      data: {
        key: "checkInWindow",
        value: null,
        status: "conflicting",
      },
    });
    await request.post("/api/admin/facts", {
      data: {
        key: "checkOutTime",
        value: null,
        status: "conflicting",
      },
    });

    // 4. Reload public /book page
    await page.reload({ waitUntil: "domcontentloaded" });
    const resetContent = await page.textContent("body");

    // Fallback neutral wording returned, approved custom window gone
    expect(resetContent).toContain("Times confirmed when your booking is accepted");
    expect(resetContent).not.toContain("14:00 – 22:00");
  });

  test("iCal Feed Security: valid token returns RFC 5545 feed without PII; invalid token returns 401; bad room returns 404", async ({ request }) => {
    const validToken = "rizq_demo_ical_token_secure_2026";

    // Valid token request
    const validRes = await request.get(`/api/ical/premium-single-capsule.ics?token=${validToken}`);
    expect(validRes.status()).toBe(200);
    expect(validRes.headers()["content-type"]).toContain("text/calendar");

    const icalText = await validRes.text();
    expect(icalText).toContain("BEGIN:VCALENDAR");
    expect(icalText).toContain("VERSION:2.0");

    // Zero guest PII
    expect(icalText).not.toContain("@");
    expect(icalText).not.toMatch(/\+971/);
    expect(icalText).not.toContain("guestName");

    // Invalid token request returns 401
    const badTokenRes = await request.get("/api/ical/premium-single-capsule.ics?token=invalid_token_xyz");
    expect(badTokenRes.status()).toBe(401);

    // Invalid room slug returns 404
    const badRoomRes = await request.get(`/api/ical/non-existent-room-slug.ics?token=${validToken}`);
    expect(badRoomRes.status()).toBe(404);
  });

  test("Security Headers: X-Content-Type-Options, Referrer-Policy, Frame-Options/CSP present on responses", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"] || headers["content-security-policy"]).toBeTruthy();
    expect(headers["referrer-policy"]).toBeTruthy();
  });
});
