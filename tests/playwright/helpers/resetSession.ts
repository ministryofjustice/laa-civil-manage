import type { Page } from "@playwright/test";
import { unsign } from "cookie-signature";
import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "#tests/playwright/helpers/redisConfig.js";
import {
  TEST_SESSION_NAME,
  TEST_SESSION_SECRET,
} from "#tests/playwright/helpers/testSessionConfig.js";

type UnsignFunction = (val: string, secret: string) => string | false;

const unsignFn = unsign as unknown as UnsignFunction;

let sharedRedisClient: RedisClientType | undefined;

export async function getSharedRedisClient(): Promise<RedisClientType> {
  sharedRedisClient ??= createClient({ url: REDIS_URL });
  if (!sharedRedisClient.isOpen) {
    await sharedRedisClient.connect();
  }
  return sharedRedisClient;
}

/**
 * Extracts the session ID from the session cookie already attached to
 * `page` (e.g. from `storageState`), verifying its signature. Returns
 * `undefined` if there's no session cookie yet, or if it fails to verify.
 */
export async function getSessionIdFromPage(
  page: Page,
): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(
    (cookie) => cookie.name === TEST_SESSION_NAME,
  );

  if (sessionCookie === undefined) {
    return undefined;
  }

  const rawValue = decodeURIComponent(sessionCookie.value);
  if (!rawValue.startsWith("s:")) {
    return undefined;
  }

  const sessionId = unsignFn(rawValue.slice(2), TEST_SESSION_SECRET);
  return sessionId === false ? undefined : sessionId;
}

/**
 * Resets the prior-authority journey state
 * on the session currently attached to `page`, while leaving the
 * authentication fields (idToken/accessToken/userId/csrfToken/etc.) intact.
 **
 */
export async function resetPriorAuthoritySession(page: Page): Promise<void> {
  const sessionId = await getSessionIdFromPage(page);
  if (sessionId === undefined) {
    // No session yet (e.g. first navigation of the test hasn't happened).
    return;
  }

  const redisClient = await getSharedRedisClient();
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
