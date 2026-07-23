import { AxeBuilder } from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

test.describe("All applications page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/applications");
    await expect(page).toHaveURL("/applications");
  });

  test("has the correct page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Your applications" }),
    ).toBeVisible();
  });

  test("renders sortable column headers", async ({ page }) => {
    const table = page.getByRole("table");
    await expect(table).toBeVisible();

    await expect(
      table.getByRole("columnheader", { name: "Name" }),
    ).toHaveAttribute("aria-sort", "none");

    await expect(
      table.getByRole("columnheader", { name: "Start date" }),
    ).toHaveAttribute("aria-sort", "none");

    await expect(
      table.getByRole("columnheader", { name: "Decision" }),
    ).toHaveAttribute("aria-sort", "none");
  });

  test("renders non-sortable column headers", async ({ page }) => {
    const table = page.getByRole("table");

    await expect(
      table.getByRole("columnheader", { name: "LAA Reference" }),
    ).toBeVisible();

    await expect(
      table.getByRole("columnheader", { name: "Action" }),
    ).toBeVisible();
  });

  test("renders application rows with correct data", async ({ page }) => {
    const table = page.getByRole("table");

    await expect(
      table.getByRole("rowheader", { name: "Jane Doe" }),
    ).toBeVisible();
    await expect(table.getByText("20 March 2024")).toBeVisible();
    await expect(table.getByText("LAA-778899")).toBeVisible();

    await expect(
      table.getByRole("rowheader", { name: "John Smith" }),
    ).toBeVisible();
    await expect(table.getByText("22 March 2024")).toBeVisible();
    await expect(table.getByText("LAA-112233")).toBeVisible();
  });

  test("renders decision status tags", async ({ page }) => {
    const table = page.getByRole("table");

    await expect(table.getByText("In progress")).toBeVisible();
    await expect(table.getByText("Submitted")).toBeVisible();
  });

  test("renders View links pointing to the correct application", async ({
    page,
  }) => {
    const table = page.getByRole("table");
    const rows = table.getByRole("row");

    const janeDoRow = rows.filter({ hasText: "Jane Doe" });
    await expect(janeDoRow.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/applications/APP-1001",
    );

    const johnSmithRow = rows.filter({ hasText: "John Smith" });
    await expect(
      johnSmithRow.getByRole("link", { name: "View" }),
    ).toHaveAttribute("href", "/applications/APP-1002");
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

  test("should not have any automatically detectable WCAG A or AA violations", async ({
    page,
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- duplicate playwright-core versions in dep tree cause type mismatch
    const accessibilityScanResults = await new AxeBuilder({ page: page as any })
      .withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22a",
        "wcag22aa",
      ])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
