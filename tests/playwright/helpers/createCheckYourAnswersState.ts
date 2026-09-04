import { expect } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

export async function completeCheckYourAnswersJourney(
  page: Page,
): Promise<void> {
  await page.goto("/applications/manage/APP-1001");
  await page
    .getByRole("link", { name: "Apply for prior authority for an expert" })
    .click();

  await expect(page).toHaveURL("/prior-authority/expert");
  await page.getByRole("button", { name: "Start" }).click();

  await expect(page).toHaveURL("/prior-authority/expert/expert-type");

  await page.getByRole("combobox", { name: "Service required" }).fill("Den");
  await page.getByRole("option", { name: "Dentist" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/prior-authority/expert/provider-name");

  await page
    .getByRole("textbox", { name: "Service provider's name" })
    .fill("John Doe");
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

  const files = [
    { name: "court-order.pdf", label: "Court order" },
    { name: "letter-of-instruction.pdf", label: "Letter of instruction" },
    { name: "estimate-of-costs.pdf", label: "Estimate of costs" },
  ];

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(
    files.map((file) => ({
      name: file.name,
      mimeType: "application/pdf",
      buffer: Buffer.from(`%PDF-1.7\ncontent of ${file.name}`),
    })),
  );

  const categorySelects = page.locator(".pa-document-category-select");
  for (let index = 0; index < files.length; index += 1) {
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes("/ajax-category-url"),
      ),
      categorySelects.nth(index).selectOption({ label: files[index].label }),
    ]);
  }

  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL("/prior-authority/expert/check-your-answers");
}

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
