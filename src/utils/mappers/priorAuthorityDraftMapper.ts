import type {
  PriorAuthority,
  PriorAuthorityType,
} from "#src/types/priorAuthority/shared.js";
import type {
  PriorAuthorityBillingType,
  PriorAuthorityCostsShared,
  PriorAuthorityEstimatedTime,
  PriorAuthorityExpert,
} from "#src/types/priorAuthority/expert.js";
import type {
  counselType,
  PriorAuthorityCounsel,
} from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthorityDisbursement } from "#src/types/priorAuthority/disbursement.js";
import type {
  PriorAuthorityApplicationApportionment,
  PriorAuthorityApplicationBillingType,
  PriorAuthorityApplicationCounselDetails,
  PriorAuthorityApplicationDisbursementDetails,
  PriorAuthorityApplicationExpertCosts,
  PriorAuthorityApplicationExpertDetails,
  PriorAuthorityApplicationTimeRequested,
  PriorAuthorityApplicationType,
  PriorAuthorityDraftDto,
} from "#src/types/priorAuthority/api.js";

const REVERSE_TYPE_MAP: Record<
  PriorAuthorityApplicationType,
  PriorAuthorityType
> = {
  EXPERT: "Expert",
  DISBURSEMENT: "Disbursement",
  COUNSEL: "Counsel",
};

const BILLING_TYPE_MAP: Record<
  PriorAuthorityBillingType,
  PriorAuthorityApplicationBillingType
> = {
  Hourly: "HOURLY",
  "Fixed rate": "FIXED_RATE",
};

const REVERSE_BILLING_TYPE_MAP: Record<
  PriorAuthorityApplicationBillingType,
  PriorAuthorityBillingType
> = {
  HOURLY: "Hourly",
  FIXED_RATE: "Fixed rate",
};

