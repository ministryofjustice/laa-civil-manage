import type {
  DraftApplicationType,
  DraftBillingType,
  DraftBody,
  DraftDocument,
} from "#src/types/drafts/api-types.js";
import {
  TEMP_EXPERT_POSTCODE,
  TEMP_PRIOR_AUTHORITY_JUSTIFICATION,
} from "#src/constants.js";
import type {
  PriorAuthority,
  PriorAuthorityBillingType,
  PriorAuthorityType,
  UploadedDocument,
} from "#src/types/prior-authority.js";

const TYPE_TO_DRAFT: Record<PriorAuthorityType, DraftApplicationType> = {
  Expert: "EXPERT",
  Disbursement: "DISBURSEMENT",
  Counsel: "COUNSEL",
};

const TYPE_FROM_DRAFT: Record<DraftApplicationType, PriorAuthorityType> = {
  EXPERT: "Expert",
  DISBURSEMENT: "Disbursement",
  COUNSEL: "Counsel",
};

const BILLING_TO_DRAFT: Record<PriorAuthorityBillingType, DraftBillingType> = {
  Hourly: "HOURLY",
  "Fixed rate": "FIXED_RATE",
};

const BILLING_FROM_DRAFT: Record<DraftBillingType, PriorAuthorityBillingType> =
  {
    HOURLY: "Hourly",
    FIXED_RATE: "Fixed rate",
  };

const toNullableNumber = (value: string | undefined): number | null =>
  value != null ? Number(value) : null;

const fromNullableNumber = (
  value: number | null | undefined,
): string | undefined => (value != null ? value.toString() : undefined);

const docsToApi = (
  docs: UploadedDocument[] | undefined,
): DraftDocument[] | null =>
  docs?.map((doc) => ({ fileName: doc.fileName })) ?? null;

const docsFromApi = (
  docs: DraftDocument[] | null | undefined,
): UploadedDocument[] | undefined =>
  docs?.map((doc) => ({
    fileName: doc.fileName,
    originalFileName: doc.fileName,
  })) ?? undefined;

const estimatedHoursToApi = (
  estimatedTime: PriorAuthority["estimatedTime"],
): DraftBody["timeHours"] =>
  estimatedTime != null ? Number(estimatedTime.estimatedHours) : null;

const estimatedMinutesToApi = (
  estimatedTime: PriorAuthority["estimatedTime"],
): DraftBody["timeMinutes"] =>
  estimatedTime != null ? Number(estimatedTime.estimatedMinutes) : null;

const estimatedTimeFromApi = (
  timeHours: DraftBody["timeHours"],
  timeMinutes: DraftBody["timeMinutes"],
): PriorAuthority["estimatedTime"] => {
  if (timeHours == null && timeMinutes == null) return undefined;
  return {
    estimatedHours: (timeHours ?? 0).toString(),
    estimatedMinutes: (timeMinutes ?? 0).toString(),
  };
};

export const mapPriorAuthorityToDraftBody = (
  applicationId: string,
  priorAuthority: Partial<PriorAuthority>,
): DraftBody => ({
  applicationId,
  priorAuthorityType: priorAuthority.type
    ? TYPE_TO_DRAFT[priorAuthority.type]
    : null,
  expertType: priorAuthority.expertType ?? null,
  expertFullName: priorAuthority.fullName ?? null,
  expertPostcode: TEMP_EXPERT_POSTCODE,
  uploadedDocuments: docsToApi(priorAuthority.uploadedDocuments),
  expertBasedInLondon:
    priorAuthority.expertBasedInLondon == null
      ? null
      : priorAuthority.expertBasedInLondon === "Yes",
  billingType: priorAuthority.billingType
    ? BILLING_TO_DRAFT[priorAuthority.billingType]
    : null,
  hourlyRate: toNullableNumber(priorAuthority.hourlyRate),
  timeHours: estimatedHoursToApi(priorAuthority.estimatedTime),
  timeMinutes: estimatedMinutesToApi(priorAuthority.estimatedTime),
  totalAmount: toNullableNumber(
    priorAuthority.billingType === "Fixed rate"
      ? priorAuthority.fixedRateTotalAmount
      : priorAuthority.totalAmount,
  ),
  justification: TEMP_PRIOR_AUTHORITY_JUSTIFICATION,
});

export const mapDraftBodyToPriorAuthority = (
  draftBody: DraftBody,
): Partial<PriorAuthority> => ({
  type:
    draftBody.priorAuthorityType != null
      ? TYPE_FROM_DRAFT[draftBody.priorAuthorityType]
      : undefined,
  expertType: draftBody.expertType ?? undefined,
  fullName: draftBody.expertFullName ?? undefined,
  expertPostcode: draftBody.expertPostcode ?? undefined,
  uploadedDocuments: docsFromApi(draftBody.uploadedDocuments),
  expertBasedInLondon:
    draftBody.expertBasedInLondon == null
      ? undefined
      : draftBody.expertBasedInLondon
        ? "Yes"
        : "No",
  billingType:
    draftBody.billingType != null
      ? BILLING_FROM_DRAFT[draftBody.billingType]
      : undefined,
  hourlyRate: fromNullableNumber(draftBody.hourlyRate),
  estimatedTime: estimatedTimeFromApi(
    draftBody.timeHours,
    draftBody.timeMinutes,
  ),
  totalAmount: fromNullableNumber(draftBody.totalAmount),
  fixedRateTotalAmount:
    draftBody.billingType === "FIXED_RATE"
      ? fromNullableNumber(draftBody.totalAmount)
      : undefined,
  justification: draftBody.justification ?? undefined,
});
