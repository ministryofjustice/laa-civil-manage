import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

test.describe("Justification page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
    await page.goto("/prior-authority/expert/justification");
  });

  test("page has the correct heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Is there anything else you'd like to tell us?",
      }),
    ).toBeVisible();
  });

  test("page has a back link navigating to costs shared", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
  });

  test("back link navigates to share of costs when the costs are shared", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/costs-shared");
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");

    await page.goto("/prior-authority/expert/justification");

    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");
  });

  test("Continue redirects to document upload", async ({ page }) => {
    await page
      .locator("#justification")
      .fill("This expert evidence is necessary to support the case.");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/document-upload");
  });

  test("shows an error when submitted without justification", async ({
    page,
  }) => {
    await page.locator("#justification").fill("   ");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/justification");
    await expect(
      page.getByRole("link", {
        name: "Enter why this application is necessary",
      }),
    ).toBeVisible();
    await expect(page.locator("#justification-error")).toContainText(
      "Enter why this application is necessary",
    );
  });

  test("shows an error when justification exceeds 500 words", async ({
    page,
  }) => {
    const overLimitJustification = Array.from(
      { length: 501 },
      () => "word",
    ).join(" ");

    await page.locator("#justification").fill(overLimitJustification);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/justification");
    await expect(
      page.getByRole("link", {
        name: "Justification must be 500 words or less",
      }),
    ).toBeVisible();
    await expect(page.locator("#justification-error")).toContainText(
      "Justification must be 500 words or less",
    );
  });
});
