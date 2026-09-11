import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";
import {
  clearRegisteredStubs,
  expectDraftCreate,
  resetWiremockJournal,
  withFailingDraftCreate,
} from "#tests/playwright/helpers/wiremock.js";

test.describe("Disbursement landing page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("redirects to the applications list when no application is in session", async ({
    page,
  }) => {
    await page.goto("/prior-authority/disbursement");

    await expect(page).toHaveURL("/applications");
  });

  test.describe("with an application in session", () => {
    test.beforeEach(async ({ page, request }) => {
      await page.goto("/applications/manage/APP-1001");
      await resetWiremockJournal(request);
      await page.goto("/prior-authority/disbursement");
    });

    test("renders the title and heading", async ({ page }) => {
      await expect(page).toHaveTitle("Manage Your Civil Application – GOV.UK");
      await expect(
        page.getByRole("heading", {
          name: "Request prior authority to incur a disbursement",
        }),
      ).toBeVisible();
    });

    test("links back to the application page", async ({ page }) => {
      await page.getByRole("link", { name: "Back", exact: true }).click();

      await expect(page).toHaveURL("/applications/manage/APP-DYNAMIC-ID");
    });

    test("creates a draft and continues to the details page", async ({
      page,
      request,
    }) => {
      await page.getByRole("button", { name: "Start" }).click();

      const draft = await expectDraftCreate(request);

      expect(draft).toMatchObject({
        applicationId: "APP-DYNAMIC-ID",
        priorAuthorityType: "DISBURSEMENT",
      });
      await expect(page).toHaveURL("/prior-authority/disbursement/details");
    });

    test("shows the error page when the draft cannot be created", async ({
      page,
    }) => {
      await withFailingDraftCreate(500, async () => {
        await page.getByRole("button", { name: "Start" }).click();

        await expect(
          page.getByRole("heading", {
            name: "Sorry, there is a problem with the service",
          }),
        ).toBeVisible();
      });
    });
  });
});
