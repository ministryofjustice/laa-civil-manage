import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthorityDisbursement } from "#src/types/priorAuthority/disbursement.js";
import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.js";

export type PriorAuthorityType = "Expert" | "Disbursement" | "Counsel";

export interface UploadedDocument {
  documentId?: string;
  fileName: string;
  originalFileName: string;
  category?: string;
  mimeType?: string;
  size?: number;
}

export interface PriorAuthority {
  type?: PriorAuthorityType;
  expert: PriorAuthorityExpert;
  counsel: PriorAuthorityCounsel;
  disbursement: PriorAuthorityDisbursement;
  uploadedDocuments?: UploadedDocument[];
}
