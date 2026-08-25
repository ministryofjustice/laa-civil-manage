import { completeCheckYourAnswersJourney } from "#tests/playwright/helpers/createCheckYourAnswersState.js";
import {
  connectSessionRedis,
  seedCheckYourAnswersSession,
} from "#tests/playwright/helpers/seedSession.js";
import {
  getBackendRequests,
  resetWiremockJournal,
} from "#tests/playwright/helpers/wiremock.js";
import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import type { RedisClientType } from "redis";

const APPLICATION_ID = "APP-DYNAMIC-ID";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test.describe("Check your answers page", () => {
  let context: BrowserContext;
  let page: Page;
  let redisClient: RedisClientType;

  test.beforeAll(async () => {
    redisClient = await connectSessionRedis();
  });

  test.afterAll(async () => {
    await redisClient.quit();
  });

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    await seedCheckYourAnswersSession(redisClient, context, {
      applicationId: APPLICATION_ID,
      costsSharedWithOtherParties: "No",
    });
    page = await context.newPage();
    await page.goto("/prior-authority/expert/check-your-answers");
    await expect(page).toHaveURL("/prior-authority/expert/check-your-answers");
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("renders expert details from session data", async () => {
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

  test("renders Expert details and Supporting files card sections", async () => {
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

  test("change links point to the exact form pages", async () => {
    const changeServiceRequestedAndProvidersNameLink = page.getByRole("link", {
      name: "Change service required and provider's name",
    });
    await expect(changeServiceRequestedAndProvidersNameLink).toHaveAttribute(
      "href",
      "/prior-authority/expert/details",
    );

    const changePostcodeLink = page.getByRole("link", {
      name: "Change postcode",
    });
    await expect(changePostcodeLink).toHaveAttribute(
      "href",
      "/prior-authority/expert/postcode",
    );

    const changeSupportingDocumentsLink = page.getByRole("link", {
      name: "Change supporting files",
    });
    await expect(changeSupportingDocumentsLink).toHaveAttribute(
      "href",
      "/prior-authority/expert/document-upload",
    );

    await changeServiceRequestedAndProvidersNameLink.click();
    await expect(page).toHaveURL("/prior-authority/expert/details");

    await page.goto("/prior-authority/expert/check-your-answers");

    await changePostcodeLink.click();
    await expect(page).toHaveURL("/prior-authority/expert/postcode");

    await page.goto("/prior-authority/expert/check-your-answers");

    await changeSupportingDocumentsLink.click();
    await expect(page).toHaveURL("/prior-authority/expert/document-upload");
  });

  test("renders expert costs card with Fixed rate billing from session data", async () => {
    await expect(
      page.getByRole("heading", { name: "Expert costs" }),
    ).toBeVisible();
    await expect(page.getByText("Billing method").first()).toBeVisible();
    await expect(page.getByText("Fixed rate").first()).toBeVisible();
    await expect(page.getByText("Total amount").first()).toBeVisible();
    await expect(page.getByText("£200").first()).toBeVisible();

    const changeExpertCostsLink = page.getByRole("link", {
      name: "Change expert costs",
    });
    await expect(changeExpertCostsLink).toHaveAttribute(
      "href",
      "/prior-authority/expert/costs",
    );
  });

  test("renders expert costs card with hourly billing", async ({ browser }) => {
    const hourlyContext = await browser.newContext();
    await seedCheckYourAnswersSession(redisClient, hourlyContext, {
      applicationId: APPLICATION_ID,
    });
    const hourlyPage = await hourlyContext.newPage();

    await hourlyPage.goto("/prior-authority/expert/costs");
    await hourlyPage.getByRole("radio", { name: "Hourly" }).check();
    await hourlyPage.locator("#PriorAuthorityHourlyRate").fill("150");
    await hourlyPage
      .locator(
        '[id="PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours"]',
      )
      .fill("2");
    await hourlyPage
      .locator(
        '[id="PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes"]',
      )
      .fill("30");
    await hourlyPage.getByRole("button", { name: "Calculate" }).click();
    await hourlyPage.getByRole("button", { name: "Continue" }).click();
    await expect(hourlyPage).toHaveURL("/prior-authority/expert/costs-shared");

    await hourlyPage.getByRole("radio", { name: "No" }).check();
    await hourlyPage.getByRole("button", { name: "Continue" }).click();
    await expect(hourlyPage).toHaveURL("/prior-authority/expert/justification");

    await hourlyPage
      .locator("#justification")
      .fill("Hourly expert work is necessary.");
    await hourlyPage.getByRole("button", { name: "Continue" }).click();
    await expect(hourlyPage).toHaveURL(
      "/prior-authority/expert/document-upload",
    );

    await hourlyPage.goto("/prior-authority/expert/check-your-answers");

    await expect(
      hourlyPage.getByRole("heading", { name: "Expert costs excluding VAT" }),
    ).toBeVisible();
    await expect(hourlyPage.getByText("Billing method").first()).toBeVisible();
    await expect(hourlyPage.getByText("Hourly").first()).toBeVisible();
    await expect(hourlyPage.getByText("Hourly rate").first()).toBeVisible();
    await expect(hourlyPage.getByText("£150").first()).toBeVisible();
    await expect(hourlyPage.getByText("Time requested").first()).toBeVisible();
    await expect(hourlyPage.getByText("2 Hours").first()).toBeVisible();
    await expect(hourlyPage.getByText("30 Minutes").first()).toBeVisible();
    await expect(
      hourlyPage.getByText("Total expert cost").first(),
    ).toBeVisible();
    await expect(hourlyPage.getByText("£375.00").first()).toBeVisible();

    await hourlyContext.close();
  });

  test("submit posts the mapped payload to the backend", async ({
    browser,
    request,
  }) => {
    const isolatedContext = await browser.newContext();
    const isolatedPage = await isolatedContext.newPage();

    try {
      await completeCheckYourAnswersJourney(isolatedPage);
      await resetWiremockJournal(request);

      await isolatedPage.getByRole("button", { name: "Submit" }).click();
      await expect(isolatedPage).toHaveURL(
        "/prior-authority/expert/confirmation-page",
      );

      const submitRequests = await getBackendRequests<{
        uploadedDocuments: Array<{ fileName: string }>;
        [key: string]: unknown;
      }>(request, { method: "POST", urlPath: "/prior-authority" });

      expect(submitRequests).toHaveLength(1);
      const [body] = submitRequests;

      // The document fileName is a UUID generated at upload time — assert
      // shape separately and normalise so we can assert the full payload.
      expect(body.uploadedDocuments).toHaveLength(1);
      expect(body.uploadedDocuments[0].fileName).toMatch(UUID_REGEX);

      expect({
        ...body,
        uploadedDocuments: [{ fileName: "<uuid>" }],
      }).toEqual({
        applicationId: APPLICATION_ID,
        priorAuthorityType: "EXPERT",
        justification: "Case requires expert support.",
        uploadedDocuments: [{ fileName: "<uuid>" }],
        expertDetails: {
          expertType: "Dentist",
          expertFullName: "John Doe",
          expertPostcode: "SW1H 9AJ",
          expertCosts: {
            billingType: "FIXED_RATE",
            totalAmount: 200,
            costsSharedWithOtherParties: false,
          },
        },
      });
    } finally {
      await isolatedContext.close();
    }
  });

  test("submit sends the user to the application submitted page", async () => {
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/confirmation-page");
    await expect(
      page.getByRole("heading", {
        name: "Prior authority application submitted",
      }),
    ).toBeVisible();
  });

  test("complete prior authority journey from start to submission", async ({
    browser,
  }) => {
    const journeyContext = await browser.newContext();
    const journeyPage = await journeyContext.newPage();

    await journeyPage.goto("/applications/manage/APP-1001");
    await journeyPage
      .getByRole("link", { name: "Apply for prior authority for an expert" })
      .click();

    await expect(journeyPage).toHaveURL("/prior-authority/expert");

    await journeyPage.getByRole("button", { name: "Start" }).click();
    await expect(journeyPage).toHaveURL("/prior-authority/expert/details");

    await journeyPage.waitForSelector(
      'input[role="combobox"]#PriorAuthorityExpertType',
    );
    await journeyPage
      .getByRole("combobox", { name: "Service required" })
      .fill("Den");
    await journeyPage.getByRole("option", { name: "Dentist" }).click();
    await journeyPage
      .getByRole("textbox", { name: "Provider's name" })
      .fill("Jane Smith");
    await journeyPage.getByRole("button", { name: "Continue" }).click();
    await expect(journeyPage).toHaveURL("/prior-authority/expert/postcode");

    await journeyPage.getByLabel("Postcode").fill("SW1A 1AA");
    await journeyPage.getByRole("button", { name: "Continue" }).click();
    await expect(journeyPage).toHaveURL("/prior-authority/expert/costs");
    await journeyPage.getByRole("radio", { name: "Fixed rate" }).check();
    await journeyPage
      .locator("#PriorAuthorityFixedRateTotalAmount")
      .fill("200");
    await journeyPage.getByRole("button", { name: "Continue" }).click();
    await expect(journeyPage).toHaveURL("/prior-authority/expert/costs-shared");

    await journeyPage.getByRole("radio", { name: "No" }).check();
    await journeyPage.getByRole("button", { name: "Continue" }).click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority/expert/justification",
    );

    await journeyPage
      .locator("#justification")
      .fill("This expert evidence is required to progress the case.");
    await journeyPage.getByRole("button", { name: "Continue" }).click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority/expert/document-upload",
    );

    const fileInput = journeyPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "journey-test-document.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("test file content"),
    });
    await journeyPage.getByRole("button", { name: "Continue" }).click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority/expert/check-your-answers",
    );

    await expect(
      journeyPage.getByRole("heading", { name: "Check your answers" }),
    ).toBeVisible();
    await expect(journeyPage.getByText("Dentist").first()).toBeVisible();
    await expect(journeyPage.getByText("Jane Smith").first()).toBeVisible();
    await expect(
      journeyPage.getByText("journey-test-document.pdf").first(),
    ).toBeVisible();

    await journeyPage.getByRole("button", { name: "Submit" }).click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority/expert/confirmation-page",
    );
    await expect(
      journeyPage.getByRole("heading", {
        name: "Prior authority application submitted",
      }),
    ).toBeVisible();

    await journeyContext.close();
  });
});

test.describe("Check your answers - apportionment of costs card", () => {
  let redisClient: RedisClientType;

  test.beforeAll(async () => {
    redisClient = await connectSessionRedis();
  });

  test.afterAll(async () => {
    await redisClient.quit();
  });

  test("shows Yes with the number of parties and the client's share when costs are shared", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await seedCheckYourAnswersSession(redisClient, context, {
      costsSharedWithOtherParties: "Yes",
      numberOfParties: "3",
      apportionedAmount: "50",
    });
    const page = await context.newPage();
    await page.goto("/prior-authority/expert/check-your-answers");

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
  });

  test("shows only the No row when costs are not shared", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await seedCheckYourAnswersSession(redisClient, context, {
      costsSharedWithOtherParties: "No",
    });
    const page = await context.newPage();
    await page.goto("/prior-authority/expert/check-your-answers");

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
  });

  test("apportionment change links point to the correct pages", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await seedCheckYourAnswersSession(redisClient, context, {
      costsSharedWithOtherParties: "Yes",
      numberOfParties: "3",
      apportionedAmount: "50",
    });
    const page = await context.newPage();
    await page.goto("/prior-authority/expert/check-your-answers");

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
  });
});
