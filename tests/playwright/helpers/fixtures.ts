import { test as base } from "@playwright/test";
import { createClient, type RedisClientType } from "redis";
import { logger } from "#src/utils/logger.js";
import { REDIS_URL } from "#tests/playwright/helpers/redisConfig.js";
import { resetPriorAuthoritySession } from "#tests/playwright/helpers/resetSession.js";

type TestFixtures = Record<string, never>;

interface WorkerFixtures {
  workerRedisClient: RedisClientType;
}

interface AppLogger {
  error: (message: string, ...optionalParams: unknown[]) => void;
}

const appLogger = logger as unknown as AppLogger;

/**
 * Drop-in replacement for `@playwright/test`'s `test` that automatically
 * resets the prior-authority journey state before every test.
 *
 * The whole suite shares a single authenticated session (via
 * `storageState`), so without this, form/application data written by one
 * test would otherwise leak into the next. See resetSession.ts for details.
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  workerRedisClient: [
    // eslint-disable-next-line no-empty-pattern -- Playwright requires object destructuring pattern for fixture dependency reflection
    async ({}, use) => {
      const redisClient = createClient({ url: REDIS_URL });

      // Prevent uncaught 'error' events from crashing the Playwright worker
      redisClient.on("error", (err) => {
        appLogger.error("Playwright Worker Redis Error:", err);
      });

      await redisClient.connect();

      try {
        await use(redisClient);
      } finally {
        // Gracefully quit Redis; fallback to forceful destroy if socket hangs
        await redisClient.quit().catch(() => {
          redisClient.destroy();
        });
      }
    },
    { scope: "worker" },
  ],

  page: async ({ page, workerRedisClient }, use) => {
    await resetPriorAuthoritySession(workerRedisClient, page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
