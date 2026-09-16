import fs from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "@playwright/test";
import { sign } from "cookie-signature";
import dotenv from "dotenv";
import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "#tests/playwright/helpers/redisConfig.js";
import {
  getSessionIdFromPage,
  getSharedRedisClient,
  buildResetPriorAuthorityId,
  type PriorAuthoritySection,
} from "#tests/playwright/helpers/resetSession.js";
import {
  TEST_SESSION_NAME,
  TEST_SESSION_SECRET,
} from "#tests/playwright/helpers/testSessionConfig.js";
import { stubPriorAuthorityDraftGet } from "#tests/playwright/helpers/wiremock.js";
import type {
  PriorAuthorityDraftDto,
  PriorAuthorityUploadedDocument,
} from "#src/types/priorAuthority/api.js";

dotenv.config();

const SESSION_ID_PREFIX = "pw-confirmation";
const THIRTY_MINUTES_IN_SECONDS = 60 * 30;
const DEFAULT_SESSION_NAME = "connect.sid";
const DEFAULT_APP_URL = "http://127.0.0.1:3000";
const DEFAULT_APPLICATION_ID = "APP-DYNAMIC-ID";

interface EntraTokenMapping {
  response: {
    jsonBody: {
      access_token: string;
      id_token: string;
      account: { localAccountId: string; name: string };
    };
  };
}

const entraTokenMapping = JSON.parse(
  fs.readFileSync(
    path.resolve(process.cwd(), "tests/resources/wiremock/entra-token.json"),
    "utf8",
  ),
) as EntraTokenMapping;

const MOCK_AUTH = {
  idToken: entraTokenMapping.response.jsonBody.id_token,
  accessToken: entraTokenMapping.response.jsonBody.access_token,
  userId: entraTokenMapping.response.jsonBody.account.localAccountId,
  userDisplayName: entraTokenMapping.response.jsonBody.account.name,
};

interface SessionApplication {
  applicationId: string;
  status: string;
  submittedAt: string;
  clientFirstName: string;
  clientLastName: string;
  laaReference: string;
  matterType: string;
}

interface UploadedDocumentStub {
  fileName: string;
  originalFileName: string;
}

const toUploadedDocument = (
  document: UploadedDocumentStub,
): PriorAuthorityUploadedDocument => ({
  documentId: document.fileName,
  documentType: null,
  fileName: document.originalFileName,
  fileType: "pdf",
  mediaType: "application/pdf",
  size: 1024,
  uploadedAt: "2024-03-24T08:00:00Z",
  sourceService: "CIVIL_MANAGE",
});

interface SessionPayload {
  cookie: {
    originalMaxAge: number;
    expires: Date;
    secure: boolean;
    httpOnly: boolean;
    path: string;
    sameSite: string;
  };
  idToken: string;
  accessToken: string;
  userId: string;
  userDisplayName: string;
  createdAt: number;
  application?: SessionApplication;
  priorAuthorityId?: string;
  uploadedDocuments?: Partial<
    Record<PriorAuthoritySection, UploadedDocumentStub[]>
  >;
}

interface SeedConfirmationSessionOptions {
  laaReference: string;
  applicationId?: string;
}

interface SeedCheckYourAnswersSessionOptions {
  section: PriorAuthoritySection;
  draft: PriorAuthorityDraftDto;
  uploadedDocuments?: UploadedDocumentStub[];
  applicationId?: string;
  laaReference?: string;
}

const buildApplication = (
  applicationId: string,
  laaReference: string,
): SessionApplication => ({
  applicationId,
  status: "APPLICATION_SUBMITTED",
  submittedAt: new Date().toISOString(),
  clientFirstName: "Session",
  clientLastName: "Seeded",
  laaReference,
  matterType: "Seeded for Playwright",
});

