import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

test.describe("Disbursement document upload page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
    await page.goto("/prior-authority/disbursement/document-upload");
  });

  test("page has correct title", async ({ page }) => {
    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has heading with correct content", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: "Upload supporting files",
    });

    await expect(heading).toBeVisible();
  });

  test("page has back link navigating to disbursement justification", async ({
    page,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/disbursement/justification");
  });

  test("page has a Continue button", async ({ page }) => {
    const saveButton = page.getByRole("button", { name: "Continue" });

    await expect(saveButton).toBeVisible();
  });

  test("when no files are uploaded, the uploaded files list shows a bold no-files message", async ({
    page,
  }) => {
    await expect(page.getByText("Uploaded files")).toBeVisible();
    await expect(
      page.locator('[data-empty-uploaded-files="true"]'),
    ).toBeVisible();
  });

  test("shows the disbursement-specific intro content", async ({ page }) => {
    await expect(
      page.getByText(
        "You must provide a primary quote and may add an additional quote if applicable.",
      ),
    ).toBeVisible();
  });

  test("displays an error when submitting without uploading a document", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "You must provide at least one document for the Primary quote category",
    });
    await expect(errorLink).toBeVisible();
  });

  test("displays an error when the uploaded document has no primary quote category selected", async ({
    page,
  }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "disbursement-quote.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\ntest file content"),
    });
    await expect(
      page.getByText("disbursement-quote.pdf").first(),
    ).toBeVisible();

    await page.getByRole("button", { name: "Continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "You must provide at least one document for the Primary quote category",
    });
    await expect(errorLink).toBeVisible();
  });

  test("continues when the uploaded document has a primary quote category selected", async ({
    page,
  }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "disbursement-quote.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\ntest file content"),
    });
    await expect(
      page.getByText("disbursement-quote.pdf").first(),
    ).toBeVisible();

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
  });

  test.describe("with JavaScript enabled", () => {
    test("the multi-file-upload component is present on the page", async ({
      page,
    }) => {
      await expect(
        page.locator('[data-module="moj-multi-file-upload"]'),
      ).toBeVisible();
    });

    test("uploading a file via AJAX shows it in the uploaded files list without a page reload", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "disbursement-quote.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7\ntest file content"),
      });

      await expect(
        page.getByText("disbursement-quote.pdf").first(),
      ).toBeVisible();
      await expect(page).toHaveURL(
        "/prior-authority/disbursement/document-upload",
      );
    });

    test("clicking Delete removes the file from the uploaded files list", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "disbursement-quote.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7\ntest file content"),
      });

      await expect(
        page.getByText("disbursement-quote.pdf").first(),
      ).toBeVisible();

      await page.getByRole("button", { name: "Delete" }).click();

      await expect(
        page.locator(".moj-multi-file-upload__message", {
          hasText: "disbursement-quote.pdf",
        }),
      ).not.toBeVisible();
      await expect(
        page.locator('[data-empty-uploaded-files="true"]'),
      ).toBeVisible();
    });
  });

  test.describe("with JavaScript disabled", () => {
    test.use({ javaScriptEnabled: false });

    test("selecting a file and clicking Upload file reloads the page and shows the file in the list", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "disbursement-quote.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7\ntest file content"),
      });

      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();

      await expect(page).toHaveURL(
        "/prior-authority/disbursement/document-upload",
      );
      await expect(
        page.getByText("disbursement-quote.pdf").first(),
      ).toBeVisible();
    });

    test("clicking Delete removes the file from the list and stays on the page", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "disbursement-quote.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7\ntest file content"),
      });

      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();

      await expect(
        page.getByText("disbursement-quote.pdf").first(),
      ).toBeVisible();

      await page.getByRole("button", { name: /Delete/ }).click();

      await expect(page).toHaveURL(
        "/prior-authority/disbursement/document-upload",
      );
      await expect(page.getByText("disbursement-quote.pdf")).not.toBeVisible();
      await expect(
        page.locator('[data-empty-uploaded-files="true"]'),
      ).toBeVisible();
    });
  });
});
