import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";
import type { Page } from "@playwright/test";

async function completeDisbursementJourney(page: Page): Promise<void> {
  await page.goto("/applications/manage/APP-1001");
  await page.goto("/prior-authority/disbursement");
  await page.goto("/prior-authority/disbursement/details");

  await page
    .getByRole("textbox", { name: "What is the disbursement for?" })
    .fill("Medical records request");
  await page.locator("#PriorAuthorityDisbursementAmount").fill("150.50");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL("/prior-authority/disbursement/justification");
  await page
    .locator("#justification")
    .fill("This disbursement is necessary to support the case.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL("/prior-authority/disbursement/document-upload");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "disbursement-quote.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\ntest file content"),
  });
  await page.getByText("disbursement-quote.pdf").first().waitFor();
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes("/ajax-category-url"),
    ),
    page.locator(".pa-document-category-select").selectOption({
      label: "Primary quote",
    }),
  ]);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(
    "/prior-authority/disbursement/check-your-answers",
  );
}

test.describe("Disbursement check your answers page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
    await completeDisbursementJourney(page);
  });

  test("renders the disbursement answers from session data", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Check your answers" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Disbursement details" }),
    ).toBeVisible();
    await expect(
      page.getByText("What is the disbursement for?").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Medical records request").first(),
    ).toBeVisible();
    await expect(
      page.getByText("What is the total cost?").first(),
    ).toBeVisible();
    await expect(page.getByText("£150.50").first()).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Why is this disbursement required?" }),
    ).toBeVisible();
    await expect(
      page
        .getByText("This disbursement is necessary to support the case.")
        .first(),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Supporting files" }),
    ).toBeVisible();
    await expect(
      page.getByText("disbursement-quote.pdf").first(),
    ).toBeVisible();
  });

  test("has a back link to the disbursement document upload page", async ({
    page,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(
      "/prior-authority/disbursement/document-upload",
    );
  });

  test("change links point to the exact disbursement form pages", async ({
    page,
  }) => {
    await expect(
      page.getByRole("link", { name: "Change disbursement details" }),
    ).toHaveAttribute("href", "/prior-authority/disbursement/details");

    await expect(
      page.getByRole("link", { name: "Change justification" }),
    ).toHaveAttribute("href", "/prior-authority/disbursement/justification");

    await expect(
      page.getByRole("link", { name: "Change supporting files" }),
    ).toHaveAttribute("href", "/prior-authority/disbursement/document-upload");
  });

  test("submits the application and shows the confirmation page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(
      "/prior-authority/disbursement/confirmation-page",
    );
    await expect(
      page.getByRole("heading", {
        name: "Prior authority application submitted",
      }),
    ).toBeVisible();
  });
});
