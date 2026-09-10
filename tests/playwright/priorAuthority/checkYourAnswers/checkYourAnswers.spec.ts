import { test, expect } from "@playwright/test";
import type { Browser, BrowserContext, Page } from "@playwright/test";
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
import type {
  PriorAuthorityApplicationExpertCosts,
  PriorAuthorityDraftDto,
} from "#src/types/priorAuthority/api.js";

const APPLICATION_ID = "APP-DYNAMIC-ID";
const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("expert");
const CHECK_YOUR_ANSWERS_URL = "/prior-authority/expert/check-your-answers";

const expertDraft = (
  expertCosts: PriorAuthorityApplicationExpertCosts,
): PriorAuthorityDraftDto => ({
  applicationId: APPLICATION_ID,
  priorAuthorityType: "EXPERT",
  justification: "Case requires expert support.",
  expertDetails: {
    expertType: "Dentist",
    expertFullName: "John Doe",
    expertPostcode: "SW1H 9AJ",
    expertCosts,
  },
});

const FIXED_RATE_COSTS: PriorAuthorityApplicationExpertCosts = {
  billingType: "FIXED_RATE",
  totalAmount: 200,
  costsSharedWithOtherParties: false,
};

test.describe("Expert check your answers page", () => {
  let redisClient: RedisClientType;

  test.beforeAll(async () => {
    redisClient = await connectSessionRedis();
  });

  test.afterAll(async () => {
    await redisClient.quit();
  });

  test.describe("with fixed rate costs", () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext();
      await seedCheckYourAnswersSession(redisClient, context, {
        section: "expert",
        draft: expertDraft(FIXED_RATE_COSTS),
      });
      page = await context.newPage();
      await page.goto(CHECK_YOUR_ANSWERS_URL);
    });

    test.afterEach(async () => {
      await context.close();
      await clearRegisteredStubs();
    });

    test("renders the expert details from the saved draft", async () => {
      await expect(
        page.getByRole("heading", { name: "Check your answers" }),
      ).toBeVisible();

      await expect(page.getByText("Service required").first()).toBeVisible();
      await expect(page.getByText("Dentist").first()).toBeVisible();
      await expect(page.getByText("Provider's name").first()).toBeVisible();
      await expect(page.getByText("John Doe").first()).toBeVisible();
      await expect(page.getByText("Postcode").first()).toBeVisible();
      await expect(page.getByText("SW1H 9AJ").first()).toBeVisible();
    });

    test("renders the expert details, costs and supporting files cards", async () => {
      await expect(
        page.getByRole("heading", { name: "Expert details" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Expert costs" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Supporting files" }),
      ).toBeVisible();
      await expect(page.getByText("test-document.pdf").first()).toBeVisible();
    });

    test("renders the fixed rate billing details", async () => {
      await expect(page.getByText("Billing method").first()).toBeVisible();
      await expect(page.getByText("Fixed rate").first()).toBeVisible();
      await expect(page.getByText("Total amount").first()).toBeVisible();
      await expect(page.getByText("£200").first()).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Change expert costs" }),
      ).toHaveAttribute("href", "/prior-authority/expert/costs");
    });

    test("change links point at the matching form pages", async () => {
      const links = [
        ["Change service required", "/prior-authority/expert/expert-type"],
        ["Change provider's name", "/prior-authority/expert/provider-name"],
        ["Change postcode", "/prior-authority/expert/postcode"],
        ["Change supporting files", "/prior-authority/expert/document-upload"],
      ] as const;

      for (const [name, href] of links) {
        await expect(page.getByRole("link", { name })).toHaveAttribute(
          "href",
          href,
        );
      }

      for (const [name, href] of links) {
        await page.goto(CHECK_YOUR_ANSWERS_URL);
        await page.getByRole("link", { name }).click();
        await expect(page).toHaveURL(href);
      }
    });

    test("submits the draft and continues to the confirmation page", async ({
      request,
    }) => {
      await resetWiremockJournal(request);

      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/confirmation-page");
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

  test("renders the hourly billing details", async ({ browser }) => {
    const context = await browser.newContext();
    await seedCheckYourAnswersSession(redisClient, context, {
      section: "expert",
      draft: expertDraft({
        billingType: "HOURLY",
        hourlyRate: 150,
        timeRequested: { hours: 2, minutes: 30 },
        totalAmount: 375,
        costsSharedWithOtherParties: false,
      }),
    });
    const page = await context.newPage();

    await page.goto(CHECK_YOUR_ANSWERS_URL);

    await expect(
      page.getByRole("heading", { name: "Expert costs excluding VAT" }),
    ).toBeVisible();
    await expect(page.getByText("Billing method").first()).toBeVisible();
    await expect(page.getByText("Hourly").first()).toBeVisible();
    await expect(page.getByText("Hourly rate").first()).toBeVisible();
    await expect(page.getByText("£150").first()).toBeVisible();
    await expect(page.getByText("Time requested").first()).toBeVisible();
    await expect(page.getByText("2 Hours").first()).toBeVisible();
    await expect(page.getByText("30 Minutes").first()).toBeVisible();
    await expect(page.getByText("Total expert cost").first()).toBeVisible();
    // BUG: hydration stringifies the number, so a 375.00 total renders as "£375".
    await expect(page.getByText("£375").first()).toBeVisible();

    await context.close();
    await clearRegisteredStubs();
  });
});

