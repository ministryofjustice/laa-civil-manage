import { test, expect } from "#tests/playwright/helpers/fixtures.js";

test.describe("Expert document upload page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prior-authority/expert/document-upload");
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

  test("page has back link navigating to justification", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/expert/justification");
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

  test("page lists the accepted document types in a bullet list", async ({
    page,
  }) => {
    await expect(page.getByText("a court order")).toBeVisible();
    await expect(page.getByText("a letter of instruction")).toBeVisible();
    await expect(
      page.getByText("an estimate of costs with a breakdown of hours"),
    ).toBeVisible();
    await expect(page.getByText("alternative quotes")).toBeVisible();
    await expect(
      page.getByText("certificate references of any other parties involved"),
    ).toBeVisible();
  });

  test("shows the expert-specific intro content", async ({ page }) => {
    await expect(
      page.getByText(
        "The supporting documents you upload depend on your specific application",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Only upload documents that support your specific request",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("written advice from counsel"),
    ).not.toBeVisible();
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
      await expect(page).toHaveURL("/prior-authority/expert/document-upload");
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
      await expect(
        page.locator('[data-empty-uploaded-files="true"]'),
      ).toBeVisible();
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
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL(
        "/prior-authority/expert/check-your-answers",
      );
    });

    test("uploading multiple files at once persists all of them after a page reload", async ({
      page,
    }) => {
      const fileNames = [
        "doc-one.pdf",
        "doc-two.pdf",
        "doc-three.pdf",
        "doc-four.pdf",
      ];

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(
        fileNames.map((name) => ({
          name,
          mimeType: "application/pdf",
          buffer: Buffer.from(`content of ${name}`),
        })),
      );

      for (const name of fileNames) {
        await expect(page.getByText(name).first()).toBeVisible();
      }

      await page.reload();

      for (const name of fileNames) {
        await expect(page.getByText(name).first()).toBeVisible();
      }
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

      await expect(page).toHaveURL("/prior-authority/expert/document-upload");
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
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL(
        "/prior-authority/expert/check-your-answers",
      );
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

      await expect(page).toHaveURL("/prior-authority/expert/document-upload");
      await expect(page.getByText("test-document.pdf")).not.toBeVisible();
      await expect(
        page.locator('[data-empty-uploaded-files="true"]'),
      ).toBeVisible();
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
