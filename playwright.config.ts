import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1, // Single worker avoids test collisions on shared database
  forbidOnly: !!process.env.CI,
  retries: 0, // Strict: no retry-masked flakiness
  expect: {
    timeout: 15000,
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-artifacts/playwright-report", open: "never" }],
    ["json", { outputFile: "test-artifacts/results.json" }],
  ],
  use: {
    baseURL: "http://localhost:3002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
