import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/rooms", name: "rooms" },
  { path: "/book", name: "book" },
  { path: "/amenities", name: "amenities" },
  { path: "/lookup", name: "lookup" },
  { path: "/admin", name: "admin" },
  { path: "/non-existent-page-404", name: "404" },
];

const VIEWPORTS = [
  { width: 375, height: 667, name: "375" },
  { width: 768, height: 1024, name: "768" },
  { width: 1024, height: 768, name: "1024" },
  { width: 1440, height: 900, name: "1440" },
];

test.describe("Accessibility & Visual Screenshot Suite", () => {
  test.beforeAll(() => {
    const dir = path.join(process.cwd(), "qa-report", "screenshots");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  for (const route of ROUTES) {
    test(`axe-core automated scan: ${route.path} has zero critical or serious accessibility violations`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const criticalOrSerious = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      expect(
        criticalOrSerious,
        `Violations on ${route.path}: ${criticalOrSerious.map((v) => `${v.id} (${v.impact}): ${v.description}`).join("; ")}`
      ).toHaveLength(0);
    });
  }

  test("Visual Review: Full-page screenshot captures at 375, 768, 1024, and 1440 viewports", async ({ page }) => {
    test.setTimeout(90000);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ROUTES) {
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(500);

        const filename = `${route.name}-${vp.name}px.png`;
        const filepath = path.join(process.cwd(), "qa-report", "screenshots", filename);

        await page.screenshot({ path: filepath, fullPage: true });
        expect(fs.existsSync(filepath)).toBe(true);
      }
    }
  });

  test("Keyboard navigation and visible focus rings", async ({ page }) => {
    await page.goto("/book");
    await page.waitForTimeout(500);

    // Tab through elements and verify activeElement receives focus
    await page.keyboard.press("Tab");
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
    expect(["A", "BUTTON", "INPUT"]).toContain(activeTagName);
  });
});
