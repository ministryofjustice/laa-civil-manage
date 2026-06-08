export type DraftSourceSystem = "laa-civil-manage";
export type DraftType = "PRIOR_AUTHORITY";
export type DraftApplicationType = "EXPERT" | "DISBURSEMENT" | "COUNSEL";
export type DraftBillingType = "HOURLY" | "FLAT_RATE";

export interface DraftDocument {
  fileName: string;
}

export interface DraftEstimatedTime {
  hours: number;
  minutes: number;
}

export interface DraftBody {
  applicationId: string;
  type?: DraftApplicationType | null;
  expertType?: string | null;
  expertFullName?: string | null;
  uploadedDocuments?: DraftDocument[] | null;
  guidelineRatesExceeded?: boolean | null;
  expertBasedInLondon?: boolean | null;
  billingType?: DraftBillingType | null;
  hourlyRate?: number | null;
  estimatedTime?: DraftEstimatedTime | null;
  totalAmount?: number | null;
  fixedRateTotalAmount?: number | null;
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
