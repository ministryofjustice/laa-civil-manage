import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

async function goToOtherExpertTypeViaOther(page: Page): Promise<void> {
  await page.goto("/prior-authority/expert/expert-type");
  await page.getByRole("combobox", { name: "Service required" }).fill("Other");
  await page.getByRole("option", { name: "Other", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
}

test.describe("Service type page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
  });

  test("has the correct heading and hint text", async ({ page }) => {
    await goToOtherExpertTypeViaOther(page);

    await expect(
      page.getByRole("heading", { name: "What is the service?" }),
    ).toBeVisible();
    await expect(page.getByText("For example, Osteopath")).toBeVisible();
  });

  test("has a back link to the service required page", async ({ page }) => {
    await goToOtherExpertTypeViaOther(page);

    const backLink = page.getByRole("link", { name: "Back", exact: true });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
  });

  test("Continues to the provider name page", async ({ page }) => {
    await goToOtherExpertTypeViaOther(page);

    await page
      .getByRole("textbox", { name: "What is the service?" })
      .fill("Balloon artist");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
  });

  test("keeps the entered service when returning to the page", async ({
    page,
  }) => {
    await goToOtherExpertTypeViaOther(page);

    await page
      .getByRole("textbox", { name: "What is the service?" })
      .fill("Balloon artist");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/prior-authority/expert/provider-name");

    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
    await expect(
      page.getByRole("textbox", { name: "What is the service?" }),
    ).toHaveValue("Balloon artist");
  });

  test("shows an error when submitted without a service", async ({ page }) => {
    await goToOtherExpertTypeViaOther(page);

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
    await expect(
      page.getByRole("link", { name: "Enter the service" }),
    ).toBeVisible();
    await expect(
      page.locator("#PriorAuthorityExpertTypeOther-error"),
    ).toContainText("Enter the service");
  });

  test("redirects to the provider name page when a listed service is selected", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert/expert-type");
    await page.getByRole("combobox", { name: "Service required" }).fill("Den");
    await page.getByRole("option", { name: "Dentist" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/prior-authority/expert/provider-name");

    await page.goto("/prior-authority/expert/other-expert-type");
    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
  });
});
