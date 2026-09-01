import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

async function goToProviderNameViaListed(page: Page): Promise<void> {
  await page.goto("/prior-authority/expert/expert-type");
  await page.getByRole("combobox", { name: "Service required" }).fill("Den");
  await page.getByRole("option", { name: "Dentist" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/provider-name");
}

async function goToProviderNameViaOther(page: Page): Promise<void> {
  await page.goto("/prior-authority/expert/expert-type");
  await page.getByRole("combobox", { name: "Service required" }).fill("Other");
  await page.getByRole("option", { name: "Other", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
  await page
    .getByRole("textbox", { name: "What is the service?" })
    .fill("Balloon artist");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/provider-name");
}

test.describe("Service provider's name page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
  });

  test("has the correct heading, hint and selected service caption", async ({
    page,
  }) => {
    await goToProviderNameViaListed(page);

    await expect(
      page.getByRole("heading", { name: "Service provider's name" }),
    ).toBeVisible();
    await expect(
      page.getByText("For example, Dr Jane Smith or Expert Services Ltd"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Service required", level: 2 }),
    ).toBeVisible();
    await expect(page.getByText("Dentist", { exact: true })).toBeVisible();
  });

  test("has a back link to the service required page when a listed service is chosen", async ({
    page,
  }) => {
    await goToProviderNameViaListed(page);

    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
  });

  test("has a back link to the service type page when Other is chosen", async ({
    page,
  }) => {
    await goToProviderNameViaOther(page);

    await expect(
      page.getByText("Balloon artist", { exact: true }),
    ).toBeVisible();

    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await backLink.click();
    await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
  });

  test("saves the provider name and continues to the postcode page", async ({
    page,
  }) => {
    await goToProviderNameViaListed(page);

    await page
      .getByRole("textbox", { name: "Service provider's name" })
      .fill("Dr Jane Smith");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/postcode");
  });

  test("keeps the entered provider name when returning to the page", async ({
    page,
  }) => {
    await goToProviderNameViaListed(page);

    await page
      .getByRole("textbox", { name: "Service provider's name" })
      .fill("Dr Jane Smith");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/prior-authority/expert/postcode");

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
    await expect(
      page.getByRole("textbox", { name: "Service provider's name" }),
    ).toHaveValue("Dr Jane Smith");
  });

  test("shows an error when submitted without a provider name", async ({
    page,
  }) => {
    await goToProviderNameViaListed(page);

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
    await expect(
      page.getByRole("link", { name: "Enter the expert's full name" }),
    ).toBeVisible();
    await expect(
      page.locator("#PriorAuthorityExpertFullName-error"),
    ).toContainText("Enter the expert's full name");
  });
});
