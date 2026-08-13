import type { Page } from "@playwright/test";
import { unsign } from "cookie-signature";
import type { RedisClientType } from "redis";
import {
  TEST_SESSION_NAME,
  TEST_SESSION_SECRET,
} from "#tests/playwright/helpers/testSessionConfig.js";

type UnsignFunction = (val: string, secret: string) => string | false;

const unsignFn = unsign as unknown as UnsignFunction;

/**
 * Resets the prior-authority journey state (and any submitted application)
 * on the session currently attached to `page`, while leaving the
 * authentication fields (idToken/accessToken/userId/csrfToken/etc.) intact.
 *
 * The whole Playwright suite reuses a single logged-in session (via
 * `storageState`) so it doesn't have to run the full OAuth login flow for
 * every test. Without this reset, prior-authority form data written by one
 * test (e.g. an uploaded document, a selected counsel type, a submitted
 * application) leaks into the next test that shares the same session,
 * breaking tests that assert on a "fresh" journey.
 */
export async function resetPriorAuthoritySession(
  redisClient: RedisClientType,
  page: Page,
): Promise<void> {
  const sessionName = TEST_SESSION_NAME;
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === sessionName);

  if (sessionCookie === undefined) {
    // No session yet (e.g. first navigation of the test hasn't happened).
    return;
  }

  const rawValue = decodeURIComponent(sessionCookie.value);
  if (!rawValue.startsWith("s:")) {
    return;
  }

  const sessionId = unsignFn(rawValue.slice(2), TEST_SESSION_SECRET);
  if (sessionId === false) {
    return;
  }

  const redisKey = `sess:${sessionId}`;
  const raw = await redisClient.get(redisKey);
  if (raw === null) {
    return;
  }

  const session = JSON.parse(raw) as Record<string, unknown>;
  delete session.application;
  session.priorAuthority = { expert: {}, counsel: {}, disbursement: {} };

  await redisClient.set(redisKey, JSON.stringify(session), { KEEPTTL: true });
}
