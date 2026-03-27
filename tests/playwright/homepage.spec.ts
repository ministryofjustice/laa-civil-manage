/* eslint-disable no-console -- hell */
import { test, expect } from "@playwright/test";

test("homepage has correct title", async ({ page }) => {
  console.log("Running homepage title test", process.env.NODE_ENV);
  await page.goto("/");

  await expect(page).toHaveTitle("applications");
});

test("can see the main heading", async ({ page }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
});