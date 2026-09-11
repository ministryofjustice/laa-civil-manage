import { test, expect } from "@playwright/test";
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

const serviceInput = "What is the service?";

test.describe("Service type page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "expert");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert/other-expert-type");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("renders the heading and hint text", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: serviceInput }),
    ).toBeVisible();
    await expect(page.getByText("For example, Osteopath")).toBeVisible();
  });

  test("links back to the service required page", async ({ page }) => {
    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/expert/expert-type");
  });

  test("prefills the service from the saved draft", async ({ page }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      expertDetails: { expertType: "Balloon artist" },
    });

    await page.goto("/prior-authority/expert/other-expert-type");

    await expect(page.getByRole("textbox", { name: serviceInput })).toHaveValue(
      "Balloon artist",
    );
  });

  test("redirects to the provider name page when the draft holds a listed service", async ({
    page,
  }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: "EXPERT",
      expertDetails: { expertType: "Dentist" },
    });

    await page.goto("/prior-authority/expert/other-expert-type");

    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
  });

  test("shows an error when the service is missing", async ({
    page,
    request,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
    await expect(
      page.getByRole("link", { name: "Enter the service" }),
    ).toBeVisible();
    await expect(
      page.locator("#PriorAuthorityExpertTypeOther-error"),
    ).toContainText("Enter the service");
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("saves the service and continues to the provider name page", async ({
    page,
    request,
  }) => {
    await page
      .getByRole("textbox", { name: serviceInput })
      .fill("Balloon artist");
    await page.getByRole("button", { name: "Continue" }).click();

    const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

    expect(draft.expertDetails?.expertType).toBe("Balloon artist");
    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
  });

  test("shows the error page when saving fails", async ({ page }) => {
    await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
      await page
        .getByRole("textbox", { name: serviceInput })
        .fill("Balloon artist");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Sorry, there is a problem with the service",
        }),
      ).toBeVisible();
    });
  });
});
