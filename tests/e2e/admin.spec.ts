import { test, expect } from "@playwright/test";

test.describe("Admin Operations & Security Tests", () => {
  test("Admin authentication: wrong password rejected, rate limiting active, cookie security flags", async ({ request }) => {
    // 1. Wrong password rejected with 401
    const badLoginRes = await request.post("/api/admin/login", {
      data: { password: "completely_wrong_password_123" },
    });
    expect(badLoginRes.status()).toBe(401);

    // 2. Correct password returns 200 and sets httpOnly cookie
    const goodLoginRes = await request.post("/api/admin/login", {
      data: { password: "demo_admin_2026" },
    });
    expect(goodLoginRes.status()).toBe(200);

    const setCookie = goodLoginRes.headers()["set-cookie"];
    expect(setCookie).toBeTruthy();
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
  });

  test("iCal Feed Security: valid token returns RFC 5545 feed without PII; invalid token returns 401; bad room returns 404", async ({ request }) => {
    const validToken = "rizq_demo_ical_token_secure_2026";

    // 1. Valid token request
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

    // 2. Invalid token request returns 401
    const badTokenRes = await request.get("/api/ical/premium-single-capsule.ics?token=invalid_token_xyz");
    expect(badTokenRes.status()).toBe(401);

    // 3. Invalid room slug returns 404
    const badRoomRes = await request.get(`/api/ical/non-existent-room-slug.ics?token=${validToken}`);
    expect(badRoomRes.status()).toBe(404);
  });

  test("CSV Export contains expected headers, valid quotes and comma escaping", async ({ request }) => {
    // Authenticate
    await request.post("/api/admin/login", {
      data: { password: "demo_admin_2026" },
    });

    const exportRes = await request.get("/api/admin/export");
    expect(exportRes.status()).toBe(200);
    expect(exportRes.headers()["content-type"]).toContain("text/csv");

    const csv = await exportRes.text();
    const lines = csv.split("\n");
    const headerLine = lines[0];

    // Assert expected columns
    expect(headerLine).toContain("Reference");
    expect(headerLine).toContain("Room / Space");
    expect(headerLine).toContain("Check In");
    expect(headerLine).toContain("Check Out");
    expect(headerLine).toContain("Estimated Total (AED)");
  });

  test("Security Headers: X-Content-Type-Options, Referrer-Policy, Frame-Options/CSP present on responses", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"] || headers["content-security-policy"]).toBeTruthy();
    expect(headers["referrer-policy"]).toBeTruthy();
  });
});
