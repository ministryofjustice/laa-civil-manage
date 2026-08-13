import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";
import type { Page } from "@playwright/test";

async function completeCounselJourney(page: Page): Promise<void> {
  await page.goto("/applications/manage/APP-1001");
  await page.getByRole("link", { name: "Apply for prior authority" }).click();
  await expect(page).toHaveURL("/prior-authority/apply");
  await page.getByRole("link", { name: "Apply for counsel" }).click();

  await expect(page).toHaveURL("/prior-authority/counsel");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page).toHaveURL("/prior-authority/counsel/type");
  await page.getByRole("radio", { name: "King's Counsel alone" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL("/prior-authority/counsel/justification");
  await page
    .locator("#justification")
    .fill("This counsel is necessary to support the case.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL("/prior-authority/counsel/document-upload");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "counsel-advice.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("test file content"),
  });
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL("/prior-authority/counsel/check-your-answers");
}

test.describe("Counsel check your answers page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
    await completeCounselJourney(page);
  });

  test("renders the counsel answers from session data", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Check your answers" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Counsel details" }),
    ).toBeVisible();
    await expect(page.getByText("Counsel type").first()).toBeVisible();
    await expect(page.getByText("King's Counsel alone").first()).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Justification" }),
    ).toBeVisible();
    await expect(
      page.getByText("This counsel is necessary to support the case.").first(),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Supporting documents" }),
    ).toBeVisible();
    await expect(page.getByText("counsel-advice.pdf").first()).toBeVisible();
  });

  test("has a back link to the counsel document upload page", async ({
    page,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL("/prior-authority/counsel/document-upload");
  });

  test("change links point to the exact counsel form pages", async ({
    page,
  }) => {
    await expect(
      page.getByRole("link", { name: "Change counsel type" }),
    ).toHaveAttribute("href", "/prior-authority/counsel/type");

    await expect(
      page.getByRole("link", { name: "Change justification" }),
    ).toHaveAttribute("href", "/prior-authority/counsel/justification");

    await expect(
      page.getByRole("link", { name: "Change supporting documents" }),
    ).toHaveAttribute("href", "/prior-authority/counsel/document-upload");
  });

  test("submits the application and shows the confirmation page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/confirmation-page");
    await expect(
      page.getByRole("heading", {
        name: "Prior authority application submitted",
      }),
    ).toBeVisible();
  });
});
