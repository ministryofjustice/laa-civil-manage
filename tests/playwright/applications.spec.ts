import { test, expect } from "@playwright/test";

test.describe("All applications page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/applications");
    await expect(page).toHaveURL("/applications");
  });

  test("has the correct page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Your granted certificates" }),
    ).toBeVisible();
  });

  test("renders the reusable multi-field search form", async ({ page }) => {
    await expect(page.getByRole("form")).toHaveAttribute(
      "action",
      "/applications",
    );
    await expect(page.getByLabel("LAA Reference")).toBeVisible();
    await expect(page.getByLabel("Client first name")).toBeVisible();
    await expect(page.getByLabel("Client last name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear" })).toHaveAttribute(
      "href",
      "/applications",
    );
    await expect(page.getByRole("link", { name: "Clear" })).toHaveClass(
      "govuk-link govuk-link--no-visited-state",
    );
  });

  test("renders non-sortable column headers", async ({ page }) => {
    const table = page.getByRole("table");

    await expect(
      table.getByRole("columnheader", { name: "LAA Reference" }),
    ).toBeVisible();

    await expect(
      table.getByRole("columnheader", { name: "Client Name" }),
    ).toBeVisible();
  });

  test("renders application rows with correct data", async ({ page }) => {
    const table = page.getByRole("table");

    await expect(
      table.getByRole("rowheader", { name: "Jane Doe" }),
    ).toBeVisible();
    await expect(table.getByText("LAA-778899")).toBeVisible();

    await expect(
      table.getByRole("rowheader", { name: "John Smith" }),
    ).toBeVisible();
    await expect(table.getByText("LAA-112233")).toBeVisible();
  });

  test("renders client name link pointing to the correct application", async ({
    page,
  }) => {
    const table = page.getByRole("table");
    const rows = table.getByRole("row");

    const johnSmithRow = rows.filter({ hasText: "John Smith" });
    await expect(
      johnSmithRow.getByRole("link", { name: "John Smith" }),
    ).toHaveAttribute("href", "/applications/manage/APP-1002");
    await expect(
      johnSmithRow.getByRole("link", { name: "John Smith" }),
    ).toHaveClass("govuk-link govuk-link--no-visited-state");

    const janeDoeRow = rows.filter({ hasText: "Jane Doe" });
    await expect(
      janeDoeRow.getByRole("link", { name: "Jane Doe" }),
    ).toHaveAttribute("href", "/applications/manage/APP-1001");
  });

  test("renders the pagination component", async ({ page }) => {
    await expect(page.locator(".moj-pagination")).toBeVisible();
  });

  test("has the sortable table module attribute", async ({ page }) => {
    await expect(page.getByRole("table")).toHaveAttribute(
      "data-module",
      "moj-sortable-table",
    );
  });
});
