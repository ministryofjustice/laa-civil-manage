import type { Page } from "@playwright/test";
import { sign, unsign } from "cookie-signature";
import crypto from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "#tests/playwright/helpers/redisConfig.js";
import {
  TEST_SESSION_NAME,
  TEST_SESSION_SECRET,
} from "#tests/playwright/helpers/testSessionConfig.js";
import {
  clearRegisteredStubs,
  stubDraftGetWithUploadedDocuments,
  stubPriorAuthorityDraftGet,
} from "#tests/playwright/helpers/wiremock.js";
import type {
  PriorAuthorityApplicationType,
  PriorAuthorityUploadedDocument,
} from "#src/types/priorAuthority/api.js";

export const RESET_APPLICATION_ID = "00000000-0000-0000-0000-000000000001";

export type PriorAuthoritySection = "expert" | "counsel" | "disbursement";

const DRAFT_TYPES: Record<
  PriorAuthoritySection,
  PriorAuthorityApplicationType
> = {
  expert: "EXPERT",
  counsel: "COUNSEL",
  disbursement: "DISBURSEMENT",
};

export interface PersistedDocument {
  originalFileName: string;
  category?: string;
}

export const buildResetPriorAuthorityId = (
  section: PriorAuthoritySection,
): string => `PA-PLAYWRIGHT-RESET-${section}`;

export async function stubPersistedDocuments(
  section: PriorAuthoritySection,
  documents: PersistedDocument[],
): Promise<void> {
  const priorAuthorityId = buildResetPriorAuthorityId(section);
  const uploadedDocuments: PriorAuthorityUploadedDocument[] = documents.map(
    (document, index) => ({
      documentId: `document-${index + 1}`,
      documentType: document.category ?? null,
      fileName: document.originalFileName,
      fileType: "pdf",
      mediaType: "application/pdf",
      size: 1024,
      uploadedAt: "2024-03-24T08:00:00Z",
      sourceService: "CIVIL_MANAGE",
    }),
  );
  await stubDraftGetWithUploadedDocuments(
    priorAuthorityId,
    {
      applicationId: RESET_APPLICATION_ID,
      priorAuthorityType: DRAFT_TYPES[section],
    },
    uploadedDocuments,
  );
}

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
 * Resets the prior-authority journey state on the session currently
 * attached to `page`, while leaving the authentication fields
 * (idToken/accessToken/userId/csrfToken/etc.) intact.
 */
export async function resetPriorAuthoritySession(
  page: Page,
  section?: PriorAuthoritySection,
): Promise<void> {
  await clearRegisteredStubs();
  const currentSessionId = await getSessionIdFromPage(page);

  if (currentSessionId === undefined) {
    // No session yet (e.g. first navigation of the test hasn't happened).
    return;
  }

  const redisClient = await getSharedRedisClient();
  const currentRedisKey = `sess:${currentSessionId}`;
  const raw = await redisClient.get(currentRedisKey);

  if (raw === null) {
    return;
  }

  const session = JSON.parse(raw) as Record<string, unknown>;
  delete session.application;
  delete session.uploadedDocuments;

  if (section === undefined) {
    delete session.priorAuthorityId;
  } else {
    const priorAuthorityId = buildResetPriorAuthorityId(section);
    await stubPriorAuthorityDraftGet(priorAuthorityId, {
      priorAuthorityId,
      status: "PENDING",
      draft: {
        applicationId: RESET_APPLICATION_ID,
        priorAuthorityType: DRAFT_TYPES[section],
      },
    });
    session.priorAuthorityId = priorAuthorityId;
  }

  const isolatedSessionId = crypto.randomUUID();
  const isolatedRedisKey = `sess:${isolatedSessionId}`;

  const remainingTtlMs = await redisClient.pTTL(currentRedisKey);
  await redisClient.set(
    isolatedRedisKey,
    JSON.stringify(session),
    remainingTtlMs > 0 ? { PX: remainingTtlMs } : undefined,
  );

  const signedSessionId = `s:${sign(isolatedSessionId, TEST_SESSION_SECRET)}`;
  await page.context().addCookies([
    {
      name: TEST_SESSION_NAME,
      value: encodeURIComponent(signedSessionId),
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
}
