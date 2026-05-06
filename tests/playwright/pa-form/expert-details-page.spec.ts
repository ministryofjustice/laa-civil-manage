import { test, expect } from "@playwright/test";

test("page has a back link taking to the previous page", async ({ page }) => {
  await page.goto("/pa-form/expert-details");

  const backLink = page.getByRole("link", {
    name: "Back",
  });

  await expect(backLink).toBeVisible();

  await backLink.click();

  await expect(page).toHaveURL("/pa-form/type-pa");
});

test("page has heading with correct content", async ({ page }) => {
  await page.goto("/pa-form/expert-details");

  const heading = page.getByRole("heading", {
    name: "Expert details",
  });

  await expect(heading).toBeVisible();
});

test("page has input box for full name with correct label", async ({
  page,
}) => {
  await page.goto("/pa-form/expert-details");

  const fullNameInput = page.getByRole("textbox", {
    name: "Full Name",
  });

  await expect(fullNameInput).toBeVisible();
});

test("page has a save and continue button present and functional", async ({
  page,
}) => {
  await page.goto("/pa-form/expert-details");

  const saveAndContinueButton = page.getByRole("button", {
    name: "Save and continue",
  });

  await expect(saveAndContinueButton).toBeVisible();

  await saveAndContinueButton.click();

  await expect(page).toHaveURL("/pa-form/document-upload");
});

test("displays error summary and inline error when submitting without filling in the input full name field", async ({
  page,
}) => {
  await page.goto("/pa-form/expert-details");
  await page.getByRole("button", { name: "Save and continue" }).click();

  const errorSummaryHeading = page.getByRole("heading", {
    name: "There is a problem",
  });
  await expect(errorSummaryHeading).toBeVisible();

  const errorLink = page.getByRole("link", {
    name: "Full Name cannot be empty",
  });
  await expect(errorLink).toBeVisible();

  const inlineError = page.locator(".govuk-error-message");
  await expect(inlineError).toContainText("Full Name cannot be empty");
});
