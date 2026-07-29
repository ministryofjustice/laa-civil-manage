import type { ApplicationSummary } from "#src/types/applications.ts";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.ts";

import "express-session";

declare module "express-session" {
  interface SessionData {
    idToken: string;
    userId: string;
    userDisplayName: string;
    accessToken: string;
    originalUrl: string;
    csrfToken: string;
    priorAuthority?: PriorAuthority;
    application?: ApplicationSummary;
    draftId?: string;
    applicationsPage?: number;
  }
}
