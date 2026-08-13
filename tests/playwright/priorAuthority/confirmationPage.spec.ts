import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";
import { seedConfirmationSession } from "#tests/playwright/helpers/seedSession.js";

const LAA_REFERENCE = "LAA-1234-REDIS";

test.describe("Confirmation page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
    // Session cookie already exists via storageState, so we can seed
    // straight into it before navigating anywhere.
    await seedConfirmationSession(page, {
      applicationId: "test-application-id",
      laaReference: LAA_REFERENCE,
    });
    await page.goto("/prior-authority/expert/confirmation-page");
  });

  test("page has a Manage your application button present and redirect to placeholder page", async ({
    page,
  }) => {
    const startButton = page.getByRole("button", {
      name: "Manage your application",
    });

    await expect(startButton).toBeVisible();
    await startButton.click();

    await expect(page).toHaveURL("/applications/manage/test-application-id");
  });

  test("page has confirmation that the application was submitted and a reference number", async ({
    page,
  }) => {
    const heading = page.locator(".govuk-panel__title");
    await expect(heading).toHaveText("Prior authority application submitted");
    const confirmationNumber = page.locator(".govuk-panel__body");
    await expect(confirmationNumber).toContainText(LAA_REFERENCE);
  });
});
