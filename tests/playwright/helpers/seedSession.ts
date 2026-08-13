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
} from "#tests/playwright/helpers/resetSession.js";
import {
  TEST_SESSION_NAME,
  TEST_SESSION_SECRET,
} from "#tests/playwright/helpers/testSessionConfig.js";

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
  priorAuthority?: {
    type: "Expert";
    expert: {
      expertType: string;
      fullName: string;
      expertPostcode?: string;
      billingType: "Hourly" | "Fixed rate";
      fixedRateTotalAmount?: string;
      hourlyRate?: string;
      estimatedTime?: {
        estimatedHours: string;
        estimatedMinutes: string;
      };
      totalAmount?: string;
      costsSharedWithOtherParties?: "Yes" | "No";
      numberOfParties?: string;
      apportionedAmount?: string;
      justification: string;
      uploadedDocuments: Array<{
        fileName: string;
        originalFileName: string;
      }>;
    };
    counsel: Record<string, never>;
  };
}

interface SeedConfirmationSessionOptions {
  laaReference: string;
  applicationId?: string;
}

interface SeedCheckYourAnswersSessionOptions {
  applicationId?: string;
  laaReference?: string;
  costsSharedWithOtherParties?: "Yes" | "No";
  numberOfParties?: string;
  apportionedAmount?: string;
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

export async function seedCheckYourAnswersSession(
  redisClient: RedisClientType,
  context: BrowserContext,
  {
    applicationId = DEFAULT_APPLICATION_ID,
    laaReference = "LAA-445566",
    costsSharedWithOtherParties,
    numberOfParties,
    apportionedAmount,
  }: SeedCheckYourAnswersSessionOptions = {},
): Promise<void> {
  await seedSession(redisClient, context, {
    ...buildBaseSessionFields(),
    application: buildApplication(applicationId, laaReference),
    priorAuthority: {
      type: "Expert",
      expert: {
        expertType: "Dentist",
        fullName: "John Doe",
        expertPostcode: "SW1H 9AJ",
        billingType: "Fixed rate",
        fixedRateTotalAmount: "200",
        ...(costsSharedWithOtherParties === undefined
          ? {}
          : { costsSharedWithOtherParties }),
        ...(numberOfParties === undefined ? {} : { numberOfParties }),
        ...(apportionedAmount === undefined ? {} : { apportionedAmount }),
        justification: "Case requires expert support.",
        uploadedDocuments: [
          {
            fileName: "11111111-1111-1111-1111-111111111111",
            originalFileName: "test-document.pdf",
          },
        ],
      },
      counsel: {},
    },
  });
}
