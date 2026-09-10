import { test, expect } from "@playwright/test";
import {
  buildResetPriorAuthorityId,
  resetPriorAuthoritySession,
  RESET_APPLICATION_ID,
} from "#tests/playwright/helpers/resetSession.js";
import {
  clearRegisteredStubs,
  expectDraftPut,
  expectDraftPutBody,
  expectNoDraftPut,
  resetWiremockJournal,
  stubDraftGet,
  withFailingDraftPut,
} from "#tests/playwright/helpers/wiremock.js";
import type { PriorAuthorityDraftDto } from "#src/types/priorAuthority/api.js";

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("expert");

const nameInput = "Service provider's name";

const FULLY_POPULATED_DRAFT: PriorAuthorityDraftDto = {
  applicationId: RESET_APPLICATION_ID,
  priorAuthorityType: "EXPERT",
  justification: "Existing justification.",
  expertDetails: {
    expertType: "Dentist",
    expertFullName: "Original Name",
    expertPostcode: "SW1A 1AA",
    expertCosts: {
      billingType: "FIXED_RATE",
      totalAmount: 200,
      costsSharedWithOtherParties: false,
    },
  },
};

test.describe("Service provider's name page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "expert");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert/provider-name");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("renders the heading and hint", async ({ page }) => {
    await expect(page.getByRole("heading", { name: nameInput })).toBeVisible();
    await expect(
      page.getByText("For example, Dr Jane Smith or Expert Services Ltd"),
    ).toBeVisible();
  });

  test("links back to the service required page for a listed service", async ({
    page,
  }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      expertDetails: { expertType: "Dentist" },
    });
    await page.goto("/prior-authority/expert/provider-name");

    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
  });

  test("links back to the service type page for an unlisted service", async ({
    page,
  }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      expertDetails: { expertType: "Balloon artist" },
    });
    await page.goto("/prior-authority/expert/provider-name");

    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
  });

  test("prefills the provider name from the saved draft", async ({ page }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      expertDetails: { expertFullName: "Dr Jane Smith" },
    });

    await page.goto("/prior-authority/expert/provider-name");

    await expect(page.getByRole("textbox", { name: nameInput })).toHaveValue(
      "Dr Jane Smith",
    );
  });

  test("shows an error when the provider name is missing", async ({
    page,
    request,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
    await expect(
      page.getByRole("link", { name: "Enter the expert's full name" }),
    ).toBeVisible();
    await expect(
      page.locator("#PriorAuthorityExpertFullName-error"),
    ).toContainText("Enter the expert's full name");
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("saves the provider name and continues to the postcode page", async ({
    page,
    request,
  }) => {
    await page.getByRole("textbox", { name: nameInput }).fill("Dr Jane Smith");
    await page.getByRole("button", { name: "Continue" }).click();

    const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

    expect(draft.expertDetails?.expertFullName).toBe("Dr Jane Smith");
    await expect(page).toHaveURL("/prior-authority/expert/postcode");
  });

  // The whole draft is PUT on every page, so a page must not drop fields it does not own.
  test("leaves the rest of the draft untouched when saving", async ({
    page,
    request,
  }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, FULLY_POPULATED_DRAFT);
    await page.goto("/prior-authority/expert/provider-name");

    await page.getByRole("textbox", { name: nameInput }).fill("Dr Jane Smith");
    await page.getByRole("button", { name: "Continue" }).click();

    await expectDraftPutBody(request, PRIOR_AUTHORITY_ID, {
      ...FULLY_POPULATED_DRAFT,
      expertDetails: {
        ...FULLY_POPULATED_DRAFT.expertDetails,
        expertFullName: "Dr Jane Smith",
      },
    });
  });

  test("shows the error page when saving fails", async ({ page }) => {
    await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
      await page
        .getByRole("textbox", { name: nameInput })
        .fill("Dr Jane Smith");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Sorry, there is a problem with the service",
        }),
      ).toBeVisible();
    });
  });
});
