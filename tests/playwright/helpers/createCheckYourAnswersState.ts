import { expect } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Fills in the whole prior-authority form (Expert, Fixed rate £200, Dr John
 * Doe, single uploaded document) up to and including navigating to the
 * check-your-answers page. Uses the supplied page as-is.
 */
export async function completeCheckYourAnswersJourney(
  page: Page,
): Promise<void> {
  await page.goto("/applications/manage/APP-1001");
  await page
    .getByRole("link", { name: "Apply for prior authority for an expert" })
    .click();

  await expect(page).toHaveURL("/prior-authority/expert");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page).toHaveURL("/prior-authority/expert/details");

  await page.getByRole("combobox", { name: "Service required" }).fill("Den");
  await page.getByRole("option", { name: "Dentist" }).click();
  await page.getByRole("textbox", { name: "Provider's name" }).fill("John Doe");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/postcode");

  await page.getByLabel("Postcode").fill("SW1H 9AJ");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/costs");

  await page.getByRole("radio", { name: "Fixed rate" }).check();
  await expect(
    page.locator("#PriorAuthorityFixedRateTotalAmount"),
  ).toBeVisible();
  await page.locator("#PriorAuthorityFixedRateTotalAmount").fill("200");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/costs-shared");

  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/justification");

  await page.locator("#justification").fill("Case requires expert support.");
  await page.getByRole("button", { name: "Continue" }).click();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "test-document.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("test file content"),
  });
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL("/prior-authority/expert/check-your-answers");
}

// Create and save state for check-your-answers form to make test setup faster
export async function createCheckYourAnswersState(
  browser: Browser,
  storageStatePath: string,
): Promise<void> {
  await fs.mkdir(path.dirname(storageStatePath), { recursive: true });

  const context = await browser.newContext();
  const page = await context.newPage();

  await completeCheckYourAnswersJourney(page);

  await context.storageState({ path: storageStatePath });
  await context.close();
}
