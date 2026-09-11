export type PriorAuthorityApplicationType =
  "EXPERT" | "DISBURSEMENT" | "COUNSEL";
export type PriorAuthorityApplicationBillingType = "HOURLY" | "FIXED_RATE";

export interface PriorAuthorityApplicationTimeRequested {
  hours: number;
  minutes: number;
}

export interface PriorAuthorityApplicationApportionment {
  partiesSharingCosts: number;
  clientShareAmount: number;
}

// All fields below are optional: the backend accepts a partially-filled draft
// at any point in the multi-page journey, only validating fully on submit.
export interface PriorAuthorityApplicationExpertCosts {
  billingType?: PriorAuthorityApplicationBillingType;
  hourlyRate?: number;
  timeRequested?: PriorAuthorityApplicationTimeRequested;
  totalAmount?: number;
  costsSharedWithOtherParties?: boolean;
  apportionment?: PriorAuthorityApplicationApportionment;
}

export interface PriorAuthorityApplicationExpertDetails {
  expertType?: string;
  expertFullName?: string;
  expertPostcode?: string;
  expertCosts?: PriorAuthorityApplicationExpertCosts;
}

export interface PriorAuthorityApplicationCounselDetails {
  counselType?: string;
}

export interface PriorAuthorityApplicationDisbursementDetails {
  disbursementPurpose?: string;
  disbursementAmount?: number;
}

// Body shared by POST /prior-authorities (create) and PUT /prior-authorities/{id} (update).
export interface PriorAuthorityDraftDto {
  applicationId: string;
  priorAuthorityType: PriorAuthorityApplicationType;
  justification?: string;
  expertDetails?: PriorAuthorityApplicationExpertDetails | null;
  counselDetails?: PriorAuthorityApplicationCounselDetails | null;
  disbursementDetails?: PriorAuthorityApplicationDisbursementDetails | null;
}

export interface PriorAuthorityCreateDraftResponse {
  priorAuthorityId: string;
}

export interface PriorAuthorityGetDraftResponse {
  priorAuthorityId: string;
  status: string;
  draft: PriorAuthorityDraftDto;
}

export interface PriorAuthoritySubmitResponse {
  priorAuthorityId: string;
  submittedAt: string;
}
