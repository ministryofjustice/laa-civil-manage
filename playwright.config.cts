const { defineConfig, devices } = require("@playwright/test");
const TRY_ZER0 = 0;
const TRY_TWICE = 2;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./playwright-test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI ?? false),
  retries: process.env.CI === "true" ? TRY_TWICE : TRY_ZER0,
  workers: 1,
  reporter: "line",

  use: {
    baseURL: "http://localhost:3000",
    trace: process.env.CI === "true" ? "on" : "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "bun src/index.ts",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: process.env.CI !== "true",
    env: {
      API_URL: process.env.API_URL || "http://localhost:3000",
      SESSION_SECRET: process.env.SESSION_SECRET,
      SESSION_NAME: process.env.SESSION_NAME,
      AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
      AUTH_CLIENT_ID: process.env.AUTH_CLIENT_ID,
      AUTH_CLIENT_SECRET: process.env.AUTH_CLIENT_SECRET,
      AUTH_DIRECTORY_URL: process.env.AUTH_DIRECTORY_URL,
    },
  },
});
