import { test, expect } from "@playwright/test";

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

test("page has confirmation that the application was submitted and a reference number", async ({
  page,
}) => {
  await page.goto("/pa-form/confirmation-page");

  const heading = page.locator(".govuk-panel__title");
  await expect(heading).toHaveText("Prior authority application submitted");
  const confirmationNumber = page.locator(".govuk-panel__body");
  await expect(confirmationNumber).toContainText(/[A-Z0-9]{8}/);
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
