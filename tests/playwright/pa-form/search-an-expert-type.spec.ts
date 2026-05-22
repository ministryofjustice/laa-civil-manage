import { test, expect } from "@playwright/test";

test.describe("Search an expert type page", () => {
  test("page has a select box", async ({ page }) => {
    await page.goto("/pa-form/search-an-expert-type");

    const govukSelect = page.getByRole("combobox", { name: "Expert" });

    await expect(govukSelect).toBeVisible();
  });

  test("should show the correct expert types in the dropdown", async ({
    page,
  }) => {
    await page.goto("/pa-form/search-an-expert-type");

    const searchBox = page.getByRole("combobox", {
      name: "Search for the expert type",
    });

    await searchBox.fill("child");

    const psychiatristOption = page.getByRole("option", {
      name: "Child Psychiatrist",
    });
    await expect(psychiatristOption).toBeVisible();

    const psychologistOption = page.getByRole("option", {
      name: "Child Psychologist",
    });
    await expect(psychologistOption).toBeVisible();
  });

  test("page has a save and continue button present and functional", async ({
    page,
  }) => {
    await page.goto("/pa-form/search-an-expert-type");

    await page.getByRole("combobox", { name: "Expert" }).fill("hello");

    const saveAndContinueButton = page.getByRole("button", {
      name: "Save and continue",
    });

    await expect(saveAndContinueButton).toBeVisible();

    await saveAndContinueButton.click();

    await expect(page).toHaveURL("/pa-form/expert-costs");
  });

  test("page has a back link taking to the previous page", async ({ page }) => {
    await page.goto("/pa-form/search-an-expert-type");

    const backLink = page.getByRole("link", {
      name: "Back",
    });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/pa-form/expert-based-in-london");
  });

  test("displays error summary and inline error when submitting without a selection", async ({
    page,
  }) => {
    await page.goto("/pa-form/search-an-expert-type");
    await page.getByRole("button", { name: "Save and continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Search for and select an expert type",
    });
    await expect(errorLink).toBeVisible();

    const inlineError = page.locator(".govuk-error-message");
    await expect(inlineError).toContainText(
      "Search for and select an expert type",
    );
  });

  test("clicking the error summary link focuses the link", async ({ page }) => {
    await page.goto("/pa-form/search-an-expert-type");
    await page.getByRole("button", { name: "Save and continue" }).click();

    const errorLink = page.getByRole("link", {
      name: "Search for and select an expert type",
    });
    await errorLink.click();

    const combobox = page.getByRole("combobox", { name: "Expert" });
    await expect(combobox).toBeFocused();
  });

  test("should display error page when CSRF token is missing on submission", async ({
    page,
  }) => {
    await page.goto("/pa-form/search-an-expert-type");

    const csrfInput = page.locator('input[name="_csrf"]');

    await csrfInput.evaluate((node) => {
      (node as HTMLInputElement).value = "";
    });

    await page.getByRole("combobox", { name: "Expert" }).fill("hello");

    const saveAndContinueButton = page.getByRole("button", {
      name: "Save and continue",
    });

    await expect(saveAndContinueButton).toBeVisible();

    await saveAndContinueButton.click();

    const heading = page.getByRole("heading", {
      name: "Sorry, there is a problem with the service",
    });

    await expect(heading).toBeVisible();
  });

  test("should clear the combobox when the clear search link is clicked on", async ({
    page,
  }) => {
    await page.goto("/pa-form/search-an-expert-type");

    const searchBox = page.getByRole("combobox", { name: "Expert" });

    await searchBox.fill("hello");
    await expect(searchBox).toHaveValue("hello");

    const clearSearchLink = page.getByRole("link", { name: "Clear search" });

    await expect(clearSearchLink).toBeVisible();
    await clearSearchLink.click();

    await expect(searchBox).toBeEmpty();
  });

  test("when the search box is filled in and save and continue is pressed, then the back button is clicked, the value is still there", async ({
    page,
  }) => {
    await page.goto("/pa-form/search-an-expert-type");

    const searchBox = page.getByRole("combobox", {
      name: "Search for the expert type",
    });

    await searchBox.fill("de");

    const option = page.getByRole("option", { name: "Dentist" });
    await expect(option).toBeVisible();
    await option.click();

    await expect(searchBox).toHaveValue("Dentist");

    const saveAndContinueButton = page.getByRole("button", {
      name: "Save and continue",
    });

    await expect(saveAndContinueButton).toBeVisible();
    await saveAndContinueButton.click();
    await expect(page).toHaveURL("/pa-form/expert-costs");

    const backLink = page.getByRole("link", {
      name: "Back",
    });

    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL("/pa-form/search-an-expert-type");

    await expect(searchBox).toHaveValue("Dentist");
  });
});