const safeNumber = (value: string | undefined): number | undefined => {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const safeInteger = (value: string | undefined): number | undefined => {
  const parsed = safeNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
};

const numberToString = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : String(value);

const buildTimeRequested = (
  time: PriorAuthorityEstimatedTime | undefined,
): PriorAuthorityApplicationTimeRequested | undefined => {
  const hours = safeInteger(time?.estimatedHours);
  const minutes = safeInteger(time?.estimatedMinutes);
  return hours !== undefined && minutes !== undefined
    ? { hours, minutes }
    : undefined;
};

const buildApportionment = (
  expert: PriorAuthorityExpert,
): PriorAuthorityApplicationApportionment | undefined => {
  if (expert.costsSharedWithOtherParties !== "Yes") {
    return undefined;
  }
  const partiesSharingCosts = safeInteger(expert.numberOfParties);
  const clientShareAmount = safeNumber(expert.apportionedAmount);
  return partiesSharingCosts !== undefined && clientShareAmount !== undefined
    ? { partiesSharingCosts, clientShareAmount }
    : undefined;
};

const buildExpertCosts = (
  expert: PriorAuthorityExpert,
): PriorAuthorityApplicationExpertCosts | undefined => {
  if (expert.billingType === undefined) {
    return undefined;
  }
  const billingType = BILLING_TYPE_MAP[expert.billingType];
  const costsSharedWithOtherParties =
    expert.costsSharedWithOtherParties === undefined
      ? undefined
      : expert.costsSharedWithOtherParties === "Yes";

  if (billingType === "FIXED_RATE") {
    return {
      billingType,
      totalAmount: safeNumber(expert.fixedRateTotalAmount),
      costsSharedWithOtherParties,
      apportionment: buildApportionment(expert),
    };
  }

  return {
    billingType,
    hourlyRate: safeNumber(expert.hourlyRate),
    timeRequested: buildTimeRequested(expert.estimatedTime),
    totalAmount: safeNumber(expert.totalAmount),
    costsSharedWithOtherParties,
    apportionment: buildApportionment(expert),
  };
};

export const buildExpertDraftDto = (
  applicationId: string,
  expert: PriorAuthorityExpert,
): PriorAuthorityDraftDto => ({
  applicationId,
  priorAuthorityType: "EXPERT",
  justification: expert.justification,
  expertDetails: {
    expertType: expert.expertType,
    expertFullName: expert.fullName,
    expertPostcode: expert.expertPostcode,
    expertCosts: buildExpertCosts(expert),
  },
});

export const buildCounselDraftDto = (
  applicationId: string,
  counsel: PriorAuthorityCounsel,
): PriorAuthorityDraftDto => ({
  applicationId,
  priorAuthorityType: "COUNSEL",
  justification: counsel.justification,
  counselDetails: { counselType: counsel.counselType },
});

export const buildDisbursementDraftDto = (
  applicationId: string,
  disbursement: PriorAuthorityDisbursement,
): PriorAuthorityDraftDto => ({
  applicationId,
  priorAuthorityType: "DISBURSEMENT",
  justification: disbursement.justification,
  disbursementDetails: {
    disbursementPurpose: disbursement.disbursementPurpose,
    disbursementAmount: safeNumber(disbursement.disbursementAmount),
  },
});

export const buildPriorAuthorityDraftDto = (
  applicationId: string,
  priorAuthority: PriorAuthority,
): PriorAuthorityDraftDto => {
  switch (priorAuthority.type) {
    case "Counsel":
      return buildCounselDraftDto(applicationId, priorAuthority.counsel);
    case "Disbursement":
      return buildDisbursementDraftDto(
        applicationId,
        priorAuthority.disbursement,
      );
    case "Expert":
    default:
      return buildExpertDraftDto(applicationId, priorAuthority.expert);
  }
};

const hydrateCostsSharedWithOtherParties = (
  value: boolean | undefined,
): PriorAuthorityCostsShared | undefined => {
  if (value === true) {
    return "Yes";
  }
  if (value === false) {
    return "No";
  }
  return undefined;
};

const hydrateEstimatedTime = (
  timeRequested: PriorAuthorityApplicationTimeRequested | undefined,
): PriorAuthorityEstimatedTime | undefined =>
  timeRequested
    ? {
        estimatedHours: String(timeRequested.hours),
        estimatedMinutes: String(timeRequested.minutes),
      }
    : undefined;

interface HydratedTotalAmountFields {
  totalAmount: string | undefined;
  fixedRateTotalAmount: string | undefined;
}

const hydrateTotalAmountFields = (
  billingType: PriorAuthorityBillingType | undefined,
  costs: PriorAuthorityApplicationExpertCosts | undefined,
): HydratedTotalAmountFields => {
  const totalAmount = numberToString(costs?.totalAmount);
  return {
    totalAmount: billingType === "Hourly" ? totalAmount : undefined,
    fixedRateTotalAmount:
      billingType === "Fixed rate" ? totalAmount : undefined,
  };
};

interface HydratedExpertCostsFields {
  billingType: PriorAuthorityBillingType | undefined;
  hourlyRate: string | undefined;
  estimatedTime: PriorAuthorityEstimatedTime | undefined;
  totalAmount: string | undefined;
  fixedRateTotalAmount: string | undefined;
  costsSharedWithOtherParties: PriorAuthorityCostsShared | undefined;
  numberOfParties: string | undefined;
  apportionedAmount: string | undefined;
}

const hydrateExpertCostsFields = (
  costs: PriorAuthorityApplicationExpertCosts | undefined,
): HydratedExpertCostsFields => {
  const billingType = costs?.billingType
    ? REVERSE_BILLING_TYPE_MAP[costs.billingType]
    : undefined;
  const apportionment = costs?.apportionment;

  return {
    billingType,
    hourlyRate: numberToString(costs?.hourlyRate),
    estimatedTime: hydrateEstimatedTime(costs?.timeRequested),
    ...hydrateTotalAmountFields(billingType, costs),
    costsSharedWithOtherParties: hydrateCostsSharedWithOtherParties(
      costs?.costsSharedWithOtherParties,
    ),
    numberOfParties: numberToString(apportionment?.partiesSharingCosts),
    apportionedAmount: numberToString(apportionment?.clientShareAmount),
  };
};

export const hydrateExpertViewModel = (
  details: PriorAuthorityApplicationExpertDetails | null | undefined,
  justification: string | undefined,
): PriorAuthorityExpert => ({
  expertType: details?.expertType,
  fullName: details?.expertFullName,
  expertPostcode: details?.expertPostcode,
  justification,
  ...hydrateExpertCostsFields(details?.expertCosts),
});

const COUNSEL_TYPES = new Set<string>([
  "KINGS_COUNSEL_ALONE",
  "TWO_JUNIOR_COUNSEL",
  "KINGS_COUNSEL_AND_JUNIOR_COUNSEL",
  "KINGS_COUNSEL_AND_TWO_JUNIOR_COUNSEL",
]);

const isCounselType = (value: string): value is counselType =>
  COUNSEL_TYPES.has(value);

const hydrateCounselType = (
  value: string | undefined,
): counselType | undefined =>
  value !== undefined && isCounselType(value) ? value : undefined;

export const hydrateCounselViewModel = (
  details: PriorAuthorityApplicationCounselDetails | null | undefined,
  justification: string | undefined,
): PriorAuthorityCounsel => ({
  counselType: hydrateCounselType(details?.counselType),
  justification,
});

export const hydrateDisbursementViewModel = (
  details: PriorAuthorityApplicationDisbursementDetails | null | undefined,
  justification: string | undefined,
): PriorAuthorityDisbursement => ({
  disbursementPurpose: details?.disbursementPurpose,
  disbursementAmount: numberToString(details?.disbursementAmount),
  justification,
});

export const hydratePriorAuthority = (
  draft: PriorAuthorityDraftDto,
): PriorAuthority => ({
  type: REVERSE_TYPE_MAP[draft.priorAuthorityType],
  expert: hydrateExpertViewModel(
    draft.expertDetails,
    draft.priorAuthorityType === "EXPERT" ? draft.justification : undefined,
  ),
  counsel: hydrateCounselViewModel(
    draft.counselDetails,
    draft.priorAuthorityType === "COUNSEL" ? draft.justification : undefined,
  ),
  disbursement: hydrateDisbursementViewModel(
    draft.disbursementDetails,
    draft.priorAuthorityType === "DISBURSEMENT"
      ? draft.justification
      : undefined,
  ),
});
