import type { ApplicationSummary } from "#src/types/applications.ts";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.ts";

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
    // Pointer to the backend-held prior-authority draft; the draft data itself is no longer stored in session.
    priorAuthorityId?: string;
    // Uploaded-document metadata/content is still session-held until the backend exposes document endpoints.
    uploadedDocuments?: Partial<
      Record<"expert" | "counsel" | "disbursement", UploadedDocument[]>
    >;
    application?: ApplicationSummary;
    applicationsPage?: number;
  }
}
