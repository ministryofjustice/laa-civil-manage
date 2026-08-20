import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

test.describe("Expert details page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
  });

  test("page has a select box", async ({ page }) => {
    await page.goto("/prior-authority/expert/details");

    const govukSelect = page.getByRole("combobox", {
      name: "Service required",
    });

    await expect(govukSelect).toBeVisible();
  });

  test("should show the correct expert types in the dropdown", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/details");

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

  test("page has a Continue button present and functional", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/details");

    await page.getByRole("combobox", { name: "Service required" }).fill("Den");
    await page.getByRole("option", { name: "Dentist" }).click();
    await page
      .getByRole("textbox", { name: "Provider's name" })
      .fill("John Doe");

    const saveAndContinueButton = page.getByRole("button", {
      name: "Continue",
    });

    await expect(saveAndContinueButton).toBeVisible();

    await saveAndContinueButton.click();

    await expect(page).toHaveURL("/prior-authority/expert/postcode");
  });

  test("page has a back link taking to the previous page", async ({ page }) => {
    await page.goto("/applications/manage/APP-1001");
    await page.goto("/prior-authority/expert/details");

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
    await page.goto("/prior-authority/expert/details");
    await page.getByRole("button", { name: "Continue" }).click();

    const errorSummaryHeading = page.getByRole("heading", {
      name: "There is a problem",
    });
    await expect(errorSummaryHeading).toBeVisible();

    const errorLink = page.getByRole("link", {
      name: "Search for and select an expert type",
    });
    await expect(errorLink).toBeVisible();

    const fullNameErrorLink = page.getByRole("link", {
      name: "Enter the expert's full name",
    });
    await expect(fullNameErrorLink).toBeVisible();

    await expect(page.locator("#PriorAuthorityExpertType-error")).toContainText(
      "Search for and select an expert type",
    );
    await expect(
      page.locator("#PriorAuthorityExpertFullName-error"),
    ).toContainText("Enter the expert's full name");
  });

  test("clicking the error summary link focuses the link", async ({ page }) => {
    await page.goto("/prior-authority/expert/details");
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
    await page.goto("/prior-authority/expert/details");

    const csrfInput = page.locator('input[name="_csrf"]');

    await csrfInput.evaluate((node) => {
      (node as HTMLInputElement).value = "";
    });

    await page.getByRole("combobox", { name: "Service required" }).fill("Den");
    await page.getByRole("option", { name: "Dentist" }).click();
    await page
      .getByRole("textbox", { name: "Provider's name" })
      .fill("John Doe");

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

  test("when the search box is filled in and Continue is pressed, then the back button is clicked, the value is still there", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/details");

    const searchBox = page.getByRole("combobox", {
      name: "Service required",
    });

    await searchBox.fill("de");

    const option = page.getByRole("option", { name: "Dentist" });
    await expect(option).toBeVisible();
    await option.click();

    await expect(searchBox).toHaveValue("Dentist");

    await page
      .getByRole("textbox", { name: "Provider's name" })
      .fill("John Doe");

    const saveAndContinueButton = page.getByRole("button", {
      name: "Continue",
    });

    await expect(saveAndContinueButton).toBeVisible();
    await saveAndContinueButton.click();
    await expect(page).toHaveURL("/prior-authority/expert/postcode");

    const backLink = page.getByRole("link", {
      name: "Back",
      exact: true,
    });

    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/expert/details");
    await expect(
      page.getByRole("combobox", { name: "Service required" }),
    ).toHaveValue("Dentist");
  });

  test("shows an error when the typed expert type is not selected from the list", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/details");

    const searchBox = page.getByRole("combobox", {
      name: "Service required",
    });

    await searchBox.fill("Custom expert type");
    await page
      .getByRole("textbox", { name: "Provider's name" })
      .fill("John Doe");

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/details");
    await expect(
      page.getByRole("link", {
        name: "Select a service from the list",
      }),
    ).toBeVisible();
    await expect(page.locator("#PriorAuthorityExpertType-error")).toContainText(
      "Select a service from the list",
    );
  });

  test.describe("expert type autocomplete enhancements", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/prior-authority/expert/details");
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
      await expect(
        page.getByRole("textbox", {
          name: "If you selected Other, enter the expert type",
        }),
      ).toBeVisible();
    });

    test("clears the saved custom Other text when switching to a listed expert type", async ({
      page,
    }) => {
      const expertTypeField = page.locator("#PriorAuthorityExpertType");
      const otherInput = page.getByRole("textbox", {
        name: "If you selected Other, enter the expert type",
      });

      await expertTypeField.fill("Other");
      await page.getByRole("option", { name: "Other", exact: true }).click();
      await otherInput.fill("Custom expert type");
      await page
        .getByRole("textbox", { name: "Provider's name" })
        .fill("John Doe");

      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL("/prior-authority/expert/postcode");

      await page.getByRole("link", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL("/prior-authority/expert/details");
      await expect(expertTypeField).toHaveValue("Other");
      await expect(otherInput).toHaveValue("Custom expert type");

      await expertTypeField.fill("Den");
      await page.getByRole("option", { name: "Dentist" }).click();
      await expect(page.locator("#PriorAuthorityExpertTypeOther")).toHaveValue(
        "",
      );

      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL("/prior-authority/expert/postcode");
    });
  });

  test.describe("with JavaScript disabled", () => {
    test.use({ javaScriptEnabled: false });

    test("shows an Other option and lets the user enter a custom expert type", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/details");

      await expect(
        page.getByText("For example, child psychologist or DNA test"),
      ).toBeVisible();

      await page.locator("#PriorAuthorityExpertType").selectOption("Other");
      await page
        .getByRole("textbox", {
          name: "If you selected Other, enter the expert type",
        })
        .fill("Custom expert type");
      await page
        .getByRole("textbox", { name: "Provider's name" })
        .fill("John Doe");

      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/postcode");
      await page.getByRole("link", { name: "Back", exact: true }).click();

      await expect(page).toHaveURL("/prior-authority/expert/details");
      await expect(page.locator("#PriorAuthorityExpertType")).toHaveValue(
        "Other",
      );
      await expect(
        page.getByRole("textbox", {
          name: "If you selected Other, enter the expert type",
        }),
      ).toHaveValue("Custom expert type");
    });

    test("shows an inline error when Other is selected without a custom expert type", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/details");

      await page.locator("#PriorAuthorityExpertType").selectOption("Other");
      await page
        .getByRole("textbox", { name: "Provider's name" })
        .fill("John Doe");

      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", { name: "Enter the expert type" }),
      ).toBeVisible();
      await expect(
        page.locator("#PriorAuthorityExpertTypeOther-error"),
      ).toContainText("Enter the expert type");
    });

    test("shows an inline error when custom expert type text is entered without selecting Other", async ({
      page,
    }) => {
      await page.goto("/prior-authority/expert/details");

      await page.locator("#PriorAuthorityExpertType").selectOption("Dentist");
      await page
        .getByRole("textbox", {
          name: "If you selected Other, enter the expert type",
        })
        .fill("Custom expert type");
      await page
        .getByRole("textbox", { name: "Provider's name" })
        .fill("John Doe");

      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", {
          name: "Clear the expert type text unless you selected Other",
        }),
      ).toBeVisible();
      await expect(
        page.locator("#PriorAuthorityExpertTypeOther-error"),
      ).toContainText("Clear the expert type text unless you selected Other");
    });
  });
});
