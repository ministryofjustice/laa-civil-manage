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

const PRIOR_AUTHORITY_ID = buildResetPriorAuthorityId("counsel");

const JUSTIFICATION =
  "Specialised counsel is required to advise on a complex point of law.";

test.describe("Counsel justification page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "counsel");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/counsel/justification");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test("renders the heading and hint text", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Why is this application necessary?" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required",
      ),
    ).toBeVisible();
  });

  test("links back to the counsel type page", async ({ page }) => {
    await page.getByRole("link", { name: "Back", exact: true }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/type");
  });

  test("prefills the justification from the saved draft", async ({ page }) => {
    await stubDraftGet(PRIOR_AUTHORITY_ID, {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: "COUNSEL",
      justification: JUSTIFICATION,
    });

    await page.goto("/prior-authority/counsel/justification");

    await expect(page.locator("#justification")).toHaveValue(JUSTIFICATION);
  });

  test("shows an error when the justification is missing", async ({
    page,
    request,
  }) => {
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/justification");
    await expect(
      page.getByRole("heading", { name: "There is a problem" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Enter the reason for requesting specialised Counsel.",
      }),
    ).toBeVisible();
    await expect(page.locator(".govuk-error-message")).toContainText(
      "Enter the reason for requesting specialised Counsel.",
    );
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("shows an error when the word limit is exceeded", async ({
    page,
    request,
  }) => {
    const tooManyWords = Array.from({ length: 501 }, () => "reason").join(" ");

    await page.locator("#justification").fill(tooManyWords);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/prior-authority/counsel/justification");
    await expect(
      page.getByRole("link", {
        name: "Justification must be 500 words or less",
      }),
    ).toBeVisible();
    await expect(page.locator("#justification-error")).toContainText(
      "Justification must be 500 words or less",
    );
    await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
  });

  test("saves the justification and continues to document upload", async ({
    page,
    request,
  }) => {
    await page.locator("#justification").fill(JUSTIFICATION);
    await page.getByRole("button", { name: "Continue" }).click();

    const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

    expect(draft.justification).toBe(JUSTIFICATION);
    await expect(page).toHaveURL("/prior-authority/counsel/document-upload");
  });

  test("shows the error page when saving fails", async ({ page }) => {
    await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
      await page.locator("#justification").fill(JUSTIFICATION);
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Sorry, there is a problem with the service",
        }),
      ).toBeVisible();
    });
  });
});
