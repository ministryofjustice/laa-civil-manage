import { test, expect } from "@playwright/test";

test.describe("Manage application page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/applications/manage/APP-1001");
    await expect(page).toHaveURL("/applications/manage/APP-1001");
  });

  test("has the correct page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Manage your certificate" }),
    ).toBeVisible();
  });

  test("renders the client name in the summary list", async ({ page }) => {
    const summaryList = page.locator(".govuk-summary-list");
    await expect(summaryList.getByText("Client")).toBeVisible();
    await expect(summaryList.getByText("Alice Wonderland")).toBeVisible();
  });

  test("renders the LAA reference in the summary list", async ({ page }) => {
    const summaryList = page.locator(".govuk-summary-list");
    await expect(summaryList.getByText("LAA reference")).toBeVisible();
    await expect(summaryList.getByText("LAA-445566")).toBeVisible();
  });

  test("renders the matter type in the summary list", async ({ page }) => {
    const summaryList = page.locator(".govuk-summary-list");
    await expect(summaryList.getByText("Matter type")).toBeVisible();
    await expect(summaryList.getByText("Asylum")).toBeVisible();
  });

  test("renders the status tag in the summary list", async ({ page }) => {
    const summaryList = page.locator(".govuk-summary-list");
    await expect(summaryList.getByText("Status")).toBeVisible();
    await expect(summaryList.getByText("Submitted")).toBeVisible();
  });

  test("renders a back link pointing to the applications list", async ({
    page,
  }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/applications");
  });

  test("back link navigates to the applications list", async ({ page }) => {
    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/applications");
  });

  test("renders the Apply for prior authority card", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Apply for prior authority" }),
    ).toBeVisible();
  });

  test("renders the prior authority card description", async ({ page }) => {
    await expect(
      page.getByText("Request permission for expenses or to use experts"),
    ).toBeVisible();
  });

  test("renders the Apply for prior authority card link", async ({ page }) => {
    const cardLink = page.getByRole("link", {
      name: "Apply for prior authority",
    });
    await expect(cardLink).toBeVisible();
    await expect(cardLink).toHaveAttribute("href", "/prior-authority/apply");
  });
});
