import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.ts";
import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.ts";
import type { PriorAuthorityType } from "#src/types/priorAuthority/shared.ts";

import "express-session";

declare module "express-session" {
  interface SessionData {
    idToken: string;
    userId: string;
    userDisplayName: string;
    accessToken: string;
    originalUrl: string;
    csrfToken: string;
    priorAuthorityType?: PriorAuthorityType;
    priorAuthorityExpert?: Partial<PriorAuthorityExpert>;
    priorAuthorityCounsel?: Partial<PriorAuthorityCounsel>;
    draftId?: string;
  }
}
