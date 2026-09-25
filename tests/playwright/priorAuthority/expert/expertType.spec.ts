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

const SERVICE_COMBOBOX = "Service required";

const draftWithExpertType = (
  expertType: string,
): Parameters<typeof stubDraftGet>[1] => ({
  applicationId: RESET_APPLICATION_ID,
  priorAuthorityType: "EXPERT",
  expertDetails: { expertType },
});

test.describe("Service required page", () => {
  test.beforeEach(async ({ page, request }) => {
    await resetPriorAuthoritySession(page, "expert");
    await resetWiremockJournal(request);
    await page.goto("/prior-authority/expert/expert-type");
  });

  test.afterEach(async () => {
    await clearRegisteredStubs();
  });

  test.describe("page content", () => {
    test("renders the heading, hint and service combobox", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: SERVICE_COMBOBOX }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "If you are unable to find the service you require, select Other",
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("combobox", { name: SERVICE_COMBOBOX }),
      ).toBeVisible();
    });

    test("lists matching expert types in the dropdown", async ({ page }) => {
      await page
        .getByRole("combobox", { name: SERVICE_COMBOBOX })
        .fill("child");

      await expect(
        page.getByRole("option", { name: "Child Psychiatrist" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Child Psychologist" }),
      ).toBeVisible();
    });

    test("links back to the expert landing page", async ({ page }) => {
      // The landing page bounces to /applications unless an application is in session.
      await page.goto("/applications/manage/APP-1001");
      await page.goto("/prior-authority/expert/expert-type");

      await page.getByRole("link", { name: "Back", exact: true }).click();

      await expect(page).toHaveURL("/prior-authority/expert");
    });
  });

  test.describe("prefill", () => {
    test("prefills the selected service from the saved draft", async ({
      page,
    }) => {
      await stubDraftGet(PRIOR_AUTHORITY_ID, draftWithExpertType("Dentist"));

      await page.goto("/prior-authority/expert/expert-type");

      await expect(
        page.getByRole("combobox", { name: SERVICE_COMBOBOX }),
      ).toHaveValue("Dentist");
    });

    // An unlisted service is how "Other" survives a round trip - expertTypeIsOther is never persisted.
    test("selects Other when the saved draft holds an unlisted service", async ({
      page,
    }) => {
      await stubDraftGet(
        PRIOR_AUTHORITY_ID,
        draftWithExpertType("Balloon artist"),
      );

      await page.goto("/prior-authority/expert/expert-type");

      await expect(
        page.getByRole("combobox", { name: SERVICE_COMBOBOX }),
      ).toHaveValue("Other");
    });
  });

  test.describe("validation", () => {
    test("shows an error when no service is selected", async ({
      page,
      request,
    }) => {
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(
        page.getByRole("heading", { name: "There is a problem" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: "Search for and select an expert type",
        }),
      ).toBeVisible();
      await expect(
        page.locator("#PriorAuthorityExpertType-error"),
      ).toContainText("Search for and select an expert type");
      await expectNoDraftPut(request, PRIOR_AUTHORITY_ID);
    });

    test("focuses the combobox when the error summary link is clicked", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Continue" }).click();
      await page
        .getByRole("link", { name: "Search for and select an expert type" })
        .click();

      await expect(
        page.getByRole("combobox", { name: SERVICE_COMBOBOX }),
      ).toBeFocused();
    });

    test("redirects to the session timeout page when the CSRF token is missing", async ({
      page,
    }) => {
      await page.locator('input[name="_csrf"]').evaluate((node) => {
        (node as HTMLInputElement).value = "";
      });
      await page.getByRole("combobox", { name: SERVICE_COMBOBOX }).fill("Den");
      await page.getByRole("option", { name: "Dentist" }).click();
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page).toHaveURL("/session-timeout");
      await expect(
        page.getByRole("heading", {
          name: "We have signed you out",
        }),
      ).toBeVisible();
    });
  });

  test.describe("persistence", () => {
    test("saves a listed service and continues to the provider name page", async ({
      page,
      request,
    }) => {
      await page.getByRole("combobox", { name: SERVICE_COMBOBOX }).fill("Den");
      await page.getByRole("option", { name: "Dentist" }).click();
      await page.getByRole("button", { name: "Continue" }).click();

      const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

      expect(draft.expertDetails?.expertType).toBe("Dentist");
      await expect(page).toHaveURL("/prior-authority/expert/provider-name");
    });

    test("continues to the service type page when Other is selected", async ({
      page,
      request,
    }) => {
      const combobox = page.getByRole("combobox", { name: SERVICE_COMBOBOX });
      await combobox.fill("Other");
      await page.getByRole("option", { name: "Other", exact: true }).click();
      await page.getByRole("button", { name: "Continue" }).click();

      const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

      expect(draft.expertDetails?.expertType).toBeUndefined();
      await expect(page).toHaveURL("/prior-authority/expert/other-expert-type");
    });

    // No redirect assertion: the GET stub still returns the old service, so the
    // service type page would bounce straight on to the provider name page.
    test("clears a previously saved service when Other is selected", async ({
      page,
      request,
    }) => {
      await stubDraftGet(PRIOR_AUTHORITY_ID, draftWithExpertType("Dentist"));
      await page.goto("/prior-authority/expert/expert-type");

      const combobox = page.getByRole("combobox", { name: SERVICE_COMBOBOX });
      await combobox.fill("Other");
      await page.getByRole("option", { name: "Other", exact: true }).click();
      await expect(combobox).toHaveValue("Other");
      await page.getByRole("button", { name: "Continue" }).click();

      const draft = await expectDraftPut(request, PRIOR_AUTHORITY_ID);

      expect(draft.expertDetails?.expertType).toBeUndefined();
    });

    test("shows the error page when saving fails", async ({ page }) => {
      await withFailingDraftPut(PRIOR_AUTHORITY_ID, 500, async () => {
        await page
          .getByRole("combobox", { name: SERVICE_COMBOBOX })
          .fill("Den");
        await page.getByRole("option", { name: "Dentist" }).click();
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
