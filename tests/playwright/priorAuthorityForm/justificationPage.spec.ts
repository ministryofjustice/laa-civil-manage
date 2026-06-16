import { test, expect } from "@playwright/test";

test.describe("Justification page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prior-authority-form/justification");
  });

  test("page has the correct heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Why is this application necessary?",
      }),
    ).toBeVisible();
  });

  test("page has a back link navigating to expert costs", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL("/prior-authority-form/expert-costs");
  });

  test("save and continue redirects to document upload", async ({ page }) => {
    await page
      .locator("#word-count")
      .fill("This expert evidence is necessary to support the case.");

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL("/prior-authority-form/document-upload");
  });
});
