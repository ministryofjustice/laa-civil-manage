import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/pa-form/expert-details");
});

test("page has a back link taking to the previous page", async ({ page }) => {
  const backLink = page.getByRole("link", {
    name: "Back",
  });

  await expect(backLink).toBeVisible();

  await backLink.click();

  await expect(page).toHaveURL("/pa-form/search-an-expert-type");
});

test("page has heading with correct content", async ({ page }) => {
  const heading = page.getByRole("heading", {
    name: "Expert details",
  });

  await expect(heading).toBeVisible();
});

test("page has input box for full name with correct label", async ({
  page,
}) => {
  const fullNameInput = page.getByRole("textbox", {
    name: "Full Name",
  });

  await expect(fullNameInput).toBeVisible();
});

test("when a user leaves the input empty and submits the form, an error is displayed", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Save and continue" }).click();

  const errorSummaryHeading = page.getByRole("heading", {
    name: "There is a problem",
  });
  await expect(errorSummaryHeading).toBeVisible();

  const errorLink = page.getByRole("link", {
    name: "Enter the expert's full name",
  });
  await expect(errorLink).toBeVisible();

  const inlineError = page.locator(".govuk-error-message");
  await expect(inlineError).toContainText("Enter the expert's full name");
});

test("when a user inputs a full name and submits the form they are redirected to the next page", async ({
  page,
}) => {
  await page.getByRole("textbox", { name: "Full Name" }).fill("John Doe");
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL("/pa-form/document-upload");
});

//TODO - This test should be uncommented once the page after it has been implemented.

// test("should persist the selected Prior Authority Expert Details when navigating back", async ({
//   page,
// }) => {
//   const fullNameInput = page.getByRole("textbox", {
//     name: "Full Name",
//   });

//   await fullNameInput.fill("John Doe");

//   await page.getByRole("button", { name: "Save and continue" }).click();

//   await expect(page).toHaveURL("/pa-form/confirmation-page");

//   await page.getByRole("link", { name: "Back" }).click();

//   await expect(fullNameInput).toHaveValue("John Doe");
// });
