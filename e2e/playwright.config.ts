import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: ".",
  testMatch: /cloud-browser\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["line"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://videntia.app",
    browserName: "chromium",
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
})
