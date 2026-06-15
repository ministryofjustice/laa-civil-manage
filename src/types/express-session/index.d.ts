import type { PriorAuthority } from "#src/types/priorAuthority.ts";

import "express-session";

declare module "express-session" {
  interface SessionData {
    idToken: string;
    userId: string;
    userDisplayName: string;
    accessToken: string;
    originalUrl: string;
    csrfToken: string;
    priorAuthority?: Partial<PriorAuthority>;
    draftId?: string | null;
  }
}
