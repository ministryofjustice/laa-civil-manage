import type { PriorAuthority } from "#src/types/prior-authority.ts";
import "express-session";

declare module "express-session" {
  interface SessionData {
    idToken: string;
    userId: string;
    userDisplayName: string;
    accessToken: string;
    originalUrl: string;
    priorAuthority: Partial<PriorAuthority>;
  }
}

export default session;
