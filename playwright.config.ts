import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testMatch: /critical-flows\.spec\.ts/ },
    { name: "mobile", use: { ...devices["iPhone 13"] }, testMatch: /mobile-flows\.spec\.ts/ },
    { name: "a11y", use: { ...devices["Desktop Chrome"] }, testMatch: /a11y\.spec\.ts/ },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "PORT=3001 npm run dev",
        url: "http://localhost:3001",
        timeout: 60_000,
        reuseExistingServer: !process.env.CI,
      },
});
