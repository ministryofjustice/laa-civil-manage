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

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("counsel");

const FULLY_POPULATED_DRAFT: PriorAuthorityDraftDto = {
  applicationId: RESET_APPLICATION_ID,
  priorAuthorityType: "COUNSEL",
  justification: "Existing justification.",
  counselDetails: { counselType: "TWO_JUNIOR_COUNSEL" },
};

test.describe("Counsel type page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "counsel");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/counsel/type");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("renders the page title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Manage Your Civil Application – GOV.UK");
    await expect(
      page.getByRole("heading", { name: "What counsel are you applying for?" }),
    ).toBeVisible();
  });

  test("renders every counsel option", async ({ page }) => {
    for (const name of [
      "King's Counsel alone",
      "Two Junior Counsel",
      "King's Counsel and Junior Counsel",
      "King's Counsel and Two Junior Counsel",
    ]) {
      await expect(
        page.getByRole("radio", { name, exact: true }),
      ).toBeVisible();
    }
  });

  test("prefills the counsel type from the saved draft", async ({ page }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, FULLY_POPULATED_DRAFT);

    await page.goto("/prior-authority/counsel/type");

    await expect(
      page.getByRole("radio", { name: "Two Junior Counsel", exact: true }),
    ).toBeChecked();
    await expect(
      page.getByRole("radio", { name: "King's Counsel alone", exact: true }),
    ).not.toBeChecked();
  });

  test("shows an error when no counsel type is selected", async ({
    page,
    request,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Select the counsel type" }),
    ).toBeVisible();
    await expect(page.locator(".govuk-error-message")).toContainText(
      "Select the counsel type",
    );
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("focuses the radio group when the error summary link is clicked", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("link", { name: "Select the counsel type" }).click();

    await expect(
      page.getByRole("radio", { name: "King's Counsel alone" }),
    ).toBeFocused();
  });

  test("shows the error page when the CSRF token is missing", async ({
    page,
  }) => {
    await page.locator('input[name="_csrf"]').evaluate((node) => {
      (node as HTMLInputElement).value = "";
    });
    await page.getByRole("radio", { name: "King's Counsel alone" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("heading", {
        name: "Sorry, there is a problem with the service",
      }),
    ).toBeVisible();
  });

  test("saves the counsel type and continues to the justification page", async ({
    page,
    request,
  }) => {
    await page.getByRole("radio", { name: "King's Counsel alone" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

    expect(draft.counselDetails?.counselType).toBe("KINGS_COUNSEL_ALONE");
    await expect(page).toHaveURL("/prior-authority/counsel/justification");
  });

  // The whole draft is PUT on every page, so a page must not drop fields it does not own.
  test("leaves the rest of the draft untouched when saving", async ({
    page,
    request,
  }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, FULLY_POPULATED_DRAFT);
    await page.goto("/prior-authority/counsel/type");

    await page.getByRole("radio", { name: "King's Counsel alone" }).check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expectDraftPutBody(request, PRIOR_AUTHORITY_ID, {
      ...FULLY_POPULATED_DRAFT,
      counselDetails: { counselType: "KINGS_COUNSEL_ALONE" },
    });
  });

  test("shows the error page when saving fails", async ({ page }) => {
    await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
      await page.getByRole("radio", { name: "King's Counsel alone" }).check();
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Sorry, there is a problem with the service",
        }),
      ).toBeVisible();
    });
  });
});
