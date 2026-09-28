import type { ApplicationSummary } from "#src/types/applications.ts";

import "express-session";

declare module "express-session" {
  interface SessionData {
    idToken: string;
    userId: string;
    userDisplayName: string;
    accessToken: string;
    homeAccountId: string;
    originalUrl: string;
    csrfToken: string;
    createdAt?: number;
    priorAuthorityId?: string;
    application?: ApplicationSummary;
    applicationsPage?: number;
  }
}
