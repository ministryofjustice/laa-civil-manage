import { test, expect } from "@playwright/test";

test.describe("Is guideline rate exceeded page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prior-authority-form/is-guideline-rate-exceeded");
  });

  test("page has a back link taking to the previous page", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority-form/expert");
  });

  test("page has heading with correct content", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: "Is the expert charging more than the guideline rate or hours?",
    });

    await expect(heading).toBeVisible();
  });

  test("page has Yes and No radio options", async ({ page }) => {
    await expect(page.getByRole("radio", { name: "Yes" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "No" })).toBeVisible();
  });

  test("page has a guidance link to codified rates and guideline hours", async ({
    page,
  }) => {
    const guidanceHint = page.locator(".govuk-hint", {
      hasText: "See the guidance on",
    });
    await expect(guidanceHint).toBeVisible();
    await expect(guidanceHint).toContainText("See the guidance on");

    const guidanceLink = guidanceHint.getByRole("link", {
      name: "codified rates and guideline hours for experts",
    });

    await expect(guidanceLink).toBeVisible();

    const popupPromise = page.waitForEvent("popup");

    await guidanceLink.click();

    const newPage = await popupPromise;

    await newPage.waitForLoadState();

    await expect(newPage).toHaveURL(
      "https://www.gov.uk/guidance/expert-witnesses-in-legal-aid-cases",
    );
  });

  test("displays error summary and inline error when submitting without a selection", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Save and continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Select yes if the expert is charging more than the guideline rate or number of hours",
    });
    await expect(errorLink).toBeVisible();

    const inlineError = page.locator(".govuk-error-message");
    await expect(inlineError).toContainText(
      "Select yes if the expert is charging more than the guideline rate or number of hours",
    );
  });

  test("when Yes is selected, user is redirected to expert based in London page", async ({
    page,
  }) => {
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL(
      "/prior-authority-form/expert-based-in-london",
    );
  });

  test("when No is selected, user is redirected to the not-needed page", async ({
    page,
  }) => {
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL(
      "/prior-authority-form/no-prior-authority-needed",
    );
  });
});
