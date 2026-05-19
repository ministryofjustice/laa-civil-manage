import { test, expect } from "@playwright/test";

test.describe("Check your answers page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pa-form/document-upload");

    await page.getByRole("combobox", { name: "Expert" }).fill("Dentist");
    await page.getByRole("button", { name: "Save and continue" }).click();

    await page.getByRole("textbox", { name: "Full Name" }).fill("John Doe");
    await page.getByRole("button", { name: "Save and continue" }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-document.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("test file content"),
    });
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL("/pa-form/check-your-answers");
  });

  test("renders expert details from session data", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Check your answers" }),
    ).toBeVisible();

    await expect(page.getByText("Expert type").first()).toBeVisible();
    await expect(page.getByText("Dentist").first()).toBeVisible();

    await expect(page.getByText("Full name").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();

    await expect(
      page.getByText("Guideline rates or hours exceeded").first(),
    ).toBeVisible();
  });

  test("renders Expert details and Supporting documents card sections", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Expert details" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Expert costs" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Supporting documents" }),
    ).toBeVisible();
    await expect(page.getByText("File names").first()).toBeVisible();
    await expect(page.getByText("test-document.pdf").first()).toBeVisible();
  });

  test("change links point to the exact form pages", async ({ page }) => {
    const changeExpertTypeLink = page.getByRole("link", {
      name: "Change expert type",
    });
    await expect(changeExpertTypeLink).toHaveAttribute(
      "href",
      "/pa-form/search-an-expert-type",
    );

    const changeFullNameLink = page.getByRole("link", {
      name: "Change full name",
    });
    await expect(changeFullNameLink).toHaveAttribute(
      "href",
      "/pa-form/expert-details",
    );

    const changeSupportingDocumentsLink = page.getByRole("link", {
      name: "Change supporting documents",
    });
    await expect(changeSupportingDocumentsLink).toHaveAttribute(
      "href",
      "/pa-form/document-upload",
    );

    await changeExpertTypeLink.click();
    await expect(page).toHaveURL("/pa-form/search-an-expert-type");

    await page.goto("/pa-form/check-your-answers");

    await changeFullNameLink.click();
    await expect(page).toHaveURL("/pa-form/expert-details");

    await page.goto("/pa-form/check-your-answers");

    await changeSupportingDocumentsLink.click();
    await expect(page).toHaveURL("/pa-form/document-upload");
  });

  test("submit sends the user to the application submitted page", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save and come back later" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL("/pa-form/confirmation-page");
    await expect(
      page.getByRole("heading", {
        name: "Prior authority application submitted",
      }),
    ).toBeVisible();
  });
});
