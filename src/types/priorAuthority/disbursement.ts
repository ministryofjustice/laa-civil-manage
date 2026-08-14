import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";

export interface PriorAuthorityDisbursement {
  disbursementPurpose?: string;
  disbursementAmount?: string;
  justification?: string;
  uploadedDocuments?: UploadedDocument[];
}
