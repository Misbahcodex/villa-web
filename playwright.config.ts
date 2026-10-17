import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.TARGET_URL || process.env.BASE_URL || "https://villa-web-easo.vercel.app";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "qa-report/playwright-results.json" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    channel: "chrome",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: {
        viewport: { width: 1440, height: 900 },
        channel: "chrome",
      },
    },
    {
      name: "iphone-13",
      use: {
        ...devices["iPhone 13"],
        channel: "chrome",
      },
    },
    {
      name: "android-375",
      use: {
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
        channel: "chrome",
      },
    },
  ],
});
