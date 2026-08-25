import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthorityDisbursement } from "#src/types/priorAuthority/disbursement.js";
import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.js";

export type PriorAuthorityType = "Expert" | "Disbursement" | "Counsel";

export interface UploadedDocument {
  fileName: string;
  originalFileName: string;
  category?: string;
  // Held here (base64) until the real backend supports document storage; not sent on submit.
  mimeType?: string;
  size?: number;
  content?: string;
}

export interface PriorAuthority {
  type?: PriorAuthorityType;
  expert: PriorAuthorityExpert;
  counsel: PriorAuthorityCounsel;
  disbursement: PriorAuthorityDisbursement;
}
