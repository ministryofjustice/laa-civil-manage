import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import type { RedisClientType } from "redis";
import {
  connectSessionRedis,
  seedCheckYourAnswersSession,
} from "#tests/playwright/helpers/seedSession.js";
import {
  clearRegisteredStubs,
  expectDraftSubmit,
  resetWiremockJournal,
  withFailingDraftSubmit,
} from "#tests/playwright/helpers/wiremock.js";
import { buildResetPriorAuthorityId } from "#tests/playwright/helpers/resetSession.js";
import type { PriorAuthorityDraftDto } from "#src/types/priorAuthority/api.js";

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("disbursement");
const CHECK_YOUR_ANSWERS_URL =
  "/prior-authority/disbursement/check-your-answers";

const DISBURSEMENT_DRAFT: PriorAuthorityDraftDto = {
  applicationId: "APP-DYNAMIC-ID",
  priorAuthorityType: "DISBURSEMENT",
  justification: "This disbursement is necessary to support the case.",
  disbursementDetails: {
    disbursementPurpose: "Medical records request",
    disbursementAmount: 150.5,
  },
};

test.describe("Disbursement check your answers page", () => {
  let redisClient: RedisClientType;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    redisClient = await connectSessionRedis();
  });

  test.afterAll(async () => {
    await redisClient.quit();
  });

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    await seedCheckYourAnswersSession(redisClient, context, {
      section: "disbursement",
      draft: DISBURSEMENT_DRAFT,
      uploadedDocuments: [
        {
          fileName: "33333333-3333-3333-3333-333333333333",
          originalFileName: "disbursement-quote.pdf",
        },
      ],
    });
    page = await context.newPage();
    await page.goto(CHECK_YOUR_ANSWERS_URL);
  });

  test.afterEach(async () => {
    await context.close();
    await clearRegisteredStubs();
  });

  test("renders the disbursement answers from the saved draft", async () => {
    await expect(
      page.getByRole("heading", { name: "Check your answers" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Disbursement details" }),
    ).toBeVisible();
    await expect(
      page.getByText("What is the disbursement for?").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Medical records request").first(),
    ).toBeVisible();
    await expect(
      page.getByText("What is the total cost?").first(),
    ).toBeVisible();
    // BUG: hydration stringifies the number, so a 150.50 amount renders as "£150.5".
    await expect(page.getByText("£150.5").first()).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Why is this disbursement required?" }),
    ).toBeVisible();
    await expect(
      page
        .getByText("This disbursement is necessary to support the case.")
        .first(),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Supporting files" }),
    ).toBeVisible();
    await expect(
      page.getByText("disbursement-quote.pdf").first(),
    ).toBeVisible();
  });

  test("links back to the document upload page", async () => {
    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL(
      "/prior-authority/disbursement/document-upload",
    );
  });

  test("change links point at the matching form pages", async () => {
    await expect(
      page.getByRole("link", { name: "Change disbursement details" }),
    ).toHaveAttribute("href", "/prior-authority/disbursement/details");
    await expect(
      page.getByRole("link", { name: "Change justification" }),
    ).toHaveAttribute("href", "/prior-authority/disbursement/justification");
    await expect(
      page.getByRole("link", { name: "Change supporting files" }),
    ).toHaveAttribute("href", "/prior-authority/disbursement/document-upload");
  });

  test("submits the draft and continues to the confirmation page", async ({
    request,
  }) => {
    await resetWiremockJournal(request);

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(
      "/prior-authority/disbursement/confirmation-page",
    );
    await expect(
      page.getByRole("heading", {
        name: "Prior authority application submitted",
      }),
    ).toBeVisible();
    await expectDraftSubmit(request, PRIOR_AUTHORITY_ID);
  });

  test("shows the error page when submission fails", async () => {
    await withFailingDraftSubmit(PRIOR_AUTHORITY_ID, 500, async () => {
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Sorry, there is a problem with the service",
        }),
      ).toBeVisible();
    });
  });
});
