import { test, expect } from "@playwright/test";

test.describe("Document upload page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pa-form/document-upload");
  });

  test("page has correct title", async ({ page }) => {
    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has heading with correct content", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: "Upload supporting documents",
    });

    await expect(heading).toBeVisible();
  });

  test("page has back link navigating to expert details", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/pa-form/expert-details");
  });

  test("page has a Save and Continue button", async ({ page }) => {
    const saveButton = page.getByRole("button", { name: "Save and Continue" });

    await expect(saveButton).toBeVisible();
  });

  test("page lists the accepted document types in a bullet list", async ({
    page,
  }) => {
    await expect(page.getByText("the court order")).toBeVisible();
    await expect(page.getByText("the letter of instruction")).toBeVisible();
    await expect(
      page.getByText("the estimate of costs with a breakdown of hours"),
    ).toBeVisible();
    await expect(page.getByText("alternative quotes")).toBeVisible();
    await expect(
      page.getByText("the other parties' certificate references"),
    ).toBeVisible();
  });

  test("displays an error when submitting without uploading a document", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Save and Continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Please upload at least one document",
    });
    await expect(errorLink).toBeVisible();
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
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await expect(page.getByText("test-document.pdf").first()).toBeVisible();
      await expect(page).toHaveURL("/pa-form/document-upload");
    });

    test("an uploaded file has a Delete button", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    });

    test("clicking Delete removes the file from the uploaded files list", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await expect(page.getByText("test-document.pdf").first()).toBeVisible();

      await page.getByRole("button", { name: "Delete" }).click();

      await expect(
        page.locator(".moj-multi-file-upload__message", {
          hasText: "test-document.pdf",
        }),
      ).not.toBeVisible();
    });

    test("after uploading a file, submitting the form redirects to the confirmation page", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await expect(page.getByText("test-document.pdf").first()).toBeVisible();
      await page.getByRole("button", { name: "Save and Continue" }).click();

      await expect(page).toHaveURL("/pa-form/confirmation-page");
    });

    test("uploading a file over 7MB shows an inline error and does not add it to the list", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "too-large.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.alloc(8 * 1024 * 1024),
      });

      await expect(
        page.getByText("too-large.pdf must be smaller than 7MB").first(),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Delete" }),
      ).not.toBeVisible();
    });
  });

  test.describe("with JavaScript disabled", () => {
    test.use({ javaScriptEnabled: false });

    test("shows the standard file upload input with correct label", async ({
      page,
    }) => {
      await expect(page.getByLabel("Upload files")).toBeVisible();
    });

    test("shows the Upload file button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Upload file", exact: true }),
      ).toBeVisible();
    });

    test("selecting a file and clicking Upload file reloads the page and shows the file in the list", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();

      await expect(page).toHaveURL("/pa-form/document-upload");
      await expect(page.getByText("test-document.pdf").first()).toBeVisible();
    });

    test("after uploading a file via form POST, submitting redirects to the confirmation page", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();
      await page.getByRole("button", { name: "Save and Continue" }).click();

      await expect(page).toHaveURL("/pa-form/confirmation-page");
    });

    test("clicking Delete removes the file from the list and stays on the page", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();

      await expect(page.getByText("test-document.pdf").first()).toBeVisible();

      await page.getByRole("button", { name: /Delete/ }).click();

      await expect(page).toHaveURL("/pa-form/document-upload");
      await expect(page.getByText("test-document.pdf")).not.toBeVisible();
    });

    test("uploading a file over 7MB shows a GOV.UK error and does not add it to the list", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "too-large.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.alloc(8 * 1024 * 1024),
      });

      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();

      const errorSummaryHeading = page.getByRole("heading", {
        name: "There is a problem",
      });
      await expect(errorSummaryHeading).toBeVisible();
      await expect(
        page.getByText("The selected file must be smaller than 7MB").first(),
      ).toBeVisible();
      await expect(page.getByText("too-large.pdf")).not.toBeVisible();
    });
  });
});
