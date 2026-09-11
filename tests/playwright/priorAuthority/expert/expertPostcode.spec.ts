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
import { buildExpertDraftDto } from "#src/utils/mappers/priorAuthorityDraftMapper.js";

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("expert");

test.describe("Expert postcode page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "expert");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert/postcode");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("renders the heading and the postcode input", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Where is the service based?" }),
    ).toBeVisible();
    await expect(page.getByLabel("Postcode")).toBeVisible();
  });

  test("links back to the provider name page", async ({ page }) => {
    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/expert/provider-name");
  });

  test("prefills the postcode from the saved draft", async ({ page }) => {
    await stubDraftGet(
      PRIOR_AUTHORITY_ID,
      buildExpertDraftDto(RESET_APPLICATION_ID, {
        expertPostcode: "SW1A 1AA",
      }),
    );

    await page.goto("/prior-authority/expert/postcode");

    await expect(page.getByLabel("Postcode")).toHaveValue("SW1A 1AA");
  });

  test("leaves the postcode empty when the draft has no postcode", async ({
    page,
  }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: "EXPERT",
    });

    await page.goto("/prior-authority/expert/postcode");

    await expect(page.getByLabel("Postcode")).toHaveValue("");
  });

  test("shows an error when the postcode is missing", async ({
    page,
    request,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Enter a valid postcode" }),
    ).toBeVisible();
    await expect(page.locator(".govuk-error-message")).toContainText(
      "Enter a valid postcode",
    );
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("shows an error when the postcode is invalid", async ({
    page,
    request,
  }) => {
    await page.getByLabel("Postcode").fill("not a postcode");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.locator(".govuk-error-message")).toContainText(
      "Enter a valid postcode",
    );
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("saves a normalised postcode and continues to costs", async ({
    page,
    request,
  }) => {
    await page.getByLabel("Postcode").fill("sw1a1aa");
    await page.getByRole("button", { name: "Continue" }).click();

    const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

    expect(draft.expertDetails?.expertPostcode).toBe("SW1A 1AA");
    await expect(page).toHaveURL("/prior-authority/expert/costs");
  });

  test("shows the error page when saving fails", async ({ page }) => {
    await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
      await page.getByLabel("Postcode").fill("sw1a1aa");
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Sorry, there is a problem with the service",
        }),
      ).toBeVisible();
      await expect(page).toHaveURL("/prior-authority/expert/postcode");
    });
  });
});
