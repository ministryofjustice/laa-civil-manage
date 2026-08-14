import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

test.describe("Justification page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
    await page.goto("/prior-authority/counsel/justification");
  });

  test("page has the correct heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Why is this application necessary?",
      }),
    ).toBeVisible();
  });

  test("header has the correct hint text", async ({ page }) => {
    await expect(
      page.getByText(
        "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required.",
      ),
    ).toBeVisible();
  });

  test("has a back link to the counsel type page", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL("/prior-authority/counsel/type");
  });

  test("page has a text area for justification and the system can accept a value", async ({
    page,
  }) => {
    await page
      .locator("#justification")
      .fill("This counsel is necessary to support the case.");
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/prior-authority/counsel/document-upload");
  });

  test("accepts the reason entered within the set limit", async ({ page }) => {
    const reason = Array.from({ length: 20 }, () => "reason").join(" ");

    await page.locator("#justification").fill(reason);

    await expect(page.locator("#justification")).toHaveValue(reason);
    await expect(page.getByText("You have 480 words remaining")).toBeVisible();
  });

  test("saves the entered reason against the application and progresses to the next stage", async ({
    page,
  }) => {
    const reason =
      "Specialised counsel is required to advise on a complex point of law.";

    await page.locator("#justification").fill(reason);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/document-upload");

    await page.goto("/prior-authority/counsel/justification");
    await expect(page.locator("#justification")).toHaveValue(reason);
  });

  test("shows an error and stays on the page when saving without entering a reason", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/prior-authority/counsel/justification");

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Enter the reason for requesting specialised Counsel.",
    });
    await expect(errorLink).toBeVisible();

    const inlineError = page.locator(".govuk-error-message");
    await expect(inlineError).toContainText(
      "Enter the reason for requesting specialised Counsel.",
    );
  });

  test("shows an error and stays on the page when the word limit is exceeded", async ({
    page,
  }) => {
    const tooManyWords = Array.from({ length: 501 }, () => "reason").join(" ");

    await page.locator("#justification").fill(tooManyWords);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/justification");

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Justification must be 500 words or less",
    });
    await expect(errorLink).toBeVisible();

    const inlineError = page.locator("#justification-error");
    await expect(inlineError).toContainText(
      "Justification must be 500 words or less",
    );
  });
});
