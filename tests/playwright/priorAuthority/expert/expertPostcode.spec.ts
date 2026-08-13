import { test, expect } from "#tests/playwright/helpers/fixtures.js";

test.describe("Expert postcode page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prior-authority/expert/postcode");
  });

  test("page has a back link taking to the previous page", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/expert/details");
  });

  test("page has heading with correct content", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: "Where is the service based?",
    });

    await expect(heading).toBeVisible();
  });

  test("page has a postcode input", async ({ page }) => {
    await expect(page.getByLabel("Postcode")).toBeVisible();
  });

  test("displays error summary and inline error when submitting without a postcode", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Enter a valid postcode",
    });
    await expect(errorLink).toBeVisible();

    const inlineError = page.locator(".govuk-error-message");
    await expect(inlineError).toContainText("Enter a valid postcode");
  });

  test("displays an error when submitting an invalid postcode", async ({
    page,
  }) => {
    await page.getByLabel("Postcode").fill("not a postcode");
    await page.getByRole("button", { name: "Continue" }).click();

    const inlineError = page.locator(".govuk-error-message");
    await expect(inlineError).toContainText("Enter a valid postcode");
  });

  test("normalises the postcode and redirects to the expert costs page", async ({
    page,
  }) => {
    await page.getByLabel("Postcode").fill("sw1a1aa");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/costs");

    await page.goto("/prior-authority/expert/postcode");
    await expect(page.getByLabel("Postcode")).toHaveValue("SW1A 1AA");
  });
});
