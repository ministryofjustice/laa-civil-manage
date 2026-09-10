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

// The page is only reachable after /costs, and the mapper drops the whole costs
// object (including this answer) when no billing type is set.
const draftWithCostsShared = (
  costsSharedWithOtherParties?: boolean,
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

test.describe("Costs shared with other parties page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "expert");
    await stubDraftGet(PRIOR_AUTHORITY_ID, draftWithCostsShared());
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert/costs-shared");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("renders the heading and the Yes and No options", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Will the expert’s costs be shared with other parties?",
      }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: "Yes" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "No" })).toBeVisible();
  });

  test("links back to the costs page", async ({ page }) => {
    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/expert/costs");
  });

  test("prefills the answer from the saved draft", async ({ page }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, draftWithCostsShared(true));

    await page.goto("/prior-authority/expert/costs-shared");

    await expect(page.getByRole("radio", { name: "Yes" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "No" })).not.toBeChecked();
  });

  test("leaves both options unselected when the draft has no answer", async ({
    page,
  }) => {
    await expect(page.getByRole("radio", { name: "Yes" })).not.toBeChecked();
    await expect(page.getByRole("radio", { name: "No" })).not.toBeChecked();
  });

  test("shows an error when no option is selected", async ({
    page,
    request,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: 'Select "Yes" if the costs will be shared',
      }),
    ).toBeVisible();
    await expect(page.locator(".govuk-error-message")).toContainText(
      'Select "Yes" if the costs will be shared',
    );
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("saves Yes and continues to the share of costs page", async ({
    page,
    request,
  }) => {
    await page.getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

    expect(draft.expertDetails?.expertCosts?.costsSharedWithOtherParties).toBe(
      true,
    );
    await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");
  });

  test("saves No and continues to the justification page", async ({
    page,
    request,
  }) => {
    await page.getByRole("radio", { name: "No" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

    expect(draft.expertDetails?.expertCosts?.costsSharedWithOtherParties).toBe(
      false,
    );
    await expect(page).toHaveURL("/prior-authority/expert/justification");
  });

  test("shows the error page when saving fails", async ({ page }) => {
    await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
      await page.getByRole("radio", { name: "No" }).check();
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Sorry, there is a problem with the service",
        }),
      ).toBeVisible();
    });
  });
});
