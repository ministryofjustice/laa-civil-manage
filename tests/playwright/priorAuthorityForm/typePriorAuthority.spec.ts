import { test, expect } from "@playwright/test";

test.describe("Prior authority type page", () => {
  test("page has correct title", async ({ page }) => {
    await page.goto("/prior-authority-form/type-prior-authority");

    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has heading with correct content", async ({ page }) => {
    await page.goto("/prior-authority-form/type-prior-authority");

    const heading = page.getByRole("heading", {
      name: "What type of prior authority are you applying for?",
    });

    await expect(heading).toBeVisible();
  });

  test("page has radio options with correct labels and hint text", async ({
    page,
  }) => {
    await page.goto("/prior-authority-form/type-prior-authority");

    const radioExpert = page.getByRole("radio", {
      name: "Expert",
      description: "A specialist who provides evidence, testing or assessment",
    });
    await expect(radioExpert).toBeVisible();
    const radioDisbursement = page.getByRole("radio", {
      name: "Disbursement",
      description: "A cost, such as travel, records, fees or reports",
    });
    const radioCounsel = page.getByRole("radio", {
      name: "Counsel",
      description:
        "Barristers who represent the client, give legal advice or prepare advocacy work",
    });

    await expect(radioExpert).toBeVisible();
    await expect(radioDisbursement).toBeVisible();
    await expect(radioCounsel).toBeVisible();
  });

  test("page has a save and continue button present and functional", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("radio", { name: "Expert" }).check();

    const continueButton = page.getByRole("button", {
      name: "Continue",
    });

    await expect(continueButton).toBeVisible();

    await continueButton.click();

    await expect(page).toHaveURL("/prior-authority-form/expert");
  });

  test("displays error summary and inline error when submitting without a selection", async ({
    page,
  }) => {
    await page.goto("/prior-authority-form/type-prior-authority");
    await page.getByRole("button", { name: "Continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Select the type of prior authority",
    });
    await expect(errorLink).toBeVisible();

    const inlineError = page.locator(".govuk-error-message");
    await expect(inlineError).toContainText(
      "Select the type of prior authority",
    );
  });

  test("clicking the error summary link focuses the radio group", async ({
    page,
  }) => {
    await page.goto("/prior-authority-form/type-prior-authority");
    await page.getByRole("button", { name: "Continue" }).click();

    const errorLink = page.getByRole("link", {
      name: "Select the type of prior authority",
    });
    await errorLink.click();

    const firstRadio = page.getByRole("radio", { name: "Expert" });
    await expect(firstRadio).toBeFocused();
  });

  test("should display error page when CSRF token is missing on submission", async ({
    page,
  }) => {
    await page.goto("/prior-authority-form/type-prior-authority");

    const csrfInput = page.locator('input[name="_csrf"]');

    await csrfInput.evaluate((node) => {
      (node as HTMLInputElement).value = "";
    });

    await page.getByRole("radio", { name: "Expert" }).check();

    const continueButton = page.getByRole("button", {
      name: "Continue",
    });

    await expect(continueButton).toBeVisible();

    await continueButton.click();

    const heading = page.getByRole("heading", {
      name: "Sorry, there is a problem with the service",
    });

    await expect(heading).toBeVisible();
  });

  test("should persist the selected Prior Authority Type when navigating back", async ({
    page,
  }) => {
    await page.goto("/prior-authority-form/type-prior-authority");
    const expertRadio = page.getByLabel("Expert");
    await expertRadio.check();

    await expect(expertRadio).toBeChecked();

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority-form/expert");

    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(expertRadio).toBeChecked();

    await expect(page.getByLabel("Disbursement")).not.toBeChecked();
    await expect(page.getByLabel("Counsel")).not.toBeChecked();
  });
});
