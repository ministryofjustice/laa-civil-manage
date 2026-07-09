import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import path from "node:path";
import { createCheckYourAnswersState } from "#tests/playwright/helpers/createCheckYourAnswersState.js";

const storageStatePath = path.resolve(
  process.cwd(),
  "playwright/.auth/check-your-answers.json",
);

test.describe("Check your answers page", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await createCheckYourAnswersState(browser, storageStatePath);
  });

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({ storageState: storageStatePath });
    page = await context.newPage();
    await page.goto("/prior-authority-form/check-your-answers");
    await expect(page).toHaveURL("/prior-authority-form/check-your-answers");
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
      "/prior-authority-form/expert-details",
    );

    const changeBasedInLondonLink = page.getByRole("link", {
      name: "Change based in London",
    });
    await expect(changeBasedInLondonLink).toHaveAttribute(
      "href",
      "/prior-authority-form/expert-based-in-london",
    );

    const changeSupportingDocumentsLink = page.getByRole("link", {
      name: "Change supporting documents",
    });
    await expect(changeSupportingDocumentsLink).toHaveAttribute(
      "href",
      "/prior-authority-form/document-upload",
    );

    await changeExpertTypeAndFullNameLink.click();
    await expect(page).toHaveURL("/prior-authority-form/expert-details");

    await page.goto("/prior-authority-form/check-your-answers");

    await changeBasedInLondonLink.click();
    await expect(page).toHaveURL(
      "/prior-authority-form/expert-based-in-london",
    );

    await page.goto("/prior-authority-form/check-your-answers");

    await changeSupportingDocumentsLink.click();
    await expect(page).toHaveURL("/prior-authority-form/document-upload");
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
      "/prior-authority-form/expert-costs",
    );
  });

  test("renders expert costs card with hourly billing", async ({ browser }) => {
    const hourlyContext = await browser.newContext({
      storageState: storageStatePath,
    });
    const hourlyPage = await hourlyContext.newPage();

    await hourlyPage.goto("/prior-authority-form/expert-costs");
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
    await hourlyPage.getByRole("button", { name: "Save and continue" }).click();
    await expect(hourlyPage).toHaveURL("/prior-authority-form/document-upload");

    await hourlyPage.goto("/prior-authority-form/check-your-answers");

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

  test("submit sends the user to the application submitted page", async () => {
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save and come back later" }),
    ).toHaveCount(1);

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL("/prior-authority-form/confirmation-page");
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

    await journeyPage.goto("/");
    await journeyPage.getByRole("radio", { name: "Expert" }).check();
    await journeyPage.getByRole("button", { name: "Continue" }).click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority-form/expert",
    );
    
    await journeyPage.getByRole("button", { name: "Start" }).click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority-form/is-guideline-rate-exceeded",
    );

    await journeyPage.getByRole("radio", { name: "Yes" }).check();
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority-form/expert-based-in-london",
    );

    await journeyPage.getByRole("radio", { name: "Yes" }).check();
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
    await expect(journeyPage).toHaveURL("/prior-authority-form/expert-details");

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
    await expect(journeyPage).toHaveURL("/prior-authority-form/expert-costs");
    await journeyPage.getByRole("radio", { name: "Fixed rate" }).check();
    await journeyPage
      .locator("#PriorAuthorityFixedRateTotalAmount")
      .fill("200");
    await journeyPage
      .getByRole("button", { name: "Save and continue" })
      .click();
    await expect(journeyPage).toHaveURL(
      "/prior-authority-form/document-upload",
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
      "/prior-authority-form/check-your-answers",
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
      "/prior-authority-form/confirmation-page",
    );
    await expect(
      journeyPage.getByRole("heading", {
        name: "Prior authority application submitted",
      }),
    ).toBeVisible();

    await journeyContext.close();
  });
});
