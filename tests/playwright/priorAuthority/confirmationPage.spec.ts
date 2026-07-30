import { test, expect } from "@playwright/test";
import { createCheckYourAnswersState } from "#tests/playwright/helpers/createCheckYourAnswersState.js";
import type { BrowserContext, Page } from "@playwright/test";
import path from "node:path";

const storageStatePath = path.resolve(
  process.cwd(),
  "playwright/.auth/confirmation-page.json",
);
const LAA_REFERENCE = "LAA-445566";

test.describe("Confirmation page", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await createCheckYourAnswersState(browser, storageStatePath);
  });

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({ storageState: storageStatePath });
    page = await context.newPage();
    await page.goto("/prior-authority/expert/confirmation-page");
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("page has a Manage your application button present and redirect to placeholder page", async () => {

    const startButton = page.getByRole("button", {
      name: "Manage your application",
    });

    await expect(startButton).toBeVisible();
    await startButton.click();

    await expect(page).toHaveURL("/placeholder/mocked/stubbed");
  });

  test("page has confirmation that the application was submitted and a reference number", async () => {

    const heading = page.locator(".govuk-panel__title");
    await expect(heading).toHaveText("Prior authority application submitted");
    const confirmationNumber = page.locator(".govuk-panel__body");
    await expect(confirmationNumber).toContainText(LAA_REFERENCE);
  });
});
