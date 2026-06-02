import type {
  DraftApplicationType,
  DraftBillingType,
  DraftBody,
  DraftDocument,
} from "#src/types/drafts/api-types.js";
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
  "Fixed cost": "FLAT_RATE",
};

const BILLING_FROM_DRAFT: Record<DraftBillingType, PriorAuthorityBillingType> =
  {
    HOURLY: "Hourly",
    FLAT_RATE: "Fixed cost",
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

const yesNoToApi = (value: "Yes" | "No" | undefined): boolean | null => {
  if (value == null) return null;
  return value === "Yes";
};

const yesNoFromApi = (
  value: boolean | null | undefined,
): "Yes" | "No" | undefined => {
  if (value == null) return undefined;
  return value ? "Yes" : "No";
};

const estimatedTimeToApi = (
  estimatedTime: PriorAuthority["estimatedTime"],
): DraftBody["estimatedTime"] => {
  if (estimatedTime == null) return null;
  return {
    hours: Number(estimatedTime.estimatedHours),
    minutes: Number(estimatedTime.estimatedMinutes),
  };
};

const estimatedTimeFromApi = (
  estimatedTime: DraftBody["estimatedTime"],
): PriorAuthority["estimatedTime"] => {
  if (estimatedTime == null) return undefined;
  return {
    estimatedHours: estimatedTime.hours.toString(),
    estimatedMinutes: estimatedTime.minutes.toString(),
  };
};

export const mapPriorAuthorityToDraftBody = (
  applicationId: string,
  priorAuthority: Partial<PriorAuthority>,
): DraftBody => ({
  applicationId,
  type: priorAuthority.type ? TYPE_TO_DRAFT[priorAuthority.type] : null,
  expertType: priorAuthority.expertType ?? null,
  expertFullName: priorAuthority.fullName ?? null,
  uploadedDocuments: docsToApi(priorAuthority.uploadedDocuments),
  guidelineRatesExceeded: yesNoToApi(priorAuthority.guidelineRatesExceeded),
  expertBasedInLondon: yesNoToApi(priorAuthority.expertBasedInLondon),
  billingType: priorAuthority.billingType
    ? BILLING_TO_DRAFT[priorAuthority.billingType]
    : null,
  hourlyRate: toNullableNumber(priorAuthority.hourlyRate),
  estimatedTime: estimatedTimeToApi(priorAuthority.estimatedTime),
  totalAmount: toNullableNumber(priorAuthority.totalAmount),
  flatRateTotalAmount: toNullableNumber(priorAuthority.flatRateTotalAmount),
});

export const mapDraftBodyToPriorAuthority = (
  draftBody: DraftBody,
): Partial<PriorAuthority> => ({
  type: draftBody.type != null ? TYPE_FROM_DRAFT[draftBody.type] : undefined,
  expertType: draftBody.expertType ?? undefined,
  fullName: draftBody.expertFullName ?? undefined,
  uploadedDocuments: docsFromApi(draftBody.uploadedDocuments),
  guidelineRatesExceeded: yesNoFromApi(draftBody.guidelineRatesExceeded),
  expertBasedInLondon: yesNoFromApi(draftBody.expertBasedInLondon),
  billingType:
    draftBody.billingType != null
      ? BILLING_FROM_DRAFT[draftBody.billingType]
      : undefined,
  hourlyRate: fromNullableNumber(draftBody.hourlyRate),
  estimatedTime: estimatedTimeFromApi(draftBody.estimatedTime),
  totalAmount: fromNullableNumber(draftBody.totalAmount),
  flatRateTotalAmount: fromNullableNumber(draftBody.flatRateTotalAmount),
});
