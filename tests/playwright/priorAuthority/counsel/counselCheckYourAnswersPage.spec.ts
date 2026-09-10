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

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("counsel");
const CHECK_YOUR_ANSWERS_URL = "/prior-authority/counsel/check-your-answers";

const COUNSEL_DRAFT: PriorAuthorityDraftDto = {
  applicationId: "APP-DYNAMIC-ID",
  priorAuthorityType: "COUNSEL",
  justification: "This counsel is necessary to support the case.",
  counselDetails: { counselType: "KINGS_COUNSEL_ALONE" },
};

test.describe("Counsel check your answers page", () => {
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
      section: "counsel",
      draft: COUNSEL_DRAFT,
      uploadedDocuments: [
        {
          fileName: "22222222-2222-2222-2222-222222222222",
          originalFileName: "counsel-advice.pdf",
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

  test("renders the counsel answers from the saved draft", async () => {
    await expect(
      page.getByRole("heading", { name: "Check your answers" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Counsel details" }),
    ).toBeVisible();
    await expect(page.getByText("Counsel type").first()).toBeVisible();
    await expect(page.getByText("King's Counsel alone").first()).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Justification" }),
    ).toBeVisible();
    await expect(
      page.getByText("This counsel is necessary to support the case.").first(),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Supporting files" }),
    ).toBeVisible();
    await expect(page.getByText("counsel-advice.pdf").first()).toBeVisible();
  });

  test("links back to the document upload page", async () => {
    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/document-upload");
  });

  test("change links point at the matching form pages", async () => {
    await expect(
      page.getByRole("link", { name: "Change counsel type" }),
    ).toHaveAttribute("href", "/prior-authority/counsel/type");
    await expect(
      page.getByRole("link", { name: "Change justification" }),
    ).toHaveAttribute("href", "/prior-authority/counsel/justification");
    await expect(
      page.getByRole("link", { name: "Change supporting files" }),
    ).toHaveAttribute("href", "/prior-authority/counsel/document-upload");
  });

  test("submits the draft and continues to the confirmation page", async ({
    request,
  }) => {
    await resetWiremockJournal(request);

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/confirmation-page");
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
