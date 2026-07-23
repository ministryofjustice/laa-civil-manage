import type {
  DraftApplicationType,
  DraftBillingType,
  DraftBody,
  DraftDocument,
} from "#src/types/priorAuthority/draft.js";
import { TEMP_EXPERT_POSTCODE } from "#src/constants.js";
import type { PriorAuthorityBillingType } from "#src/types/priorAuthority/expert.js";
import type {
  PriorAuthority,
  PriorAuthorityType,
  UploadedDocument,
} from "#src/types/priorAuthority/shared.js";

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
  estimatedTime: PriorAuthority["expert"]["estimatedTime"],
): DraftBody["timeHours"] =>
  estimatedTime != null ? Number(estimatedTime.estimatedHours) : null;

const estimatedMinutesToApi = (
  estimatedTime: PriorAuthority["expert"]["estimatedTime"],
): DraftBody["timeMinutes"] =>
  estimatedTime != null ? Number(estimatedTime.estimatedMinutes) : null;

const estimatedTimeFromApi = (
  timeHours: DraftBody["timeHours"],
  timeMinutes: DraftBody["timeMinutes"],
): PriorAuthority["expert"]["estimatedTime"] => {
  if (timeHours == null && timeMinutes == null) return undefined;
  return {
    estimatedHours: (timeHours ?? 0).toString(),
    estimatedMinutes: (timeMinutes ?? 0).toString(),
  };
};

const typeFromDraft = (
  priorAuthorityType: DraftBody["priorAuthorityType"],
): PriorAuthority["type"] =>
  priorAuthorityType != null ? TYPE_FROM_DRAFT[priorAuthorityType] : undefined;

const expertBasedInLondonFromDraft = (
  expertBasedInLondon: DraftBody["expertBasedInLondon"],
): PriorAuthority["expert"]["expertBasedInLondon"] =>
  expertBasedInLondon == null ? undefined : expertBasedInLondon ? "Yes" : "No";

const billingTypeFromDraft = (
  billingType: DraftBody["billingType"],
): PriorAuthority["expert"]["billingType"] =>
  billingType != null ? BILLING_FROM_DRAFT[billingType] : undefined;

const expertJustificationFromDraft = (
  draftBody: DraftBody,
): PriorAuthority["expert"]["justification"] =>
  draftBody.justification ?? undefined;

const counselJustificationFromDraft = (
  draftBody: DraftBody,
): PriorAuthority["counsel"]["justification"] =>
  draftBody.justification ?? undefined;

const mapFixedRateTotalAmountFromDraft = (
  billingType: DraftBody["billingType"],
  totalAmount: DraftBody["totalAmount"],
): PriorAuthority["expert"]["fixedRateTotalAmount"] =>
  billingType === "FIXED_RATE" ? fromNullableNumber(totalAmount) : undefined;

function buildExpertIdentityFromDraft(
  draftBody: DraftBody,
): Pick<
  PriorAuthority["expert"],
  "expertType" | "fullName" | "expertPostcode" | "uploadedDocuments"
> {
  return {
    expertType: draftBody.expertType ?? undefined,
    fullName: draftBody.expertFullName ?? undefined,
    expertPostcode: draftBody.expertPostcode ?? undefined,
    uploadedDocuments: docsFromApi(draftBody.uploadedDocuments),
  };
}

function buildExpertBillingFromDraft(
  draftBody: DraftBody,
): Pick<
  PriorAuthority["expert"],
  | "expertBasedInLondon"
  | "billingType"
  | "hourlyRate"
  | "estimatedTime"
  | "totalAmount"
> {
  return {
    expertBasedInLondon: expertBasedInLondonFromDraft(
      draftBody.expertBasedInLondon,
    ),
    billingType: billingTypeFromDraft(draftBody.billingType),
    hourlyRate: fromNullableNumber(draftBody.hourlyRate),
    estimatedTime: estimatedTimeFromApi(
      draftBody.timeHours,
      draftBody.timeMinutes,
    ),
    totalAmount: fromNullableNumber(draftBody.totalAmount),
  };
}

function buildExpertFromDraft(draftBody: DraftBody): PriorAuthority["expert"] {
  return {
    ...buildExpertIdentityFromDraft(draftBody),
    ...buildExpertBillingFromDraft(draftBody),
    fixedRateTotalAmount: mapFixedRateTotalAmountFromDraft(
      draftBody.billingType,
      draftBody.totalAmount,
    ),
    justification: expertJustificationFromDraft(draftBody),
  };
}

function buildCounselFromDraft(
  draftBody: DraftBody,
): PriorAuthority["counsel"] {
  return {
    counselType: draftBody.counselType ?? undefined,
    justification: counselJustificationFromDraft(draftBody),
  };
}

export const mapPriorAuthorityToDraftBody = (
  applicationId: string,
  priorAuthority: PriorAuthority,
): DraftBody => ({
  applicationId,
  priorAuthorityType: priorAuthority.type
    ? TYPE_TO_DRAFT[priorAuthority.type]
    : null,
  counselType: priorAuthority.counsel.counselType ?? null,
  expertType: priorAuthority.expert.expertType ?? null,
  expertFullName: priorAuthority.expert.fullName ?? null,
  expertPostcode: TEMP_EXPERT_POSTCODE,
  uploadedDocuments: docsToApi(priorAuthority.expert.uploadedDocuments),
  expertBasedInLondon:
    priorAuthority.expert.expertBasedInLondon == null
      ? null
      : priorAuthority.expert.expertBasedInLondon === "Yes",
  billingType: priorAuthority.expert.billingType
    ? BILLING_TO_DRAFT[priorAuthority.expert.billingType]
    : null,
  hourlyRate: toNullableNumber(priorAuthority.expert.hourlyRate),
  timeHours: estimatedHoursToApi(priorAuthority.expert.estimatedTime),
  timeMinutes: estimatedMinutesToApi(priorAuthority.expert.estimatedTime),
  totalAmount: toNullableNumber(
    priorAuthority.expert.billingType === "Fixed rate"
      ? priorAuthority.expert.fixedRateTotalAmount
      : priorAuthority.expert.totalAmount,
  ),
  justification:
    priorAuthority.counsel.justification ??
    priorAuthority.expert.justification ??
    null,
});

export function mapDraftBodyToPriorAuthority(
  draftBody: DraftBody,
): PriorAuthority {
  const type = typeFromDraft(draftBody.priorAuthorityType);

  switch (draftBody.priorAuthorityType) {
    case "COUNSEL":
      return {
        type,
        expert: {},
        counsel: buildCounselFromDraft(draftBody),
      };
    case "EXPERT":
      return {
        type,
        expert: buildExpertFromDraft(draftBody),
        counsel: {},
      };
    case "DISBURSEMENT":
    default:
      throw new Error("Unsupported draft type");
  }
}
