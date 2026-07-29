import {
  getBackendRequests,
  resetWiremockJournal,
} from "#tests/playwright/helpers/wiremock.js";
import { test, expect } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

const DEV_APPLICATION_ID = "00000000-0000-0000-0000-000000000001";
const TEMP_EXPERT_POSTCODE = "SW1H 9AJ";
const DRAFT_ID = "DRAFT-1001";

// Full-shape draft body with every mapped field defaulted to null so
// individual tests only need to specify what they expect to have been set.
const emptyExpertDraftBody = {
  applicationId: DEV_APPLICATION_ID,
  priorAuthorityType: null,
  counselType: null,
  expertType: null,
  expertFullName: null,
  expertPostcode: TEMP_EXPERT_POSTCODE,
  uploadedDocuments: null,
  expertBasedInLondon: null,
  billingType: null,
  hourlyRate: null,
  timeHours: null,
  timeMinutes: null,
  totalAmount: null,
  justification: null,
};

async function selectPriorAuthorityType(
  page: Page,
  type: "Expert" | "Counsel",
): Promise<void> {
  await page.goto("/applications/manage/APP-1001");
  await page.getByRole("link", { name: "Apply for prior authority" }).click();
  await page
    .getByRole("link", {
      name: type === "Expert" ? "Apply for an expert" : "Apply for counsel",
    })
    .click();
}

async function assertSingleDraftPost(
  request: APIRequestContext,
  expected: Record<string, unknown>,
): Promise<void> {
  const posts = await getBackendRequests(request, {
    method: "POST",
    urlPath: "/prior-authority/drafts",
  });
  expect(posts).toHaveLength(1);
  expect(posts[0]).toEqual(expected);
}

test.describe("Save to drafts", () => {
  test("expert flow posts a draft to backend with the expert data entered so far", async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await selectPriorAuthorityType(page, "Expert");

      // Fill part of the expert journey
      await page.getByRole("button", { name: "Start" }).click();
      await expect(page).toHaveURL(
        "/prior-authority/expert/is-guideline-rate-exceeded",
      );
      await page.getByRole("radio", { name: "Yes" }).check();
      await page.getByRole("button", { name: "Save and continue" }).click();

      await expect(page).toHaveURL("/prior-authority/expert/based-in-london");
      await page.getByRole("radio", { name: "Yes" }).check();

      await resetWiremockJournal(request);

      await page
        .getByRole("button", { name: "Save and come back later" })
        .click();
      await expect(page).toHaveURL("/applications");

      await assertSingleDraftPost(request, {
        ...emptyExpertDraftBody,
        priorAuthorityType: "EXPERT",
        expertBasedInLondon: true,
      });
    } finally {
      await context.close();
    }
  });

  test("counsel flow posts a draft to backend with the counsel justification", async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await selectPriorAuthorityType(page, "Counsel");

      await page.goto("/prior-authority/counsel/justification");
      await page
        .locator("#justification")
        .fill("This counsel is necessary to support the case.");

      await resetWiremockJournal(request);

      await page
        .getByRole("button", { name: "Save and come back later" })
        .click();
      await expect(page).toHaveURL("/applications");

      await assertSingleDraftPost(request, {
        ...emptyExpertDraftBody,
        priorAuthorityType: "COUNSEL",
        justification: "This counsel is necessary to support the case.",
      });
    } finally {
      await context.close();
    }
  });

  test("saving again PUTs the merged draft to the existing draft id", async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // First save — creates the draft (POST) and stores draftId in session
      await selectPriorAuthorityType(page, "Expert");
      await page.getByRole("button", { name: "Start" }).click();
      await page.getByRole("radio", { name: "Yes" }).check();
      await page
        .getByRole("button", { name: "Save and come back later" })
        .click();
      await expect(page).toHaveURL("/applications");

      // Now navigate back into the journey and add more data
      await page.goto("/prior-authority/expert/based-in-london");
      await page.getByRole("radio", { name: "No" }).check();

      await resetWiremockJournal(request);

      // Second save — should PUT to the existing draft id
      await page
        .getByRole("button", { name: "Save and come back later" })
        .click();
      await expect(page).toHaveURL("/applications");

      const puts = await getBackendRequests<{
        applicationId: string;
        priorAuthorityType: string;
        expertBasedInLondon: boolean | null;
      }>(request, {
        method: "PUT",
        urlPath: `/prior-authority/drafts/${DRAFT_ID}`,
      });

      expect(puts).toHaveLength(1);
      expect(puts[0]).toEqual({
        ...emptyExpertDraftBody,
        priorAuthorityType: "EXPERT",
        expertBasedInLondon: false,
      });

      // And no new POST should have happened during the second save
      const posts = await getBackendRequests(request, {
        method: "POST",
        urlPath: "/prior-authority/drafts",
      });
      expect(posts).toHaveLength(0);
    } finally {
      await context.close();
    }
  });
});