const addSessionCookies = async (
  context: BrowserContext,
  sessionId: string,
  sessionSecret: string,
  sessionName: string,
): Promise<void> => {
  const signedSessionValue = `s:${sign(sessionId, sessionSecret)}`;
  const cookieNames = new Set<string>([DEFAULT_SESSION_NAME, sessionName]);

  await context.addCookies(
    Array.from(cookieNames).map((cookieName) => ({
      name: cookieName,
      value: signedSessionValue,
      url: DEFAULT_APP_URL,
      httpOnly: true,
      sameSite: "Lax" as const,
    })),
  );
};

const seedSession = async (
  redisClient: RedisClientType,
  context: BrowserContext,
  sessionPayload: SessionPayload,
): Promise<void> => {
  const sessionId = `${SESSION_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await redisClient.set(`sess:${sessionId}`, JSON.stringify(sessionPayload), {
    EX: THIRTY_MINUTES_IN_SECONDS,
  });

  await addSessionCookies(
    context,
    sessionId,
    TEST_SESSION_SECRET,
    TEST_SESSION_NAME,
  );
};

const buildBaseSessionFields = (): Pick<
  SessionPayload,
  | "cookie"
  | "idToken"
  | "accessToken"
  | "userId"
  | "userDisplayName"
  | "createdAt"
> => ({
  cookie: {
    originalMaxAge: THIRTY_MINUTES_IN_SECONDS * 1000,
    expires: new Date(Date.now() + THIRTY_MINUTES_IN_SECONDS * 1000),
    secure: false,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  },
  ...MOCK_AUTH,
  createdAt: Date.now(),
});

export const connectSessionRedis = async (): Promise<RedisClientType> => {
  const redisClient = createClient({ url: REDIS_URL });
  await redisClient.connect();
  return redisClient;
};

export async function patchSessionForPage(
  page: Page,
  patch: Partial<SessionPayload>,
): Promise<void> {
  const sessionId = await getSessionIdFromPage(page);
  if (sessionId === undefined) {
    throw new Error(
      "patchSessionForPage: no valid session cookie found on page",
    );
  }

  const redisClient = await getSharedRedisClient();
  const redisKey = `sess:${sessionId}`;
  const raw = await redisClient.get(redisKey);
  const existingSession = raw === null ? {} : (JSON.parse(raw) as object);

  await redisClient.set(
    redisKey,
    JSON.stringify({ ...existingSession, ...patch }),
    { KEEPTTL: true },
  );
}

export async function seedConfirmationSession(
  page: Page,
  {
    laaReference,
    applicationId = DEFAULT_APPLICATION_ID,
  }: SeedConfirmationSessionOptions,
): Promise<void> {
  await patchSessionForPage(page, {
    application: buildApplication(applicationId, laaReference),
  });
}

const DEFAULT_UPLOADED_DOCUMENTS: UploadedDocumentStub[] = [
  {
    fileName: "11111111-1111-1111-1111-111111111111",
    originalFileName: "test-document.pdf",
  },
];

/**
 * Seeds a session pointing at a stubbed, fully populated backend draft, so
 * check-your-answers specs do not have to walk the whole journey.
 */
export async function seedCheckYourAnswersSession(
  redisClient: RedisClientType,
  context: BrowserContext,
  {
    section,
    draft,
    uploadedDocuments = DEFAULT_UPLOADED_DOCUMENTS,
    applicationId = DEFAULT_APPLICATION_ID,
    laaReference = "LAA-445566",
  }: SeedCheckYourAnswersSessionOptions,
): Promise<void> {
  const priorAuthorityId = buildResetPriorAuthorityId(section);

  await stubPriorAuthorityDraftGet(priorAuthorityId, {
    priorAuthorityId,
    status: "PENDING",
    draft,
    uploadedDocuments: uploadedDocuments.map(toUploadedDocument),
  });

  await seedSession(redisClient, context, {
    ...buildBaseSessionFields(),
    application: buildApplication(applicationId, laaReference),
    priorAuthorityId,
  });
}
