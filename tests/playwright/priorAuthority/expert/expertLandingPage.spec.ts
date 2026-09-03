import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

test.describe("Expert page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
    await page.goto("/applications/manage/APP-1001");
  });

  test("page has correct title", async ({ page }) => {
    await page.goto("/prior-authority/expert");

    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has correct heading", async ({ page }) => {
    await page.goto("/prior-authority/expert");
    const heading = page.getByRole("heading", {
      name: "Request prior authority for an expert service",
    });

    await expect(heading).toBeVisible();
  });

  test("page has a start button present and redirect to next page", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert");

    const startButton = page.getByRole("button", {
      name: "Start",
    });

    await expect(startButton).toBeVisible();

    await startButton.click();

    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
  });

  test("page has a back link taking to the previous page", async ({ page }) => {
    await page.goto("/prior-authority/expert");

    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/applications/manage/APP-DYNAMIC-ID");
  });
});
