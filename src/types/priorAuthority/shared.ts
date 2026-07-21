import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.js";

export type PriorAuthorityType = "Expert" | "Disbursement" | "Counsel";

export interface UploadedDocument {
  fileName: string;
  originalFileName: string;
}

export interface PriorAuthority {
  type?: PriorAuthorityType;
  expert: PriorAuthorityExpert;
  counsel: PriorAuthorityCounsel;
}
