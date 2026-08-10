import type { BrowserContext } from "@playwright/test";
import { sign } from "cookie-signature";
import dotenv from "dotenv";
import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "#tests/playwright/helpers/redisConfig.js";

dotenv.config();

const SESSION_ID_PREFIX = "pw-confirmation";
const THIRTY_MINUTES_IN_SECONDS = 60 * 30;
const DEFAULT_SESSION_NAME = "connect.sid";
const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_APPLICATION_ID = "APP-DYNAMIC-ID";

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
  application?: SessionApplication;
  priorAuthority?: {
    type: "Expert";
    expert: {
      expertType: string;
      fullName: string;
      expertBasedInLondon: "Yes" | "No";
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
  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret === undefined || sessionSecret === "") {
    throw new Error("SESSION_SECRET must be set to seed Playwright sessions");
  }

  const sessionName = process.env.SESSION_NAME ?? DEFAULT_SESSION_NAME;
  const sessionId = `${SESSION_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await redisClient.set(`sess:${sessionId}`, JSON.stringify(sessionPayload), {
    EX: THIRTY_MINUTES_IN_SECONDS,
  });

  await addSessionCookies(context, sessionId, sessionSecret, sessionName);
};

export const connectSessionRedis = async (): Promise<RedisClientType> => {
  const redisClient = createClient({ url: REDIS_URL });
  await redisClient.connect();
  return redisClient;
};

export async function seedConfirmationSession(
  redisClient: RedisClientType,
  context: BrowserContext,
  {
    laaReference,
    applicationId = DEFAULT_APPLICATION_ID,
  }: SeedConfirmationSessionOptions,
): Promise<void> {
  await seedSession(redisClient, context, {
    cookie: {
      originalMaxAge: THIRTY_MINUTES_IN_SECONDS * 1000,
      expires: new Date(Date.now() + THIRTY_MINUTES_IN_SECONDS * 1000),
      secure: false,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    },
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
    cookie: {
      originalMaxAge: THIRTY_MINUTES_IN_SECONDS * 1000,
      expires: new Date(Date.now() + THIRTY_MINUTES_IN_SECONDS * 1000),
      secure: false,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    },
    application: buildApplication(applicationId, laaReference),
    priorAuthority: {
      type: "Expert",
      expert: {
        expertType: "Dentist",
        fullName: "John Doe",
        expertBasedInLondon: "Yes",
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
