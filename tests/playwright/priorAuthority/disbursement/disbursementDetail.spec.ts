import { test, expect } from "@playwright/test";

test.describe("Disbursement details page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/applications/manage/APP-1001");
    await page.goto("/prior-authority/disbursement/details");
  });

  test("page has the main heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Disbursement details" }),
    ).toBeVisible();
  });

  test("page has a description textbox and an amount input", async ({
    page,
  }) => {
    await expect(
      page.getByRole("textbox", { name: "What is the disbursement for?" }),
    ).toBeVisible();
    await expect(
      page.locator("#PriorAuthorityDisbursementAmount"),
    ).toBeVisible();
  });

  test("description input has a 100 character limit", async ({ page }) => {
    await expect(
      page.locator("#PriorAuthorityDisbursementPurpose"),
    ).toHaveAttribute("maxlength", "100");
  });

  test("page has a back link to the disbursement landing page", async ({
    page,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/disbursement");
  });

  test("submitting valid details saves them and redirects", async ({
    page,
  }) => {
    await page
      .getByRole("textbox", { name: "What is the disbursement for?" })
      .fill("Medical records request");
    await page.locator("#PriorAuthorityDisbursementAmount").fill("150.50");

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL("/prior-authority/disbursement/details");
  });

  test("shows validation errors when the description and amount are missing", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Enter a description of the expense." }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Enter the amount of the expense." }),
    ).toBeVisible();
  });

  test("shows a validation error when the amount is not numeric", async ({
    page,
  }) => {
    await page
      .getByRole("textbox", { name: "What is the disbursement for?" })
      .fill("Medical records request");
    await page.locator("#PriorAuthorityDisbursementAmount").fill("abc");

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(
      page.getByRole("link", { name: "Enter a valid expense amount." }),
    ).toBeVisible();
  });

  test("shows a validation error when the amount is zero", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "What is the disbursement for?" })
      .fill("Medical records request");
    await page.locator("#PriorAuthorityDisbursementAmount").fill("0");

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(
      page.getByRole("link", {
        name: "Expense amount must be greater than £0.",
      }),
    ).toBeVisible();
  });

  test("shows a validation error when the amount is negative", async ({
    page,
  }) => {
    await page
      .getByRole("textbox", { name: "What is the disbursement for?" })
      .fill("Medical records request");
    await page.locator("#PriorAuthorityDisbursementAmount").fill("-10");

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(
      page.getByRole("link", { name: "Expense amount cannot be negative." }),
    ).toBeVisible();
  });

  test("retains entered values after a failed submission", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "What is the disbursement for?" })
      .fill("Medical records request");

    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(
      page.getByRole("textbox", { name: "What is the disbursement for?" }),
    ).toHaveValue("Medical records request");
  });
});
