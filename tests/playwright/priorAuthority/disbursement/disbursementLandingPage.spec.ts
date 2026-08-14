import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

test.describe("Disbursement landing page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
  });

  test("redirects to applications when no application is in session", async ({
    page,
  }) => {
    await page.goto("/prior-authority/disbursement");

    await expect(page).toHaveURL("/applications");
  });

  test("page has correct title", async ({ page }) => {
    await page.goto("/applications/manage/APP-1001");
    await page.goto("/prior-authority/disbursement");

    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has heading with correct content", async ({ page }) => {
    await page.goto("/applications/manage/APP-1001");
    await page.goto("/prior-authority/disbursement");

    const heading = page.getByRole("heading", {
      name: "Request prior authority to incur a disbursement",
    });

    await expect(heading).toBeVisible();
  });

  test("page has a start button present and redirects to next page", async ({
    page,
  }) => {
    await page.goto("/applications/manage/APP-1001");
    await page.goto("/prior-authority/disbursement");

    const startButton = page.getByRole("button", {
      name: "Start",
    });

    await expect(startButton).toBeVisible();

    await startButton.click();

    await expect(page).toHaveURL("/prior-authority/disbursement/details");
  });

  test("page has a back link taking to the application page", async ({
    page,
  }) => {
    await page.goto("/applications/manage/APP-1001");
    await page.goto("/prior-authority/disbursement");

    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/applications/manage/APP-DYNAMIC-ID");
  });
});
