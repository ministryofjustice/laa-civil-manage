import { test, expect } from "@playwright/test";

/**
 * Session Token Storage security tests.
 *
 * Verifies
 * - Session tokens are not stored in localStorage, sessionStorage, or URLs
 * - Session cookie carries HttpOnly
 * - Session cookie carries SameSite=Lax
 * - Session cookie carries Path=/ (pattern compliance)
 * - Session cookie carries Max-Age (target requirement)
 * - Session cookie uses the configured application name, not connect.sid
 * - Session cookie value is an opaque token, not a JWT
 *
 * Note: The Secure flag is intentionally false in this test environment
 * (HTTP + SKIP_AUTH).
 */

const SESSION_COOKIE_NAME = "sessionId";

test.describe("Session token storage security", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("session token does not appear in the URL", ({ page }) => {
    const url = page.url();
    expect(url).not.toContain("token=");
    expect(url).not.toContain(`${SESSION_COOKIE_NAME}=`);
    expect(url).not.toContain("sessionId=");
  });

  test("session token is not stored in localStorage", async ({ page }) => {
    const keys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(keys).not.toContain("token");
    expect(keys).not.toContain("sessionId");
    expect(keys).not.toContain("accessToken");
    expect(keys).not.toContain("idToken");
  });

  test("session token is not stored in sessionStorage", async ({ page }) => {
    const keys = await page.evaluate(() => Object.keys(window.sessionStorage));
    expect(keys).not.toContain("token");
    expect(keys).not.toContain("sessionId");
    expect(keys).not.toContain("accessToken");
    expect(keys).not.toContain("idToken");
  });

  test("session cookie exists with the configured application name (not connect.sid)", async ({
    context,
  }) => {
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);
    const defaultCookie = cookies.find((c) => c.name === "connect.sid");

    expect(sessionCookie).toBeDefined();
    expect(defaultCookie).toBeUndefined();
  });

  test("session cookie is HttpOnly — inaccessible to client-side scripts", async ({
    context,
  }) => {
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

    expect(sessionCookie?.httpOnly).toBe(true);
  });

  test("session cookie has SameSite=Lax to mitigate CSRF", async ({
    context,
  }) => {
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

    expect(sessionCookie?.sameSite).toBe("Lax");
  });

  test("session cookie is scoped to Path=/", async ({ context }) => {
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

    expect(sessionCookie?.path).toBe("/");
  });

  test("session cookie has an explicit Max-Age (target requirement)", async ({
    context,
  }) => {
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

    expect(sessionCookie?.expires).toBeGreaterThan(0);
  });

  test("session cookie value is an opaque token, not a readable JWT", async ({
    context,
  }) => {
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

    const isJwt = sessionCookie?.value.split(".").length === 3;
    expect(isJwt).toBe(false);
  });
});
