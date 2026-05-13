import { test, expect } from "@playwright/test";

test("page has correct title", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
});

test("page has heading with correct content", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  const heading = page.getByRole("heading", {
    name: "What type of prior authority are you applying for?",
  });

  await expect(heading).toBeVisible();
});

test("page has radio options with correct labels and hint text", async ({
  page,
}) => {
  await page.goto("/pa-form/type-pa");

  const radioExpert = page.getByRole("radio", {
    name: "Expert",
    description: "A specialist who provides evidence, testing or assessment",
  });
  await expect(radioExpert).toBeVisible();
  const radioExpense = page.getByRole("radio", {
    name: "Expense",
    description: "A cost, such as travel, records, fees or reports",
  });
  const radioCounsel = page.getByRole("radio", {
    name: "Counsel",
    description:
      "Barristers who represent the client, give legal advice or prepare advocacy work",
  });

  await expect(radioExpert).toBeVisible();
  await expect(radioExpense).toBeVisible();
  await expect(radioCounsel).toBeVisible();

  await expect(
    page.getByText("A specialist who provides evidence, testing or assessment"),
  ).toBeVisible();
  await expect(
    page.getByText("A cost, such as travel, records, fees or reports"),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Barristers who represent the client, give legal advice or prepare advocacy work",
    ),
  ).toBeVisible();
});

test("page has a save and continue button present and functional", async ({
  page,
}) => {
  await page.goto("/pa-form/type-pa");

  await page.getByRole("radio", { name: "Expert" }).check();

  const saveAndContinueButton = page.getByRole("button", {
    name: "Save and continue",
  });

  await expect(saveAndContinueButton).toBeVisible();

  await saveAndContinueButton.click();

  await expect(page).toHaveURL("/pa-form/search-an-expert-type");
});

test("page has a back link taking to the previous page", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  const backLink = page.getByRole("link", {
    name: "Back",
  });

  await expect(backLink).toBeVisible();

  await backLink.click();

  await expect(page).toHaveURL("/pa-form/start-page");
});

test("displays error summary and inline error when submitting without a selection", async ({
  page,
}) => {
  await page.goto("/pa-form/type-pa");
  await page.getByRole("button", { name: "Save and continue" }).click();

  const errorSummaryHeading = page.getByRole("heading", {
    name: "There is a problem",
  });
  await expect(errorSummaryHeading).toBeVisible();

  const errorLink = page.getByRole("link", {
    name: "Select the type of prior authority",
  });
  await expect(errorLink).toBeVisible();

  const inlineError = page.locator(".govuk-error-message");
  await expect(inlineError).toContainText("Select the type of prior authority");
});

test("clicking the error summary link focuses the radio group", async ({
  page,
}) => {
  await page.goto("/pa-form/type-pa");
  await page.getByRole("button", { name: "Save and continue" }).click();

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
  await page.goto("/pa-form/type-pa");

  const csrfInput = page.locator('input[name="_csrf"]');

  await csrfInput.evaluate((node) => {
    (node as HTMLInputElement).value = "";
  });

  await page.getByRole("radio", { name: "Expert" }).check();

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

test("should persist the selected Prior Authority Type when navigating back", async ({
  page,
}) => {
  await page.goto("/pa-form/type-pa");
  const expertRadio = page.getByLabel("Expert");
  await expertRadio.check();

  await expect(expertRadio).toBeChecked();

  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL("/pa-form/search-an-expert-type");

  await page.getByRole("link", { name: "Back" }).click();

  await expect(expertRadio).toBeChecked();

  await expect(page.getByLabel("Expense")).not.toBeChecked();
  await expect(page.getByLabel("Counsel")).not.toBeChecked();
});
