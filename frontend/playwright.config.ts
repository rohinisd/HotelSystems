import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3000";
const isRemote = !baseURL.includes("localhost");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: !isRemote,
  forbidOnly: !!process.env.CI,
  retries: isRemote ? 1 : 0,
  workers: isRemote ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["github"]] : "html",
  timeout: isRemote ? 120_000 : 60_000,

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: baseURL.includes("localhost")
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
