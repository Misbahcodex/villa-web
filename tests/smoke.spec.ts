import { test, expect } from "@playwright/test";

test.describe("Booking & Operations Smoke Test", () => {
  test("Guest submits booking, sees pending hold, and admin confirms in operations dashboard", async ({ page }) => {
    // 1. Visit booking page
    await page.goto("/book");
    await expect(page).toHaveTitle(/Direct Booking/i);

    // 2. Fill in guest name and phone
    await page.fill("#guestName", "Elena Rostova");
    await page.fill("#guestPhone", "+971501234567");

    // 3. Submit booking request
    await page.click('button[type="submit"]');

    // 4. Expect to see the confirmed hold screen with reference code
    await expect(page.locator("text=RESERVATION HOLD CONFIRMED")).toBeVisible({ timeout: 10000 });
    const refElement = page.locator("text=/RZQ-[A-Z0-9]{6}/");
    await expect(refElement).toBeVisible();

    const refText = await refElement.innerText();

    // 5. Navigate to Admin Operations Dashboard
    await page.goto("/admin");

    // If login prompt appears, authenticate
    if (await page.locator("#admin-pw").isVisible()) {
      await page.fill("#admin-pw", "demo_admin_2026");
      await page.click('button:has-text("ACCESS DASHBOARD")');
    }

    // 6. Check Inbox tab for the new reference
    await page.click('button:has-text("Inbox")');
    await expect(page.locator(`text=${refText}`)).toBeVisible();

    // 7. Click Confirm
    await page.click(`button:has-text("Confirm")`);

    // 8. Navigate to Calendar tab and verify update
    await page.click('button:has-text("Calendar & Blocks")');
    await expect(page.locator("text=INVENTORY BLOCKS & CALENDAR MANAGEMENT")).toBeVisible();
  });
});
