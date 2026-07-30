import { test, expect } from "@playwright/test";
import { seedConfirmationSession } from "#tests/playwright/helpers/seedSession.js";
import type { BrowserContext, Page } from "@playwright/test";

const LAA_REFERENCE = "LAA-1234-REDIS";

test.describe("Confirmation page", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    await seedConfirmationSession(context, { laaReference: LAA_REFERENCE });
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
