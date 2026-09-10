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

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("expert");

const hoursInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator(
    '[id="PriorAuthorityEstimatedTime.PriorAuthorityEstimatedHours"]',
  );
const minutesInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator(
    '[id="PriorAuthorityEstimatedTime.PriorAuthorityEstimatedMinutes"]',
  );
const fixedRateInput = (page: Page): ReturnType<Page["locator"]> =>
  page.locator("#PriorAuthorityFixedRateTotalAmount");

test.describe("Expert costs page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "expert");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert/costs");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test.describe("page content", () => {
    test("links back to the postcode page", async ({ page }) => {
      await page.getByRole("link", { name: "Back", exact: true }).click();

      await expect(page).toHaveURL("/prior-authority/expert/postcode");
    });

    test("renders the heading and the billing type options", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", {
          name: "How will you be billed by the service provider?",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByRole("radio", { name: "Hourly" })).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Fixed rate" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Continue" }),
      ).toBeVisible();
    });

    test("shows the 'Do not include VAT' hint on the billing question", async ({
      page,
    }) => {
      await expect(page.getByText("Do not include VAT")).toBeVisible();
    });

    test("shows the billing option hints without the VAT wording", async ({
      page,
    }) => {
      await expect(
        page.getByText("You pay for the number of hours worked"),
      ).toBeVisible();
      await expect(page.getByText("You pay one fixed cost")).toBeVisible();
    });
  });

  test.describe("conditional reveals", () => {
    test("selecting Hourly reveals the hourly rate, time and Calculate button", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();

      await expect(page.getByLabel("Hourly rate")).toBeVisible();
      await expect(hoursInput(page)).toBeVisible();
      await expect(minutesInput(page)).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Calculate" }),
      ).toBeVisible();
    });

    test("selecting Fixed rate reveals the fixed rate total amount field", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Fixed rate" }).click();

      await expect(fixedRateInput(page)).toBeVisible();
    });

    test("switching from Hourly to Fixed rate hides the hourly section", async ({
      page,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();
      await expect(page.getByLabel("Hourly rate")).toBeVisible();

      await page.getByRole("radio", { name: "Fixed rate" }).click();

      await expect(page.getByLabel("Hourly rate")).not.toBeVisible();
    });
  });

  test.describe("validation", () => {
    test("shows an error when no billing type is selected", async ({
      page,
      request,
    }) => {
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", { name: "There is a problem" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Select the billing type" }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("shows errors when Hourly is selected without any cost fields", async ({
      page,
      request,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", { name: "Enter the hourly rate" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Enter the hours" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Enter the minutes" }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("shows an error when Fixed rate is selected without an amount", async ({
      page,
      request,
    }) => {
      await page.getByRole("radio", { name: "Fixed rate" }).click();
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("link", { name: "Enter the total amount" }),
      ).toBeVisible();
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });
  });

  test.describe("persistence", () => {
    test("prefills the hourly rate, time and total from the saved draft", async ({
      page,
    }) => {
      await stubDraftGet(PRIOR_AUTHORITY_ID, {
        applicationId: RESET_APPLICATION_ID,
        priorAuthorityType: "EXPERT",
        expertDetails: {
          expertCosts: {
            billingType: "HOURLY",
            hourlyRate: 75,
            timeRequested: { hours: 3, minutes: 45 },
            totalAmount: 281.25,
          },
        },
      });

      await page.goto("/prior-authority/expert/costs");

      await expect(page.getByRole("radio", { name: "Hourly" })).toBeChecked();
      await expect(page.getByLabel("Hourly rate")).toHaveValue("75");
      await expect(hoursInput(page)).toHaveValue("3");
      await expect(minutesInput(page)).toHaveValue("45");
      await expect(page.getByText("£281.25").first()).toBeVisible();
    });

    test("prefills the fixed rate total from the saved draft", async ({
      page,
    }) => {
      await stubDraftGet(PRIOR_AUTHORITY_ID, {
        applicationId: RESET_APPLICATION_ID,
        priorAuthorityType: "EXPERT",
        expertDetails: {
          expertCosts: { billingType: "FIXED_RATE", totalAmount: 300 },
        },
      });

      await page.goto("/prior-authority/expert/costs");

      await expect(
        page.getByRole("radio", { name: "Fixed rate" }),
      ).toBeChecked();
      await expect(fixedRateInput(page)).toHaveValue("300");
    });

    test("saves the hourly costs and continues to the costs shared page", async ({
      page,
      request,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByLabel("Hourly rate").fill("50");
      await hoursInput(page).fill("2");
      await minutesInput(page).fill("30");
      await page.getByRole("button", { name: "Continue" }).click();

      const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

      expect(draft.expertDetails?.expertCosts).toMatchObject({
        billingType: "HOURLY",
        hourlyRate: 50,
        timeRequested: { hours: 2, minutes: 30 },
      });
      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
    });

    test("saves the fixed rate total and continues to the costs shared page", async ({
      page,
      request,
    }) => {
      await page.getByRole("radio", { name: "Fixed rate" }).click();
      await fixedRateInput(page).fill("200");
      await page.getByRole("button", { name: "Continue" }).click();

      const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

      expect(draft.expertDetails?.expertCosts).toMatchObject({
        billingType: "FIXED_RATE",
        totalAmount: 200,
      });
      await expect(page).toHaveURL("/prior-authority/expert/costs-shared");
    });

    test("saves only the fixed rate values when switching from Hourly", async ({
      page,
      request,
    }) => {
      await page.getByRole("radio", { name: "Hourly" }).click();
      await page.getByLabel("Hourly rate").fill("75");
      await hoursInput(page).fill("3");
      await minutesInput(page).fill("45");

      await page.getByRole("radio", { name: "Fixed rate" }).click();
      await fixedRateInput(page).fill("500");
      await page.getByRole("button", { name: "Continue" }).click();

      const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);
      const costs = draft.expertDetails?.expertCosts;

      expect(costs?.billingType).toBe("FIXED_RATE");
      expect(costs?.totalAmount).toBe(500);
      expect(costs?.hourlyRate).toBeUndefined();
      expect(costs?.timeRequested).toBeUndefined();
    });

    test("shows the error page when saving fails", async ({ page }) => {
      await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
        await page.getByRole("radio", { name: "Fixed rate" }).click();
        await fixedRateInput(page).fill("200");
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
