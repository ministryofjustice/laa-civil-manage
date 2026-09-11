import { test, expect } from "@playwright/test";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";
import {
  clearRegisteredStubs,
  expectDraftCreate,
  resetWiremockJournal,
  withFailingDraftCreate,
} from "#tests/playwright/helpers/wiremock.js";

test.describe("Expert landing page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page);
    await page.goto("/applications/manage/APP-1001");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("renders the title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Manage Your Civil Application – GOV.UK");
    await expect(
      page.getByRole("heading", {
        name: "Request prior authority for an expert service",
      }),
    ).toBeVisible();
  });

  test("links back to the application page", async ({ page }) => {
    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/applications/manage/APP-DYNAMIC-ID");
  });

  test("creates a draft and continues to the service required page", async ({
    page,
    request,
  }) => {
    await page.getByRole("button", { name: "Start" }).click();

    const draft = await expectDraftCreate(request);

    expect(draft).toMatchObject({
      applicationId: "APP-DYNAMIC-ID",
      priorAuthorityType: "EXPERT",
    });
    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
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
