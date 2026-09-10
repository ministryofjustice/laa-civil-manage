import { test, expect } from "@playwright/test";
import {
  buildResetPriorAuthorityId,
  resetPriorAuthoritySession,
  RESET_APPLICATION_ID,
} from "#tests/playwright/helpers/resetSession.js";
import {
  clearRegisteredStubs,
  expectDraftPut,
  expectNoDraftPut,
  resetWiremockJournal,
  stubDraftGet,
  withFailingDraftPut,
} from "#tests/playwright/helpers/wiremock.js";

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("expert");

const JUSTIFICATION = "This expert evidence is necessary to support the case.";

const draftWithCostsShared = (
  costsSharedWithOtherParties: boolean,
): Parameters<typeof stubDraftGet>[1] => ({
  applicationId: RESET_APPLICATION_ID,
  priorAuthorityType: "EXPERT",
  expertDetails: {
    expertCosts: {
      billingType: "FIXED_RATE",
      totalAmount: 200,
      costsSharedWithOtherParties,
    },
  },
});

test.describe("Expert justification page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "expert");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert/justification");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("renders the heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Is there anything else you'd like to tell us?",
      }),
    ).toBeVisible();
  });

  test("links back to the costs shared page", async ({ page }) => {
    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
  });

  test("links back to the share of costs page when the costs are shared", async ({
    page,
  }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, draftWithCostsShared(true));
    await page.goto("/prior-authority/expert/justification");

    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");
  });

  test("prefills the justification from the saved draft", async ({ page }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      justification: JUSTIFICATION,
    });

    await page.goto("/prior-authority/expert/justification");

    await expect(page.locator("#justification")).toHaveValue(JUSTIFICATION);
  });

  test("shows an error when the justification is blank", async ({
    page,
    request,
  }) => {
    await page.locator("#justification").fill("   ");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/justification");
    await expect(
      page.getByRole("link", {
        name: "Enter why this application is necessary",
      }),
    ).toBeVisible();
    await expect(page.locator("#justification-error")).toContainText(
      "Enter why this application is necessary",
    );
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("saves the justification and continues to document upload", async ({
    page,
    request,
  }) => {
    await page.locator("#justification").fill(JUSTIFICATION);
    await page.getByRole("button", { name: "Continue" }).click();

    const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

    expect(draft.justification).toBe(JUSTIFICATION);
    await expect(page).toHaveURL("/prior-authority/expert/document-upload");
  });

  test("shows the error page when saving fails", async ({ page }) => {
    await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
      await page.locator("#justification").fill(JUSTIFICATION);
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Sorry, there is a problem with the service",
        }),
      ).toBeVisible();
    });
  });
});
