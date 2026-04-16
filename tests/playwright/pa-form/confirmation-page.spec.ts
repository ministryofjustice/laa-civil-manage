import { test, expect } from "@playwright/test";

test("page has correct title", async ({ page }) => {
  await page.goto("/pa-form/confirmation-page");

  await expect(page).toHaveTitle(`Civil Manage – GOV.UK`);
});

test("page has service title with correct content", async ({ page }) => {
  await page.goto("/pa-form/confirmation-page");

  const serviceTitle = page.getByRole("link", {
    name: "Apply for civil legal aid",
  });

  await expect(serviceTitle).toBeVisible();
});

test("page has a Manage your application button present and redirect to placeholder page", async ({
  page,
}) => {
  await page.goto("/pa-form/confirmation-page");

  const startButton = page.getByRole("button", {
    name: "Manage your application",
  });

  await expect(startButton).toBeVisible();
  await startButton.click();

  await expect(page).toHaveURL("/placeholder/mocked/stubbed");
});

test("page has a link taking us to the feedback", async ({ page }) => {
  await page.goto("/pa-form/confirmation-page");

  const guidelineLink = page
    .locator("a")
    .filter({ hasText: "Give feedback" })
    .first();

  await expect(guidelineLink).toBeVisible();

  await guidelineLink.click();

  expect(page.url()).toContain("feedback/new");
});
