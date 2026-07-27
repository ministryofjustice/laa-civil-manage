import { test, expect } from "@playwright/test";

test.describe("Counsel document upload page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prior-authority/counsel/document-upload");
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

  test("page has back link navigating to counsel justification", async ({
    page,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/counsel/justification");
  });

  test("page has a Save and Continue button", async ({ page }) => {
    const saveButton = page.getByRole("button", { name: "Save and continue" });

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

  test("page lists the counsel-specific supporting documents", async ({
    page,
  }) => {
    await expect(
      page.getByText(
        "written advice from counsel, or a detailed narrative explaining why this level of representation is necessary",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "a copy of any relevant court orders directing or supporting the representation",
      ),
    ).toBeVisible();
  });

  test("displays an error when submitting without uploading a document", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Save and continue" }).click();

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
        name: "counsel-advice.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await expect(page.getByText("counsel-advice.pdf").first()).toBeVisible();
      await expect(page).toHaveURL("/prior-authority/counsel/document-upload");
    });

    test("clicking Delete removes the file from the uploaded files list", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "counsel-advice.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await expect(page.getByText("counsel-advice.pdf").first()).toBeVisible();

      await page.getByRole("button", { name: "Delete" }).click();

      await expect(
        page.locator(".moj-multi-file-upload__message", {
          hasText: "counsel-advice.pdf",
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
        name: "counsel-advice.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("test file content"),
      });

      await page
        .getByRole("button", { name: "Upload file", exact: true })
        .click();

      await expect(page).toHaveURL("/prior-authority/counsel/document-upload");
      await expect(page.getByText("counsel-advice.pdf").first()).toBeVisible();
    });
  });
});
