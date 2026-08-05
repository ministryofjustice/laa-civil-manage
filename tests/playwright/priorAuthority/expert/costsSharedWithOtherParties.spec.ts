import { test, expect } from "@playwright/test";

test.describe("Expert based in London page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prior-authority/expert/costs-shared");
  });

  test("page has a back link taking to the previous page", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/expert/costs");
  });

  test("page has heading with correct content", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: "Will the expert’s costs be shared with other parties?",
    });

    await expect(heading).toBeVisible();
  });

  test("page has Yes and No radio options", async ({ page }) => {
    await expect(page.getByRole("radio", { name: "Yes" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "No" })).toBeVisible();
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
      name: 'Select "Yes" if the costs will be shared',
    });
    await expect(errorLink).toBeVisible();

    const inlineError = page.locator(".govuk-error-message");
    await expect(inlineError).toContainText(
      'Select "Yes" if the costs will be shared',
    );
  });

  test("when Yes is selected, user is redirected to the cost sharing page", async ({
    page,
  }) => {
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Save and continue" }).click();

    // TODO: update this as part of CM-443
    // await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");
  });

  test("when No is selected, user is redirected to the justification page", async ({
    page,
  }) => {
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/justification");
  });
});
