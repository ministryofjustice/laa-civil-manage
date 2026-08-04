import { test, expect } from "@playwright/test";

test.describe("Justification page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prior-authority/expert/justification");
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

    await expect(page).toHaveURL("/prior-authority/expert/costs");
  });

  test("save and continue redirects to document upload", async ({ page }) => {
    await page
      .locator("#justification")
      .fill("This expert evidence is necessary to support the case.");

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/document-upload");
  });

  test("shows an error when submitted without justification", async ({
    page,
  }) => {
    await page.locator("#justification").fill("   ");
    await page.getByRole("button", { name: "Save and continue" }).click();

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
    await page.getByRole("button", { name: "Save and continue" }).click();

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
