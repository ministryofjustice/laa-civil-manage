import type { counselType } from "#src/types/priorAuthority/counsel.js";

export type DraftSourceSystem = "laa-civil-manage";
export type DraftType = "PRIOR_AUTHORITY";
export type DraftApplicationType = "EXPERT" | "DISBURSEMENT" | "COUNSEL";
export type DraftBillingType = "HOURLY" | "FIXED_RATE";

export interface DraftDocument {
  fileName: string;
}

export interface DraftEstimatedTime {
  hours: number;
  minutes: number;
}

export interface DraftBody {
  applicationId: string;
  priorAuthorityType?: DraftApplicationType | null;
  counselType?: counselType | null;
  expertType?: string | null;
  expertFullName?: string | null;
  expertPostcode?: string | null;
  uploadedDocuments?: DraftDocument[] | null;
  billingType?: DraftBillingType | null;
  hourlyRate?: number | null;
  timeHours?: number | null;
  timeMinutes?: number | null;
  totalAmount?: number | null;
  justification?: string | null;
}

export interface DraftPostRequest {
  applicationId: string;
  draft: DraftBody;
}

export interface DraftPostResponse {
  draftId: string;
}

export interface DraftGetResponse {
  draftId: string;
  draftType: DraftType;
  timestamp: string;
  draft: DraftBody;
}
