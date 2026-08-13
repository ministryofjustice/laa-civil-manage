import { test, expect } from "#tests/playwright/helpers/fixtures.js";
import type { Page } from "@playwright/test";

const partiesInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator("#PriorAuthorityNumberOfParties");

const amountInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator("#PriorAuthorityApportionedAmount");

async function seedFixedRateExpertCost(
  page: Page,
  total: string,
): Promise<void> {
  await page.goto("/prior-authority/expert/costs");
  await page.getByRole("radio", { name: "Fixed rate" }).click();
  await page.locator("#PriorAuthorityFixedRateTotalAmount").fill(total);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
}

test.describe("Share of costs page", () => {
  test.describe("page content", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/prior-authority/expert/share-of-costs");
    });

    test("page has a back link navigating to the costs shared page", async ({
      page,
    }) => {
      const backLink = page.getByRole("link", { name: "Back", exact: true });

      await expect(backLink).toBeVisible();

      await backLink.click();

      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
    });

    test("page has the main heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", {
          name: "Costs shared with other parties",
        }),
      ).toBeVisible();
    });

    test("page has the number of parties and apportioned amount inputs", async ({
      page,
    }) => {
      await expect(partiesInput(page)).toBeVisible();
      await expect(amountInput(page)).toBeVisible();
    });
  });

  test.describe("validation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/prior-authority/expert/share-of-costs");
    });

    test("shows errors when both fields are empty", async ({ page }) => {
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");

      await expect(
        page.getByRole("link", {
          name: "Enter the number of parties sharing the costs",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: "Enter the client's apportioned share of the expert cost",
        }),
      ).toBeVisible();
    });

    test("shows an error when the number of parties is less than 2", async ({
      page,
    }) => {
      await partiesInput(page).fill("1");
      await amountInput(page).fill("100");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", {
          name: "Enter a whole number greater than 1",
        }),
      ).toBeVisible();
    });

    test("shows an error when the apportioned amount is not a valid amount", async ({
      page,
    }) => {
      await partiesInput(page).fill("2");
      await amountInput(page).fill("abc");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", {
          name: "Enter a valid amount for the client's apportioned share",
        }),
      ).toBeVisible();
    });

    test("valid details redirect to the justification page", async ({
      page,
    }) => {
      await partiesInput(page).fill("2");
      await amountInput(page).fill("100");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/justification");
    });
  });

  test.describe("apportioned amount against the total expert cost", () => {
    test("shows an error when the amount is not less than the total cost", async ({
      page,
    }) => {
      await seedFixedRateExpertCost(page, "100");
      await page.goto("/prior-authority/expert/share-of-costs");

      await partiesInput(page).fill("2");
      await amountInput(page).fill("150");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");
      await expect(
        page.getByRole("link", {
          name: "The client's share must be less than the total expert cost of £100.00",
        }),
      ).toBeVisible();
    });

    test("allows an amount below the total cost", async ({ page }) => {
      await seedFixedRateExpertCost(page, "100");
      await page.goto("/prior-authority/expert/share-of-costs");

      await partiesInput(page).fill("2");
      await amountInput(page).fill("40");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/justification");
    });
  });

  test.describe("session storage", () => {
    test("form values are persisted when navigating back from the next page", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/share-of-costs");

      await partiesInput(page).fill("3");
      await amountInput(page).fill("120");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL("/prior-authority/expert/justification");

      await page.goto("/prior-authority/expert/share-of-costs");

      await expect(partiesInput(page)).toHaveValue("3");
      await expect(amountInput(page)).toHaveValue("120");
    });
  });
});
