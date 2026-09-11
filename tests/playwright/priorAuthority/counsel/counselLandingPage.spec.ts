import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";
import {
  clearRegisteredStubs,
  expectDraftCreate,
  resetWiremockJournal,
  withFailingDraftCreate,
} from "#tests/playwright/helpers/wiremock.js";

test.describe("Counsel landing page", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("redirects to the applications list when no application is in session", async ({
    page,
  }) => {
    await page.goto("/prior-authority/counsel");

    await expect(page).toHaveURL("/applications");
  });

  test.describe("with an application in session", () => {
    test.beforeEach(async ({ page, request }) => {
      await page.goto("/applications/manage/APP-1001");
      await resetWiremockJournal(request);
      await page.goto("/prior-authority/counsel");
    });

    test("renders the title, caption and heading", async ({ page }) => {
      await expect(page).toHaveTitle("Manage Your Civil Application – GOV.UK");
      await expect(
        page.locator(".govuk-caption-l", { hasText: "Prior authority" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Apply for counsel" }),
      ).toBeVisible();
    });

    test("links back to the application page", async ({ page }) => {
      await page.getByRole("link", { name: "Back", exact: true }).click();

      await expect(page).toHaveURL("/applications/manage/APP-DYNAMIC-ID");
    });

    test("creates a draft and continues to the counsel type page", async ({
      page,
      request,
    }) => {
      await page.getByRole("button", { name: "Start" }).click();

      const draft = await expectDraftCreate(request);

      expect(draft).toMatchObject({
        applicationId: "APP-DYNAMIC-ID",
        priorAuthorityType: "COUNSEL",
      });
      await expect(page).toHaveURL("/prior-authority/counsel/type");
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
