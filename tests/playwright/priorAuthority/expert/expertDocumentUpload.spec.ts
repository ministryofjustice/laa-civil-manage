import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

test.describe("Expert document upload page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
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
      page.getByText("certificate references of any other parties"),
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
      name: "Please upload at least one document",
    });
    await expect(errorLink).toBeVisible();
  });

  test("displays an error when the required document categories are not all provided", async ({
    page,
  }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "court-order.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("test file content"),
    });
    await expect(page.getByText("court-order.pdf").first()).toBeVisible();

    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes("/ajax-category-url"),
      ),
      page.locator(".pa-document-category-select").selectOption({
        label: "Court order",
      }),
    ]);

    await page.getByRole("button", { name: "Continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "You must provide at least one document for each of the following categories: Letter of instruction, Estimate of costs",
    });
    await expect(errorLink).toBeVisible();
  });

  test("continues when a document is provided for each required category", async ({
    page,
  }) => {
    const files = [
      { name: "court-order.pdf", label: "Court order" },
      { name: "letter-of-instruction.pdf", label: "Letter of instruction" },
      { name: "estimate-of-costs.pdf", label: "Estimate of costs" },
    ];

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      files.map((file) => ({
        name: file.name,
        mimeType: "application/pdf",
        buffer: Buffer.from(`content of ${file.name}`),
      })),
    );

    for (const file of files) {
      await expect(page.getByText(file.name).first()).toBeVisible();
    }

    const categorySelects = page.locator(".pa-document-category-select");
    for (let index = 0; index < files.length; index += 1) {
      await Promise.all([
        page.waitForResponse((response) =>
          response.url().includes("/ajax-category-url"),
        ),
        categorySelects.nth(index).selectOption({ label: files[index].label }),
      ]);
    }

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/check-your-answers");
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

    test("after uploading a file for each required category, submitting the form redirects to the confirmation page", async ({
      page,
    }) => {
      const files = [
        { name: "court-order.pdf", label: "Court order" },
        { name: "letter-of-instruction.pdf", label: "Letter of instruction" },
        { name: "estimate-of-costs.pdf", label: "Estimate of costs" },
      ];

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(
        files.map((file) => ({
          name: file.name,
          mimeType: "application/pdf",
          buffer: Buffer.from(`content of ${file.name}`),
        })),
      );

      for (const file of files) {
        await expect(page.getByText(file.name).first()).toBeVisible();
      }

      const categorySelects = page.locator(".pa-document-category-select");
      for (let index = 0; index < files.length; index += 1) {
        await Promise.all([
          page.waitForResponse((response) =>
            response.url().includes("/ajax-category-url"),
          ),
          categorySelects
            .nth(index)
            .selectOption({ label: files[index].label }),
        ]);
      }

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
        await expect(
          page.getByRole("button", { name: `Delete ${name}` }),
        ).toBeVisible();
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

    test("after uploading a file for each required category via form POST, submitting redirects to the confirmation page", async ({
      page,
    }) => {
      const files = [
        { name: "court-order.pdf", label: "Court order" },
        { name: "letter-of-instruction.pdf", label: "Letter of instruction" },
        { name: "estimate-of-costs.pdf", label: "Estimate of costs" },
      ];

      const fileInput = page.locator('input[type="file"]');
      for (const file of files) {
        await fileInput.setInputFiles({
          name: file.name,
          mimeType: "application/pdf",
          buffer: Buffer.from(`content of ${file.name}`),
        });
        await page
          .getByRole("button", { name: "Upload file", exact: true })
          .click();
        await expect(page.getByText(file.name).first()).toBeVisible();
      }

      for (const file of files) {
        const select = page.getByLabel(`Document category for ${file.name}`);
        await select.selectOption({ label: file.label });
        await select.locator("xpath=ancestor::span[1]//button").click();
      }

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
