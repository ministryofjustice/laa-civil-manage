import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const TRY_ZER0 = 0;
const TRY_TWICE = 2;
const wiremockMappingsPath = path.resolve(
  process.cwd(),
  "deploy/infrastructure/wiremock/mappings",
);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 60_000,
  testDir: "./tests/playwright",
  outputDir: "./playwright-test-results",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(process.env.CI ?? false),
  /* Retry on CI only */
  retries: process.env.CI === "true" ? TRY_TWICE : TRY_ZER0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // reporter: [["html", { outputFolder: "playwright-test-results" }]],
  reporter: "line",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI === "true" ? "on" : "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: `docker run --name wiremock-pw --rm -p 8080:8080 -v "${wiremockMappingsPath}:/home/wiremock/mappings" wiremock/wiremock:latest`,
      url: "http://127.0.0.1:8080/__admin/mappings",
      reuseExistingServer: process.env.CI === "false",
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "bun start",
      env: {
        SKIP_AUTH: "true",
        BACKEND_URL: "http://127.0.0.1:8080",
        DEPARTMENT_NAME: "Legal aid agency",
        RATE_LIMIT_MAX: "10000",
        RATE_WINDOW_MS: "1",
      },
      url: "http://127.0.0.1:3000",
      reuseExistingServer: process.env.CI === "false",
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
