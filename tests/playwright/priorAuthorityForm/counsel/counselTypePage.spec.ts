import { test, expect } from "@playwright/test";

test.describe("Counsel type page", () => {
  test("page has correct title", async ({ page }) => {
    await page.goto("/prior-authority/counsel/type");

    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has heading with correct content", async ({ page }) => {
    await page.goto("/prior-authority/counsel/type");

    const heading = page.getByRole("heading", {
      name: "What counsel are you applying for?",
    });

    await expect(heading).toBeVisible();
  });

  test("page has radio options with correct names", async ({ page }) => {
    await page.goto("/prior-authority/counsel/type");

    const radioKingsCounsel = page.getByRole("radio", {
      name: "King's Counsel alone",
      exact: true,
    });
    const radioTwoJuniorCounsel = page.getByRole("radio", {
      name: "Two Junior Counsel",
      exact: true,
    });
    const radioKingsCounselAndJunior = page.getByRole("radio", {
      name: "King's Counsel and Junior Counsel",
      exact: true,
    });
    const radioKingsAndTwoJuniorCounsel = page.getByRole("radio", {
      name: "King's Counsel and Two Junior Counsel",
      exact: true,
    });

    await expect(radioKingsCounsel).toBeVisible();
    await expect(radioTwoJuniorCounsel).toBeVisible();
    await expect(radioKingsCounselAndJunior).toBeVisible();
    await expect(radioKingsAndTwoJuniorCounsel).toBeVisible();
  });

  test("page has a save and continue button present which routes correctly", async ({
    page,
  }) => {
    await page.goto("/prior-authority/counsel/type");

    await page.getByRole("radio", { name: "King's Counsel alone" }).check();

    const continueButton = page.getByRole("button", {
      name: "Save and continue",
    });

    await expect(continueButton).toBeVisible();

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/justification");
  });

  test("displays error summary and inline error when submitting without a selection", async ({
    page,
  }) => {
    await page.goto("/prior-authority/counsel/type");
    await page.getByRole("button", { name: "Save and continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Select the counsel type",
    });
    await expect(errorLink).toBeVisible();

    const inlineError = page.locator(".govuk-error-message");
    await expect(inlineError).toContainText("Select the counsel type");
  });

  test("clicking the error summary link focuses the radio group", async ({
    page,
  }) => {
    await page.goto("/prior-authority/counsel/type");
    await page.getByRole("button", { name: "Save and continue" }).click();

    const errorLink = page.getByRole("link", {
      name: "Select the counsel type",
    });
    await errorLink.click();

    const firstRadio = page.getByRole("radio", {
      name: "King's Counsel alone",
    });
    await expect(firstRadio).toBeFocused();
  });

  test("should display error page when CSRF token is missing on submission", async ({
    page,
  }) => {
    await page.goto("/prior-authority/counsel/type");

    const csrfInput = page.locator('input[name="_csrf"]');

    await csrfInput.evaluate((node) => {
      (node as HTMLInputElement).value = "";
    });

    await page.getByRole("radio", { name: "King's Counsel alone" }).check();

    const continueButton = page.getByRole("button", {
      name: "Save and continue",
    });

    await expect(continueButton).toBeVisible();

    await continueButton.click();

    const heading = page.getByRole("heading", {
      name: "Sorry, there is a problem with the service",
    });

    await expect(heading).toBeVisible();
  });

  // TODO re add when justification page has been implemented
  // test("should persist the selected counsel type when navigating back", async ({
  //   page,
  // }) => {
  //   await page.goto("/prior-authority/counsel/type");
  //   const counselRadio = page.getByLabel("King's Counsel alone");
  //   await counselRadio.check();

  //   await expect(counselRadio).toBeChecked();

  //   await page.getByRole("button", { name: "Save and continue" }).click();

  //   await expect(page).toHaveURL("/prior-authority/counsel/justification");

  //   await page.getByRole("link", { name: "Back", exact: true }).click();

  //   await expect(counselRadio).toBeChecked();

  //   await expect(page.getByLabel("Two Junior Counsel")).not.toBeChecked();
  //   await expect(
  //     page.getByLabel("King's Counsel and Junior Counsel"),
  //   ).not.toBeChecked();
  //   await expect(
  //     page.getByLabel("King's Counsel and Two Junior Counsel"),
  //   ).not.toBeChecked();
  // });
});
