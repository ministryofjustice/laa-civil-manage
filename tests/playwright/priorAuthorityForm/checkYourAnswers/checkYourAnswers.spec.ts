import {
  completeCheckYourAnswersJourney,
  createCheckYourAnswersState,
} from "#tests/playwright/helpers/createCheckYourAnswersState.js";
import {
  getBackendRequests,
  resetWiremockJournal,
} from "#tests/playwright/helpers/wiremock.js";
import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import path from "node:path";

const storageStatePath = path.resolve(
  process.cwd(),
  "playwright/.auth/check-your-answers.json",
);

const DEV_APPLICATION_ID = "00000000-0000-0000-0000-000000000001";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test.describe("Check your answers page", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await createCheckYourAnswersState(browser, storageStatePath);
  });

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({ storageState: storageStatePath });
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

    await expect(page.getByText("Expert type").first()).toBeVisible();
    await expect(page.getByText("Dentist").first()).toBeVisible();

    await expect(page.getByText("Full name").first()).toBeVisible();
    await expect(page.getByText("John Doe").first()).toBeVisible();

    await expect(
      page.getByText("Guideline rates or hours exceeded").first(),
    ).toBeVisible();

    await expect(page.getByText("Based in London").first()).toBeVisible();
    await expect(page.getByText("Yes").first()).toBeVisible();
  });

  test("renders Expert details and Supporting documents card sections", async () => {
    await expect(
      page.getByRole("heading", { name: "Expert details" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Expert costs" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Supporting documents" }),
    ).toBeVisible();
    await expect(page.getByText("File names").first()).toBeVisible();
    await expect(page.getByText("test-document.pdf").first()).toBeVisible();
  });

  test("change links point to the exact form pages", async () => {
    const changeExpertTypeAndFullNameLink = page.getByRole("link", {
      name: "Change expert type and full name",
    });
    await expect(changeExpertTypeAndFullNameLink).toHaveAttribute(
      "href",
      "/prior-authority/expert/details",
    );

    const changeBasedInLondonLink = page.getByRole("link", {
      name: "Change based in London",
    });
    await expect(changeBasedInLondonLink).toHaveAttribute(
      "href",
      "/prior-authority/expert/based-in-london",
    );

    const changeSupportingDocumentsLink = page.getByRole("link", {
      name: "Change supporting documents",
    });
    await expect(changeSupportingDocumentsLink).toHaveAttribute(
      "href",
      "/prior-authority/expert/document-upload",
    );

    await changeExpertTypeAndFullNameLink.click();
    await expect(page).toHaveURL("/prior-authority/expert/details");

    await page.goto("/prior-authority/expert/check-your-answers");

    await changeBasedInLondonLink.click();
    await expect(page).toHaveURL("/prior-authority/expert/based-in-london");

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
    const hourlyContext = await browser.newContext({
      storageState: storageStatePath,
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
    await hourlyPage.getByRole("button", { name: "Save and continue" }).click();
    await expect(hourlyPage).toHaveURL("/prior-authority/expert/justification");

    await hourlyPage
      .locator("#justification")
      .fill("Hourly expert work is necessary.");
    await hourlyPage.getByRole("button", { name: "Save and continue" }).click();
    await expect(hourlyPage).toHaveURL(
      "/prior-authority/expert/document-upload",
    );

    await hourlyPage.goto("/prior-authority/expert/check-your-answers");

    await expect(
      hourlyPage.getByRole("heading", { name: "Expert costs" }),
    ).toBeVisible();
    await expect(hourlyPage.getByText("Billing method").first()).toBeVisible();
    await expect(hourlyPage.getByText("Hourly").first()).toBeVisible();
    await expect(hourlyPage.getByText("Hourly rate").first()).toBeVisible();
    await expect(hourlyPage.getByText("£150").first()).toBeVisible();
    await expect(hourlyPage.getByText("Time requested").first()).toBeVisible();
    await expect(hourlyPage.getByText("2 Hours").first()).toBeVisible();
    await expect(hourlyPage.getByText("30 Minutes").first()).toBeVisible();
    await expect(hourlyPage.getByText("Total amount").first()).toBeVisible();
    await expect(hourlyPage.getByText("£375.00").first()).toBeVisible();

    await hourlyContext.close();
  });

  test("submit posts the mapped payload to the backend", async ({
    browser,
    request,
  }) => {
    // Use an isolated context / server-side session so this test doesn't
    // interfere with (or get polluted by) other tests that share storage
    // state. Submitting clears the session, so isolation is important.
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
        applicationId: DEV_APPLICATION_ID,
        priorAuthorityType: "EXPERT",
        expertType: "Dentist",
        expertFullName: "John Doe",
        expertPostcode: "SW1H 9AJ",
        expertBasedInLondon: true,
        billingType: "FIXED_RATE",
        totalAmount: 200,
        justification: "Case requires expert support.",
        uploadedDocuments: [{ fileName: "<uuid>" }],
      });
    } finally {
      await isolatedContext.close();
    }
  });

  test("submit sends the user to the application submitted page", async () => {
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save and come back later" }),
    ).toHaveCount(1);

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

    await journeyPage.goto("/prior-authority/type");
    await journeyPage.getByRole("radio", { name: "Expert" }).check();
    await journeyPage.getByRole("button", { name: "Continue" }).click();
    await expect(journeyPage).toHaveURL("/prior-authority/expert");

    await journeyPage.getByRole("button", { name: "Start" }).click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority/expert/is-guideline-rate-exceeded",
    );

    await journeyPage.getByRole("radio", { name: "Yes" }).check();
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority/expert/based-in-london",
    );

    await journeyPage.getByRole("radio", { name: "Yes" }).check();
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
    await expect(journeyPage).toHaveURL("/prior-authority/expert/details");

    await journeyPage.waitForSelector(
      'input[role="combobox"]#PriorAuthorityExpertType',
    );
    await journeyPage
      .getByRole("combobox", { name: "Search for the expert type" })
      .fill("Den");
    await journeyPage.getByRole("option", { name: "Dentist" }).click();
    await journeyPage
      .getByRole("textbox", { name: "What is the full name of the expert?" })
      .fill("Jane Smith");
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
    await expect(journeyPage).toHaveURL("/prior-authority/expert/costs");
    await journeyPage.getByRole("radio", { name: "Fixed rate" }).check();
    await journeyPage
      .locator("#PriorAuthorityFixedRateTotalAmount")
      .fill("200");
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority/expert/justification",
    );

    await journeyPage
      .locator("#justification")
      .fill("This expert evidence is required to progress the case.");
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority/expert/document-upload",
    );

    const fileInput = journeyPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "journey-test-document.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("test file content"),
    });
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
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
