import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

test.describe("Service required page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
  });

  test("page has a select box", async ({ page }) => {
    await page.goto("/prior-authority/expert/expert-type");

    const govukSelect = page.getByRole("combobox", {
      name: "Service required",
    });

    await expect(govukSelect).toBeVisible();
  });

  test("has the correct heading and hint text", async ({ page }) => {
    await page.goto("/prior-authority/expert/expert-type");

    await expect(
      page.getByRole("heading", { name: "Service required" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "If you are unable to find the service you require, select Other",
      ),
    ).toBeVisible();
  });

  test("should show the correct expert types in the dropdown", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");

    const searchBox = page.getByRole("combobox", {
      name: "Service required",
    });

    await searchBox.fill("child");

    const psychiatristOption = page.getByRole("option", {
      name: "Child Psychiatrist",
    });
    await expect(psychiatristOption).toBeVisible();

    const psychologistOption = page.getByRole("option", {
      name: "Child Psychologist",
    });
    await expect(psychologistOption).toBeVisible();
  });

  test("continuing with a listed service goes to the provider name page", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");

    await page.getByRole("combobox", { name: "Service required" }).fill("Den");
    await page.getByRole("option", { name: "Dentist" }).click();

    const saveAndContinueButton = page.getByRole("button", {
      name: "Continue",
    });

    await expect(saveAndContinueButton).toBeVisible();
    await saveAndContinueButton.click();

    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
  });

  test("continuing with Other goes to the service type page", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");

    await page
      .getByRole("combobox", { name: "Service required" })
      .fill("Other");
    await page.getByRole("option", { name: "Other", exact: true }).click();

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
  });

  test("still shows Other in the dropdown when going back without entering a service", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");

    await page
      .getByRole("combobox", { name: "Service required" })
      .fill("Other");
    await page.getByRole("option", { name: "Other", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
    await expect(
      page.getByRole("combobox", { name: "Service required" }),
    ).toHaveValue("Other");
  });

  test("page has a back link taking to the previous page", async ({ page }) => {
    await page.goto("/applications/manage/APP-1001");
    await page.goto("/prior-authority/expert/expert-type");

    const backLink = page.getByRole("link", {
      name: "Back",
      exact: true,
    });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/expert");
  });

  test("displays error summary and inline error when submitting without a selection", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");
    await page.getByRole("button", { name: "Continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Search for and select an expert type",
    });
    await expect(errorLink).toBeVisible();

    await expect(page.locator("#PriorAuthorityExpertType-error")).toContainText(
      "Search for and select an expert type",
    );
  });

  test("clicking the error summary link focuses the link", async ({ page }) => {
    await page.goto("/prior-authority/expert/expert-type");
    await page.getByRole("button", { name: "Continue" }).click();

    const errorLink = page.getByRole("link", {
      name: "Search for and select an expert type",
    });
    await errorLink.click();

    const combobox = page.getByRole("combobox", { name: "Service required" });
    await expect(combobox).toBeFocused();
  });

  test("should display error page when CSRF token is missing on submission", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");

    const csrfInput = page.locator('input[name="_csrf"]');

    await csrfInput.evaluate((node) => {
      (node as HTMLInputElement).value = "";
    });

    await page.getByRole("combobox", { name: "Service required" }).fill("Den");
    await page.getByRole("option", { name: "Dentist" }).click();

    const saveAndContinueButton = page.getByRole("button", {
      name: "Continue",
    });

    await expect(saveAndContinueButton).toBeVisible();

    await saveAndContinueButton.click();

    const heading = page.getByRole("heading", {
      name: "Sorry, there is a problem with the service",
    });

    await expect(heading).toBeVisible();
  });

  test("keeps the selected value when returning to the page", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");

    const searchBox = page.getByRole("combobox", {
      name: "Service required",
    });

    await searchBox.fill("de");

    const option = page.getByRole("option", { name: "Dentist" });
    await expect(option).toBeVisible();
    await option.click();

    await expect(searchBox).toHaveValue("Dentist");

    const saveAndContinueButton = page.getByRole("button", {
      name: "Continue",
    });

    await expect(saveAndContinueButton).toBeVisible();
    await saveAndContinueButton.click();
    await expect(page).toHaveURL("/prior-authority/expert/provider-name");

    const backLink = page.getByRole("link", {
      name: "Back",
      exact: true,
    });

    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
    await expect(
      page.getByRole("combobox", { name: "Service required" }),
    ).toHaveValue("Dentist");
  });

  test("shows an error when the typed expert type is not selected from the list", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");

    const searchBox = page.getByRole("combobox", {
      name: "Service required",
    });

    await searchBox.fill("Custom expert type");
    await searchBox.blur();

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
    await expect(
      page.getByRole("link", {
        name: "Select a service from the list",
      }),
    ).toBeVisible();
    await expect(page.locator("#PriorAuthorityExpertType-error")).toContainText(
      "Select a service from the list",
    );
  });

  test("does not carry a failed typed value onto the other expert type page after choosing Other", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");

    const searchBox = page.getByRole("combobox", {
      name: "Service required",
    });

    await searchBox.fill("Custom expert type");
    await searchBox.blur();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/prior-authority/expert/expert-type");

    await searchBox.fill("Other");
    await page.getByRole("option", { name: "Other", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
    await expect(
      page.getByRole("textbox", { name: "What is the service?" }),
    ).toHaveValue("");
  });

  test.describe("expert type autocomplete enhancements", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/prior-authority/expert/expert-type");
    });

    test("shows a dropdown arrow on the enhanced expert type field", async ({
      page,
    }) => {
      const arrow = page.locator(".autocomplete__dropdown-arrow-down");
      await expect(arrow).toBeVisible();
    });

    test("clicking the expert type field opens the menu", async ({ page }) => {
      const menu = page.locator("#PriorAuthorityExpertType__listbox");
      await expect(menu).toBeHidden();

      await page.locator("#PriorAuthorityExpertType").click();

      await expect(menu).toBeVisible();
    });

    test("clicking the 'Service required' label does not open the menu", async ({
      page,
    }) => {
      const menu = page.locator("#PriorAuthorityExpertType__listbox");

      await page.locator('label[for="PriorAuthorityExpertType"]').click();

      await expect(menu).toBeHidden();
    });

    test("limits the visible options so the menu scrolls instead of showing all of them", async ({
      page,
    }) => {
      const menu = page.locator("#PriorAuthorityExpertType__listbox");

      await page.locator("#PriorAuthorityExpertType").click();
      await expect(menu).toBeVisible();

      const optionCount = await menu.getByRole("option").count();
      expect(optionCount).toBeGreaterThan(5);

      const { scrollHeight, clientHeight } = await menu.evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));
      expect(scrollHeight).toBeGreaterThan(clientHeight);
    });

    test("offers a selectable Other option instead of a no results message", async ({
      page,
    }) => {
      const searchBox = page.getByRole("combobox", {
        name: "Service required",
      });

      await searchBox.fill("zzzzzzz");

      const menu = page.locator("#PriorAuthorityExpertType__listbox");
      await expect(menu).toBeVisible();
      await expect(menu).not.toContainText("No results found");

      const otherOption = menu.getByRole("option", {
        name: "Other",
        exact: true,
      });
      await expect(otherOption).toBeVisible();

      await otherOption.click();

      await expect(searchBox).toHaveValue("Other");
    });
  });

  test.describe("with JavaScript disabled", () => {
    test.use({ javaScriptEnabled: false });

    test("lets the user pick Other and continue to the service type page", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/expert-type");

      await expect(
        page.getByText(
          "If you are unable to find the service you require, select Other",
        ),
      ).toBeVisible();

      await page.locator("#PriorAuthorityExpertType").selectOption("Other");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
    });

    test("lets the user pick a listed service and continue to the provider name page", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/expert-type");

      await page.locator("#PriorAuthorityExpertType").selectOption("Dentist");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/provider-name");
    });
  });
});
