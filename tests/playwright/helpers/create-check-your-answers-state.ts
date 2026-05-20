import { expect } from "@playwright/test";
import type { Browser } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

export async function createCheckYourAnswersState(
  browser: Browser,
  storageStatePath: string,
): Promise<void> {
  await fs.mkdir(path.dirname(storageStatePath), { recursive: true });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("/pa-form/search-an-expert-type");

  await page.getByRole("combobox", { name: "Expert" }).fill("Dentist");
  await page.getByRole("button", { name: "Save and continue" }).click();

  await page.getByRole("textbox", { name: "Full Name" }).fill("John Doe");
  await page.getByRole("button", { name: "Save and continue" }).click();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "test-document.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("test file content"),
  });
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL("/pa-form/check-your-answers");
  await context.storageState({ path: storageStatePath });
  await context.close();
}
