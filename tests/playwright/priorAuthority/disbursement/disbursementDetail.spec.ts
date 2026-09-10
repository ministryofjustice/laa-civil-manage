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

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("disbursement");

const PURPOSE_INPUT = "What is the disbursement for?";
const AMOUNT_INPUT = "#PriorAuthorityDisbursementAmount";

const FULLY_POPULATED_DRAFT: PriorAuthorityDraftDto = {
  applicationId: RESET_APPLICATION_ID,
  priorAuthorityType: "DISBURSEMENT",
  justification: "Existing justification.",
  disbursementDetails: {
    disbursementPurpose: "Original purpose",
    disbursementAmount: 99.99,
  },
};

test.describe("Disbursement details page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "disbursement");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/disbursement/details");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test.describe("page content", () => {
    test("renders the heading and both inputs", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Disbursement details" }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: PURPOSE_INPUT }),
      ).toBeVisible();
      await expect(page.locator(AMOUNT_INPUT)).toBeVisible();
    });

    test("limits the description to 100 characters", async ({ page }) => {
      await expect(
        page.locator("#PriorAuthorityDisbursementPurpose"),
      ).toHaveAttribute("maxlength", "100");
    });

    test("links back to the disbursement landing page", async ({ page }) => {
      // The landing page bounces to /applications unless an application is in session.
      await page.goto("/applications/manage/APP-1001");
      await page.goto("/prior-authority/disbursement/details");

      await page.getByRole("link", { name: "Back", exact: true }).click();

      await expect(page).toHaveURL("/prior-authority/disbursement");
    });
  });

  test.describe("validation", () => {
    test("shows errors when the description and amount are missing", async ({
      page,
      request,
    }) => {
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", { name: "There is a problem" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Enter a description of the expense." }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Enter the amount of the expense." }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("shows an error when the amount is not numeric", async ({
      page,
      request,
    }) => {
      await page.getByRole("textbox", { name: PURPOSE_INPUT }).fill("Records");
      await page.locator(AMOUNT_INPUT).fill("abc");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", { name: "Enter a valid expense amount." }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("shows an error when the amount is zero", async ({
      page,
      request,
    }) => {
      await page.getByRole("textbox", { name: PURPOSE_INPUT }).fill("Records");
      await page.locator(AMOUNT_INPUT).fill("0");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", {
          name: "Expense amount must be greater than £0.",
        }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("shows an error when the amount is negative", async ({
      page,
      request,
    }) => {
      await page.getByRole("textbox", { name: PURPOSE_INPUT }).fill("Records");
      await page.locator(AMOUNT_INPUT).fill("-10");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", { name: "Expense amount cannot be negative." }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("keeps the entered description after a failed submission", async ({
      page,
    }) => {
      await page
        .getByRole("textbox", { name: PURPOSE_INPUT })
        .fill("Medical records request");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("textbox", { name: PURPOSE_INPUT }),
      ).toHaveValue("Medical records request");
    });
  });

  test.describe("persistence", () => {
    test("prefills the details from the saved draft", async ({ page }) => {
      await stubDraftGet(PRIOR_AUTHORITY_ID, FULLY_POPULATED_DRAFT);

      await page.goto("/prior-authority/disbursement/details");

      await expect(
        page.getByRole("textbox", { name: PURPOSE_INPUT }),
      ).toHaveValue("Original purpose");
      await expect(page.locator(AMOUNT_INPUT)).toHaveValue("99.99");
    });

    test("saves the details and continues to the justification page", async ({
      page,
      request,
    }) => {
      await page
        .getByRole("textbox", { name: PURPOSE_INPUT })
        .fill("Medical records request");
      await page.locator(AMOUNT_INPUT).fill("150.50");
      await page.getByRole("button", { name: "Continue" }).click();

      const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

      expect(draft.disbursementDetails).toEqual({
        disbursementPurpose: "Medical records request",
        disbursementAmount: 150.5,
      });
      await expect(page).toHaveURL(
        "/prior-authority/disbursement/justification",
      );
    });

    // The whole draft is PUT on every page, so a page must not drop fields it does not own.
    test("leaves the rest of the draft untouched when saving", async ({
      page,
      request,
    }) => {
      await stubDraftGet(PRIOR_AUTHORITY_ID, FULLY_POPULATED_DRAFT);
      await page.goto("/prior-authority/disbursement/details");

      await page
        .getByRole("textbox", { name: PURPOSE_INPUT })
        .fill("Medical records request");
      await page.locator(AMOUNT_INPUT).fill("150.50");
      await page.getByRole("button", { name: "Continue" }).click();

      await expectDraftPutBody(request, PRIOR_AUTHORITY_ID, {
        ...FULLY_POPULATED_DRAFT,
        disbursementDetails: {
          disbursementPurpose: "Medical records request",
          disbursementAmount: 150.5,
        },
      });
    });

    test("shows the error page when saving fails", async ({ page }) => {
      await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
        await page
          .getByRole("textbox", { name: PURPOSE_INPUT })
          .fill("Medical records request");
        await page.locator(AMOUNT_INPUT).fill("150.50");
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
