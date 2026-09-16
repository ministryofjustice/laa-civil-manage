import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import {
  getSessionIdFromPage,
  getSharedRedisClient,
  resetPriorAuthoritySession,
} from "#tests/playwright/helpers/resetSession.js";

test.describe("CSRF token error handling (expired session)", () => {
  test.beforeEach(async ({ page }) => {
    await resetPriorAuthoritySession(page);
    await page.goto("/applications/manage/APP-1001");
    await page.goto("/prior-authority/counsel");
  });

  const submitFormWithStaleCsrfToken = async (page: Page): Promise<void> => {
    await page.locator('input[name="_csrf"]').evaluate((input) => {
      (input as HTMLInputElement).value = "this-token-is-not-valid";
    });

    await page.getByRole("button", { name: "Start" }).click();
  };

  test("submitting a form with a stale CSRF token redirects to the session timeout page", async ({
    page,
  }) => {
    await submitFormWithStaleCsrfToken(page);

    await expect(page).toHaveURL("/session-timeout");
  });

  test("session timeout page shows the correct heading and sign in button", async ({
    page,
  }) => {
    await submitFormWithStaleCsrfToken(page);

    await expect(
      page.getByRole("heading", {
        name: "For your security, we signed you out",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("This is because you were inactive for too long."),
    ).toBeVisible();

    const signInButton = page.getByRole("link", { name: "Sign in" });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toHaveAttribute("href", "/auth/login");
  });

  test("destroys the underlying session record so it cannot be reused", async ({
    page,
  }) => {
    const sessionId = await getSessionIdFromPage(page);
    expect(sessionId).toBeDefined();

    await submitFormWithStaleCsrfToken(page);
    await expect(page).toHaveURL("/session-timeout");

    const redisClient = await getSharedRedisClient();
    const storedSession = await redisClient.get(`sess:${sessionId}`);

    expect(storedSession).toBeNull();
  });
});
