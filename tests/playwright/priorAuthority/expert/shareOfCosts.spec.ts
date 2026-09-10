import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
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
import type { PriorAuthorityApplicationApportionment } from "#src/types/priorAuthority/api.js";

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("expert");

const partiesInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator("#PriorAuthorityNumberOfParties");

const amountInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator("#PriorAuthorityApportionedAmount");

// The page is only reachable once costs exist and are marked as shared.
const sharedCostsDraft = (
  apportionment?: PriorAuthorityApplicationApportionment,
): Parameters<typeof stubDraftGet>[1] => ({
  applicationId: RESET_APPLICATION_ID,
  priorAuthorityType: "EXPERT",
  expertDetails: {
    expertCosts: {
      billingType: "FIXED_RATE",
      totalAmount: 200,
      costsSharedWithOtherParties: true,
      apportionment,
    },
  },
});

test.describe("Share of costs page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "expert");
    await stubDraftGet(PRIOR_AUTHORITY_ID, sharedCostsDraft());
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert/share-of-costs");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test.describe("page content", () => {
    test("links back to the costs shared page", async ({ page }) => {
      await page.getByRole("link", { name: "Back", exact: true }).click();

      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
    });

    test("renders the heading and both inputs", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Costs shared with other parties" }),
      ).toBeVisible();
      await expect(partiesInput(page)).toBeVisible();
      await expect(amountInput(page)).toBeVisible();
    });
  });

  test.describe("validation", () => {
    test("shows errors when both fields are empty", async ({
      page,
      request,
    }) => {
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");
      await expect(
        page.getByRole("link", {
          name: "Enter the number of parties sharing the costs",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: "Enter the client's apportioned share of the expert cost",
        }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("shows an error when the number of parties is less than 2", async ({
      page,
      request,
    }) => {
      await partiesInput(page).fill("1");
      await amountInput(page).fill("100");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", { name: "Enter a whole number greater than 1" }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("shows an error when the apportioned amount is not a valid amount", async ({
      page,
      request,
    }) => {
      await partiesInput(page).fill("2");
      await amountInput(page).fill("abc");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", {
          name: "Enter a valid amount for the client's apportioned share",
        }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("shows an error when the amount is not less than the total cost", async ({
      page,
      request,
    }) => {
      await partiesInput(page).fill("2");
      await amountInput(page).fill("250");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/share-of-costs");
      await expect(
        page.getByRole("link", {
          name: "The client's share must be less than the total expert cost of £200.00",
        }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });
  });

  test.describe("persistence", () => {
    test("prefills the apportionment from the saved draft", async ({
      page,
    }) => {
      await stubDraftGet(
        PRIOR_AUTHORITY_ID,
        sharedCostsDraft({ partiesSharingCosts: 3, clientShareAmount: 120 }),
      );

      await page.goto("/prior-authority/expert/share-of-costs");

      await expect(partiesInput(page)).toHaveValue("3");
      await expect(amountInput(page)).toHaveValue("120");
    });

    test("saves the apportionment and continues to the justification page", async ({
      page,
      request,
    }) => {
      await partiesInput(page).fill("2");
      await amountInput(page).fill("100");
      await page.getByRole("button", { name: "Continue" }).click();

      const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

      expect(draft.expertDetails?.expertCosts?.apportionment).toEqual({
        partiesSharingCosts: 2,
        clientShareAmount: 100,
      });
      await expect(page).toHaveURL("/prior-authority/expert/justification");
    });

    test("shows the error page when saving fails", async ({ page }) => {
      await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
        await partiesInput(page).fill("2");
        await amountInput(page).fill("100");
        await page.getByRole("button", { name: "Continue" }).click();

        await expect(
          page.getByRole("heading", {
            name: "Sorry, there is a problem with the service",
          }),
        ).toBeVisible();
      });
    });
  });
});
