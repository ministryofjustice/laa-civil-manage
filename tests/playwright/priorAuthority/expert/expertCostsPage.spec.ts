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
  await page.goto("/prior-authority/expert/details");
  const searchBox = page.getByRole("combobox", {
    name: "Search for the expert type",
  });
  await searchBox.fill(expertType.slice(0, 3));
  await page.getByRole("option", { name: expertType }).click();
  await page
    .getByRole("textbox", { name: "What is the full name of the expert?" })
    .fill("John Doe");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/based-in-london");

  await page.getByRole("radio", { name: "Yes" }).check();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/costs");
}

test.describe("Expert costs page", () => {
  test.describe("navigation", () => {
    test("page has a back link navigating to the based in London page", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/costs");

      const backLink = page.getByRole("link", { name: "Back", exact: true });
      await expect(backLink).toBeVisible();

      await backLink.click();
      await expect(page).toHaveURL("/prior-authority/expert/based-in-london");
    });
  });

  test.describe("page content", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/prior-authority/expert/costs");
    });

    test("page has the main heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Expert costs" }),
      ).toBeVisible();
    });

    test("page has billing type radios with Hourly and Fixed rate options", async ({
      page,
    }) => {
      await expect(page.getByRole("radio", { name: "Hourly" })).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Fixed rate" }),
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
      await page.goto("/prior-authority/expert/costs");
    });

    test("selecting Hourly reveals the hourly rate, time and total amount fields", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();

      await expect(page.getByLabel("Hourly rate")).toBeVisible();
      await expect(hoursInput(page)).toBeVisible();
      await expect(minutesInput(page)).toBeVisible();
    });

    test("selecting Fixed rate reveals the Fixed rate total amount field", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Fixed rate" }).click();

      const fixedRateTotalAmountInputs = page.locator(
        "#PriorAuthorityFixedRateTotalAmount",
      );
      await expect(fixedRateTotalAmountInputs).toBeVisible();
    });

    test("switching from Hourly to Fixed rate hides the hourly section", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();
      await expect(page.getByLabel("Hourly rate")).toBeVisible();

      await page.getByRole("radio", { name: "Fixed rate" }).click();
      await expect(page.getByLabel("Hourly rate")).not.toBeVisible();
    });
  });

  test.describe("validation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/prior-authority/expert/costs");
    });

    test("submitting an empty form shows errors for billing type", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(
        page.getByRole("heading", { name: "There is a problem" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "Select the billing type" }),
      ).toBeVisible();
    });

    test("submitting with Hourly selected but no cost fields shows hourly validation errors", async ({
      page,
    }) => {
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
    });

    test("submitting with Fixed rate selected but no amount shows a Fixed rate error", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Fixed rate" }).click();
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
    test("submitting a valid Hourly form redirects to the are costs shared page", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/costs");

      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByLabel("Hourly rate").fill("50");
      await hoursInput(page).fill("2");
      await minutesInput(page).fill("30");

      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
    });

    test("submitting a valid Fixed rate form redirects to the are costs shared page", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/costs");

      await page.getByRole("radio", { name: "Fixed rate" }).click();
      await page.locator("#PriorAuthorityFixedRateTotalAmount").fill("200");

      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
    });
  });

  test.describe("session storage", () => {
    test("Hourly form values are persisted when navigating back from the next page", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/costs");

      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByLabel("Hourly rate").fill("75");
      await hoursInput(page).fill("3");
      await minutesInput(page).fill("45");

      await page.getByRole("button", { name: "Save and continue" }).click();
      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");

      await page.getByRole("link", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL("/prior-authority/expert/costs");

      await expect(page.getByRole("radio", { name: "Hourly" })).toBeChecked();
      await expect(page.getByLabel("Hourly rate")).toHaveValue("75");
      await expect(hoursInput(page)).toHaveValue("3");
      await expect(minutesInput(page)).toHaveValue("45");
      await expect(page.getByText("£281.25").first()).toBeVisible();
    });

    test("Fixed rate form values are persisted when navigating back from the next page", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/costs");

      await page.getByRole("radio", { name: "Fixed rate" }).click();
      await page.locator("#PriorAuthorityFixedRateTotalAmount").fill("300");

      await page.getByRole("button", { name: "Save and continue" }).click();
      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");

      await page.getByRole("link", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL("/prior-authority/expert/costs");

      await expect(
        page.getByRole("radio", { name: "Fixed rate" }),
      ).toBeChecked();
      await expect(
        page.locator("#PriorAuthorityFixedRateTotalAmount"),
      ).toHaveValue("300");
    });
    test("switching from Hourly to Fixed rate before submitting only saves Fixed rate values", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/costs");

      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByLabel("Hourly rate").fill("75");
      await hoursInput(page).fill("3");
      await minutesInput(page).fill("45");

      await page.getByRole("radio", { name: "Fixed rate" }).click();
      await page.locator("#PriorAuthorityFixedRateTotalAmount").fill("500");

      await page.getByRole("button", { name: "Save and continue" }).click();
      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");

      await page.getByRole("link", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL("/prior-authority/expert/costs");

      await expect(
        page.getByRole("radio", { name: "Fixed rate" }),
      ).toBeChecked();
      await expect(
        page.locator("#PriorAuthorityFixedRateTotalAmount"),
      ).toHaveValue("500");

      await expect(page.getByLabel("Hourly rate")).not.toBeVisible();
      await expect(hoursInput(page)).not.toBeVisible();
      await expect(minutesInput(page)).not.toBeVisible();
    });
  });
});
