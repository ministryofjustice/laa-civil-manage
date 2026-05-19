import { test, expect, type Page } from "@playwright/test";

const hoursInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator(
    '[id="PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours"]',
  );
const minutesInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator(
    '[id="PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes"]',
  );

async function navigateViaSearchPage(
  page: Page,
  expertType = "Dentist",
): Promise<void> {
  await page.goto("/pa-form/search-an-expert-type");
  const searchBox = page.getByRole("combobox", {
    name: "Search for the expert type",
  });
  await searchBox.fill(expertType.slice(0, 3));
  await page.getByRole("option", { name: expertType }).click();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL("/pa-form/expert-costs");
}

test.describe("Expert costs page", () => {
  test.describe("navigation", () => {
    test("page has a back link navigating to the search an expert type page", async ({
      page,
    }) => {
      await page.goto("/pa-form/expert-costs");

      const backLink = page.getByRole("link", { name: "Back" });
      await expect(backLink).toBeVisible();

      await backLink.click();
      await expect(page).toHaveURL("/pa-form/search-an-expert-type");
    });
  });

  test.describe("page content", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/pa-form/expert-costs");
    });

    test("page has the main heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Expert costs" }),
      ).toBeVisible();
    });

    test("page has a full name input with correct label", async ({ page }) => {
      await expect(
        page.getByRole("textbox", { name: "Full name" }),
      ).toBeVisible();
    });

    test("page has billing type radios with Hourly and Flat rate options", async ({
      page,
    }) => {
      await expect(page.getByRole("radio", { name: "Hourly" })).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Flat rate" }),
      ).toBeVisible();
    });

    test("page has a Save and continue button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Save and continue" }),
      ).toBeVisible();
    });
  });

  test.describe("dynamic heading from previous page", () => {
    test("shows the expert type selected on the previous page in the sub-heading", async ({
      page,
    }) => {
      await navigateViaSearchPage(page, "Dentist");

      await expect(
        page.getByRole("heading", { name: "Dentist" }),
      ).toBeVisible();
    });
  });

  test.describe("conditional reveals", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/pa-form/expert-costs");
    });

    test("selecting Hourly reveals the hourly rate, time and total amount fields", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();

      await expect(page.getByLabel("Hourly rate")).toBeVisible();
      await expect(hoursInput(page)).toBeVisible();
      await expect(minutesInput(page)).toBeVisible();
    });

    test("selecting Flat rate reveals the flat rate total amount field", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Flat rate" }).click();

      const flatRateTotalAmountInputs = page.locator(
        "#PriorAuthorityFlatRateTotalAmount",
      );
      await expect(flatRateTotalAmountInputs).toBeVisible();
    });

    test("switching from Hourly to Flat rate hides the hourly section", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();
      await expect(page.getByLabel("Hourly rate")).toBeVisible();

      await page.getByRole("radio", { name: "Flat rate" }).click();
      await expect(page.getByLabel("Hourly rate")).not.toBeVisible();
    });
  });

  test.describe("validation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/pa-form/expert-costs");
    });

    test("submitting an empty form shows errors for full name and billing type", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(
        page.getByRole("heading", { name: "There is a problem" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Enter the expert's full name" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Select the billing type" }),
      ).toBeVisible();
    });

    test("submitting with only the full name filled shows a billing type error", async ({
      page,
    }) => {
      await page.getByRole("textbox", { name: "Full name" }).fill("John Doe");
      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(
        page.getByRole("link", { name: "Select the billing type" }),
      ).toBeVisible();
    });

    test("submitting with Hourly selected but no cost fields shows hourly validation errors", async ({
      page,
    }) => {
      await page.getByRole("textbox", { name: "Full name" }).fill("John Doe");
      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(
        page.getByRole("heading", { name: "There is a problem" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Enter the hourly rate" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Enter the hours" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Enter the minutes" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Enter the total amount" }).first(),
      ).toBeVisible();
    });

    test("submitting with Flat rate selected but no amount shows a flat rate error", async ({
      page,
    }) => {
      await page.getByRole("textbox", { name: "Full name" }).fill("John Doe");
      await page.getByRole("radio", { name: "Flat rate" }).click();
      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(
        page.getByRole("heading", { name: "There is a problem" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Enter the total amount" }),
      ).toBeVisible();
    });
  });

  test.describe("routing", () => {
    test("submitting a valid Hourly form redirects to the document upload page", async ({
      page,
    }) => {
      await page.goto("/pa-form/expert-costs");

      await page.getByRole("textbox", { name: "Full name" }).fill("John Doe");
      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByLabel("Hourly rate").fill("50");
      await hoursInput(page).fill("2");
      await minutesInput(page).fill("30");
      await page.locator("#PriorAuthorityTotalAmount").fill("100");

      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(page).toHaveURL("/pa-form/document-upload");
    });

    test("submitting a valid Flat rate form redirects to the document upload page", async ({
      page,
    }) => {
      await page.goto("/pa-form/expert-costs");

      await page.getByRole("textbox", { name: "Full name" }).fill("Jane Smith");
      await page.getByRole("radio", { name: "Flat rate" }).click();
      await page.locator("#PriorAuthorityFlatRateTotalAmount").fill("200");

      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(page).toHaveURL("/pa-form/document-upload");
    });
  });

  test.describe("session storage", () => {
    test("Hourly form values are persisted when navigating back from the next page", async ({
      page,
    }) => {
      await page.goto("/pa-form/expert-costs");

      await page.getByRole("textbox", { name: "Full name" }).fill("John Doe");
      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByLabel("Hourly rate").fill("75");
      await hoursInput(page).fill("3");
      await minutesInput(page).fill("45");
      await page.locator("#PriorAuthorityTotalAmount").fill("225");

      await page.getByRole("button", { name: "Save and continue" }).click();
      await expect(page).toHaveURL("/pa-form/document-upload");

      await page.getByRole("link", { name: "Back" }).click();
      await expect(page).toHaveURL("/pa-form/expert-costs");

      await expect(
        page.getByRole("textbox", { name: "Full name" }),
      ).toHaveValue("John Doe");
      await expect(page.getByRole("radio", { name: "Hourly" })).toBeChecked();
      await expect(page.getByLabel("Hourly rate")).toHaveValue("75");
      await expect(hoursInput(page)).toHaveValue("3");
      await expect(minutesInput(page)).toHaveValue("45");
      await expect(page.locator("#PriorAuthorityTotalAmount")).toHaveValue(
        "225",
      );
    });

    test("Flat rate form values are persisted when navigating back from the next page", async ({
      page,
    }) => {
      await page.goto("/pa-form/expert-costs");

      await page.getByRole("textbox", { name: "Full name" }).fill("Jane Smith");
      await page.getByRole("radio", { name: "Flat rate" }).click();
      await page.locator("#PriorAuthorityFlatRateTotalAmount").fill("300");

      await page.getByRole("button", { name: "Save and continue" }).click();
      await expect(page).toHaveURL("/pa-form/document-upload");

      await page.getByRole("link", { name: "Back" }).click();
      await expect(page).toHaveURL("/pa-form/expert-costs");

      await expect(
        page.getByRole("textbox", { name: "Full name" }),
      ).toHaveValue("Jane Smith");
      await expect(
        page.getByRole("radio", { name: "Flat rate" }),
      ).toBeChecked();
      await expect(
        page.locator("#PriorAuthorityFlatRateTotalAmount"),
      ).toHaveValue("300");
    });
  });
});