test.describe("Expert check your answers - apportionment of costs card", () => {
  let redisClient: RedisClientType;

  test.beforeAll(async () => {
    redisClient = await connectSessionRedis();
  });

  test.afterAll(async () => {
    await redisClient.quit();
  });

  const openApportionment = async (
    browser: Browser,
    costs: PriorAuthorityApplicationExpertCosts,
  ): Promise<{ context: BrowserContext; page: Page }> => {
    const context = await browser.newContext();
    await seedCheckYourAnswersSession(redisClient, context, {
      section: "expert",
      draft: expertDraft(costs),
    });
    const page = await context.newPage();
    await page.goto(CHECK_YOUR_ANSWERS_URL);
    return { context, page };
  };

  test("shows the parties and client share when costs are shared", async ({
    browser,
  }) => {
    const { context, page } = await openApportionment(browser, {
      ...FIXED_RATE_COSTS,
      costsSharedWithOtherParties: true,
      apportionment: { partiesSharingCosts: 3, clientShareAmount: 50 },
    });

    const card = page.locator(".govuk-summary-card", {
      hasText: "Apportionment of costs",
    });

    await expect(
      card.getByRole("heading", { name: "Apportionment of costs" }),
    ).toBeVisible();
    await expect(
      card.getByText("Shared with other parties", { exact: true }),
    ).toBeVisible();
    await expect(card.getByText("Yes", { exact: true })).toBeVisible();
    await expect(
      card.getByText("Number of parties sharing the cost", { exact: true }),
    ).toBeVisible();
    await expect(card.getByText("3", { exact: true })).toBeVisible();
    await expect(
      card.getByText("Your client’s share", { exact: true }),
    ).toBeVisible();
    await expect(card.getByText("£50", { exact: true })).toBeVisible();

    await context.close();
    await clearRegisteredStubs();
  });

  test("shows only the No row when costs are not shared", async ({
    browser,
  }) => {
    const { context, page } = await openApportionment(
      browser,
      FIXED_RATE_COSTS,
    );

    const card = page.locator(".govuk-summary-card", {
      hasText: "Apportionment of costs",
    });

    await expect(
      card.getByText("Shared with other parties", { exact: true }),
    ).toBeVisible();
    await expect(card.getByText("No", { exact: true })).toBeVisible();
    await expect(
      card.getByText("Number of parties sharing the cost", { exact: true }),
    ).toHaveCount(0);
    await expect(
      card.getByText("Your client’s share", { exact: true }),
    ).toHaveCount(0);

    await context.close();
    await clearRegisteredStubs();
  });

  test("apportionment change links point at the matching form pages", async ({
    browser,
  }) => {
    const { context, page } = await openApportionment(browser, {
      ...FIXED_RATE_COSTS,
      costsSharedWithOtherParties: true,
      apportionment: { partiesSharingCosts: 3, clientShareAmount: 50 },
    });

    await expect(
      page.getByRole("link", {
        name: "Change if costs are shared with other parties",
      }),
    ).toHaveAttribute("href", "/prior-authority/expert/costs-shared");
    await expect(
      page.getByRole("link", {
        name: "Change number of parties sharing the cost",
      }),
    ).toHaveAttribute("href", "/prior-authority/expert/share-of-costs");

    await context.close();
    await clearRegisteredStubs();
  });
});
