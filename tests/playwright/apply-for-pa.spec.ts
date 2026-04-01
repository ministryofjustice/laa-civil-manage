import { test, expect } from "@playwright/test";

test("page has correct title", async ({ page }) => {
  await page.goto("/");

  // CONTENTTODO
  await expect(page).toHaveTitle(`Civil Manage – GOV.UK`);
});

test("page has heading with correct content", async ({ page }) => {
  await page.goto("/");

  // CONTENTTODO
  const heading = page.getByRole("heading", {
    name: "Apply for civil legal aid",
  });

  await expect(heading).toBeVisible();
});

test("page has a start button present and redirect to next page", async ({
  page,
}) => {
  await page.goto("/");

  const startButton = page.getByRole("button", {
    name: "Start",
  });

  await expect(startButton).toBeVisible();

  await startButton.click();

  // CONTENTTODO
  await expect(page).toHaveURL("/apply-sca-and-other");
});

// CONTENTTODO Add test to check for Codified rates and guideline hours link when we have one
