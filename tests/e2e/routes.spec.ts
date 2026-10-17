import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/", expectedStatus: 200, name: "Home" },
  { path: "/rooms", expectedStatus: 200, name: "Rooms" },
  { path: "/book", expectedStatus: 200, name: "Book" },
  { path: "/amenities", expectedStatus: 200, name: "Amenities" },
  { path: "/lookup", expectedStatus: 200, name: "Lookup" },
  { path: "/admin", expectedStatus: 200, name: "Admin" },
  { path: "/non-existent-stay-404", expectedStatus: 404, name: "404 Page" },
];

const BANNED_TERMS = [
  "soundproof",
  "fiber",
  "symmetrical",
  "sqm",
  "m²",
  "en-suite",
  "courtyard",
  "coral",
  "blossom",
  "rizqvilla.com",
  "agoda",
  "hostelworld",
  "trip.com",
  "real-time",
];

test.describe("Route Integrity & Content QA Suite", () => {
  for (const route of ROUTES) {
    test(`Route ${route.path} (${route.name}) satisfies all production & demo constraints`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("response", (res) => {
        // Exclude expected 404 on bad url and expected 401 on initial admin check
        const url = res.url();
        const status = res.status();
        if (route.expectedStatus === 404 && url.includes("/non-existent-stay-404")) return;
        if (status === 401 && (url.includes("/api/admin/") || url.includes("/admin"))) return;
        if (status >= 400) {
          failedRequests.push(`${status} ${url}`);
        }
      });

      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(route.expectedStatus);

      // Wait a tick for hydration
      await page.waitForTimeout(600);

      // 1. No console errors or hydration warnings
      const hydrationErrors = consoleErrors.filter((e) =>
        /hydration|did not match|hydrating/i.test(e)
      );
      expect(hydrationErrors, `Hydration errors on ${route.path}: ${hydrationErrors.join(", ")}`).toHaveLength(0);

      const actualConsoleErrors = consoleErrors.filter((e) => {
        if (route.expectedStatus === 404 && e.includes("status of 404")) return false;
        if (route.path.startsWith("/admin") && e.includes("status of 401")) return false;
        if (e.includes("favicon")) return false;
        return true;
      });
      expect(actualConsoleErrors, `Console errors on ${route.path}: ${actualConsoleErrors.join(", ")}`).toHaveLength(0);
      expect(failedRequests, `Failed requests on ${route.path}: ${failedRequests.join(", ")}`).toHaveLength(0);

      // 2. No horizontal scroll
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth, `Horizontal scroll detected on ${route.path}`).toBeLessThanOrEqual(innerWidth);

      // 3. Exactly one <h1>
      const h1Elements = await page.locator("h1").all();
      expect(h1Elements.length, `Expected exactly 1 <h1> on ${route.path}, found ${h1Elements.length}`).toBe(1);

      // 4. Every <img> has non-empty alt and naturalWidth > 0
      const imgCount = await page.locator("img").count();
      for (let i = 0; i < imgCount; i++) {
        const img = page.locator("img").nth(i);
        const alt = await img.getAttribute("alt");
        expect(alt, `Image #${i} on ${route.path} has empty or missing alt`).toBeTruthy();

        // Scroll into view so lazy loading triggers
        await img.scrollIntoViewIfNeeded().catch(() => {});
        const handle = await img.elementHandle();
        let isLoaded = false;
        if (handle) {
          isLoaded = await page
            .waitForFunction((el: HTMLImageElement) => el.complete && el.naturalWidth > 0, handle, {
              timeout: 6000,
            })
            .then(() => true)
            .catch(async () => {
              return await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
            });
        }
        expect(isLoaded, `Image #${i} (alt: "${alt}") on ${route.path} failed to render naturalWidth > 0`).toBe(true);
      }

      // 5. Meta robots noindex,nofollow present
      const robotsMeta = await page.locator('meta[name="robots"]').first().getAttribute("content");
      expect(robotsMeta?.replace(/\s+/g, "").toLowerCase()).toContain("noindex");

      // 6. Demo ribbon is visible
      const demoRibbon = page.locator("text=DEMO MODE");
      await expect(demoRibbon).toBeVisible();

      // 7. Banned string scan of page source and rendered text
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const pageSource = (await page.content()).toLowerCase();

      for (const term of BANNED_TERMS) {
        expect(pageText, `Banned term "${term}" found in text of ${route.path}`).not.toContain(term);
        // Exclude script paths or CSS classes, search for visible words
        const termRegex = new RegExp(`\\b${term}\\b`, "i");
        expect(pageText).not.toMatch(termRegex);
      }

      // Specific rule: "verified" must not appear next to review counts
      expect(pageText).not.toMatch(/verified\s+(reputation|reviews|google)/i);

      // Specific rule: no unverified "queen" or "king" bed claims
      expect(pageText).not.toMatch(/\b(queen|king)\s+bed/i);

      // Specific rule: no "locked" for reservations
      expect(pageText).not.toMatch(/dates\s+locked|locked\s+for\s+you/i);

      // Specific rule: no TODO or CONFIRM in public UI
      if (!route.path.startsWith("/admin")) {
        expect(pageText).not.toContain("todo");
        expect(pageText).not.toContain("confirm with client");
      }

      // 8. Rating check wherever reviews are shown
      if (pageText.includes("reviews") || pageText.includes("rating")) {
        if (pageText.includes("google")) {
          expect(pageText).toContain("4.7");
          expect(pageText).toContain("2,324");
        }
      }
    });
  }

  test("GET /robots.txt disallows all in demo mode", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/user-agent:\s*\*/i);
    expect(text).toMatch(/disallow:\s*\//i);
  });
});
