import { test, expect } from "#tests/playwright/helpers/fixtures.js";

const MANAGE_APPLICATION_URL = "/applications/manage/APP-1001";
const APPLY_FOR_PRIOR_AUTHORITY_URL = "/prior-authority/apply";

test.describe("Apply for prior authority page", () => {
  test.beforeEach(async ({ page }) => {
    // Visiting the manage-application page stores the parent application in
    // the session, as it would when a user follows the card from that page.
    await page.goto(MANAGE_APPLICATION_URL);
    await page.goto(APPLY_FOR_PRIOR_AUTHORITY_URL);
    await expect(page).toHaveURL(APPLY_FOR_PRIOR_AUTHORITY_URL);
  });

  test("has the correct title, heading and application summary", async ({
    page,
  }) => {
    await expect(page).toHaveTitle("Manage Your Civil Application – GOV.UK");
    await expect(
      page.getByRole("heading", { name: "Apply for prior authority" }),
    ).toBeVisible();

    const summaryList = page.locator(".govuk-summary-list");
    await expect(summaryList.getByText("Client")).toBeVisible();
    await expect(summaryList.getByText("Alice Wonderland")).toBeVisible();
    await expect(summaryList.getByText("LAA reference")).toBeVisible();
    await expect(summaryList.getByText("LAA-445566")).toBeVisible();
  });

  test("has a back link to the selected application", async ({ page }) => {
    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toHaveAttribute(
      "href",
      "/applications/manage/APP-DYNAMIC-ID",
    );

    await backLink.click();
    await expect(page).toHaveURL("/applications/manage/APP-DYNAMIC-ID");
  });

  test("links to the expert journey", async ({ page }) => {
    const expertLink = page.getByRole("link", {
      name: "Apply for an expert",
    });
    await expect(expertLink).toHaveAttribute("href", "/prior-authority/expert");

    await expertLink.click();
    await expect(page).toHaveURL("/prior-authority/expert");
  });

  test("links to the counsel journey", async ({ page }) => {
    const counselLink = page.getByRole("link", {
      name: "Apply for counsel",
    });
    await expect(counselLink).toHaveAttribute(
      "href",
      "/prior-authority/counsel",
    );

    await counselLink.click();
    await expect(page).toHaveURL("/prior-authority/counsel");
  });
});
