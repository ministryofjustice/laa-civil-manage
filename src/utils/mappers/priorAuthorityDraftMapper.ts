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

// ---- Forward (lenient): loose view model -> strict backend draft body. Never throws. ----
//
// TEMPORARY (remove once the backend stops requiring every field on PUT): the
// data store currently 400s unless every field below is present AND satisfies
// its own validation (@NotBlank strings, @Positive amounts), confirmed against
// the real API — plain "" / 0 placeholders are rejected, so use non-blank /
// positive placeholders instead. Fields not yet collected are filled with
// these placeholders rather than being omitted.
//
// IMPORTANT: these must be values a real user would never plausibly enter.
// Every PUT round-trips the WHOLE draft, so if a genuine value ever equals a
// placeholder, hydration hides it (see below) as if unset — and because the
// hidden field then gets re-sent AS the placeholder on the next unrelated
// page's save, it stays permanently stuck looking "Not provided" from then
// on. `1`/`2` were hit in practice (e.g. a real hourly rate of "1"), so these
// are now deliberately unrealistic amounts instead of small round numbers.
const DEFAULT_STRING = "N/A";
const DEFAULT_POSITIVE_NUMBER = 0.01;
// partiesSharingCosts has its own @Min(2) constraint (a single party can't "share" costs).
const DEFAULT_PARTIES_SHARING_COSTS = 999999998;
const DEFAULT_TIME_REQUESTED: PriorAuthorityApplicationTimeRequested = {
  hours: 0,
  minutes: 0,
};
const DEFAULT_BILLING_TYPE: PriorAuthorityApplicationBillingType = "HOURLY";
const DEFAULT_COUNSEL_TYPE = "KINGS_COUNSEL_ALONE";
const DEFAULT_APPORTIONMENT: PriorAuthorityApplicationApportionment = {
  partiesSharingCosts: DEFAULT_PARTIES_SHARING_COSTS,
  clientShareAmount: DEFAULT_POSITIVE_NUMBER,
};

const buildTimeRequested = (
  time: PriorAuthorityEstimatedTime | undefined,
): PriorAuthorityApplicationTimeRequested => {
  const hours = safeInteger(time?.estimatedHours);
  const minutes = safeInteger(time?.estimatedMinutes);
  return hours !== undefined && minutes !== undefined
    ? { hours, minutes }
    : DEFAULT_TIME_REQUESTED;
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
    : DEFAULT_APPORTIONMENT;
};

const buildExpertCosts = (
  expert: PriorAuthorityExpert,
): PriorAuthorityApplicationExpertCosts => {
  const costsSharedWithOtherParties =
    expert.costsSharedWithOtherParties === "Yes";
  const billingType = expert.billingType
    ? BILLING_TYPE_MAP[expert.billingType]
    : DEFAULT_BILLING_TYPE;

  if (billingType === "FIXED_RATE") {
    return {
      billingType,
      totalAmount:
        safeNumber(expert.fixedRateTotalAmount) ?? DEFAULT_POSITIVE_NUMBER,
      costsSharedWithOtherParties,
      apportionment: buildApportionment(expert),
    };
  }

  return {
    billingType,
    hourlyRate: safeNumber(expert.hourlyRate) ?? DEFAULT_POSITIVE_NUMBER,
    timeRequested: buildTimeRequested(expert.estimatedTime),
    totalAmount: safeNumber(expert.totalAmount) ?? DEFAULT_POSITIVE_NUMBER,
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
  justification: expert.justification ?? DEFAULT_STRING,
  expertDetails: {
    expertType: expert.expertType ?? DEFAULT_STRING,
    expertFullName: expert.fullName ?? DEFAULT_STRING,
    expertPostcode: expert.expertPostcode ?? DEFAULT_STRING,
    expertCosts: buildExpertCosts(expert),
  },
});

export const buildCounselDraftDto = (
  applicationId: string,
  counsel: PriorAuthorityCounsel,
): PriorAuthorityDraftDto => ({
  applicationId,
  priorAuthorityType: "COUNSEL",
  justification: counsel.justification ?? DEFAULT_STRING,
  counselDetails: {
    counselType: counsel.counselType ?? DEFAULT_COUNSEL_TYPE,
  },
});

export const buildDisbursementDraftDto = (
  applicationId: string,
  disbursement: PriorAuthorityDisbursement,
): PriorAuthorityDraftDto => ({
  applicationId,
  priorAuthorityType: "DISBURSEMENT",
  justification: disbursement.justification ?? DEFAULT_STRING,
  disbursementDetails: {
    disbursementPurpose: disbursement.disbursementPurpose ?? DEFAULT_STRING,
    disbursementAmount:
      safeNumber(disbursement.disbursementAmount) ?? DEFAULT_POSITIVE_NUMBER,
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

// ---- Reverse: strict backend draft body -> loose view model, for GET hydration. ----
//
// TEMPORARY (see the placeholders above): a field holding exactly one of our
// own placeholder values means it hasn't really been entered yet, so it's
// hidden back to `undefined` rather than showing "N/A"/zero-ish values in the
// UI. Small caveat: if a user genuinely enters a value identical to a
// placeholder (e.g. selects the counsel type that happens to be our default),
// it will look unset when the page is revisited — acceptable for a stopgap.
const hidePlaceholder = <T>(
  value: T | undefined,
  placeholder: T,
): T | undefined => (value === placeholder ? undefined : value);

const hideCostsPlaceholder = (value: number | undefined): number | undefined =>
  hidePlaceholder(value, DEFAULT_POSITIVE_NUMBER);

const hideTimeRequestedPlaceholder = (
  timeRequested: PriorAuthorityApplicationTimeRequested | undefined,
): PriorAuthorityApplicationTimeRequested | undefined =>
  timeRequested?.hours === DEFAULT_TIME_REQUESTED.hours &&
  timeRequested.minutes === DEFAULT_TIME_REQUESTED.minutes
    ? undefined
    : timeRequested;

interface HiddenApportionment {
  partiesSharingCosts: number | undefined;
  clientShareAmount: number | undefined;
}

const hideApportionmentPlaceholder = (
  apportionment: PriorAuthorityApplicationApportionment | undefined,
): HiddenApportionment => ({
  partiesSharingCosts: hidePlaceholder(
    apportionment?.partiesSharingCosts,
    DEFAULT_PARTIES_SHARING_COSTS,
  ),
  clientShareAmount: hideCostsPlaceholder(apportionment?.clientShareAmount),
});

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
): PriorAuthorityEstimatedTime | undefined => {
  const value = hideTimeRequestedPlaceholder(timeRequested);
  return value
    ? {
        estimatedHours: String(value.hours),
        estimatedMinutes: String(value.minutes),
      }
    : undefined;
};

interface HydratedTotalAmountFields {
  totalAmount: string | undefined;
  fixedRateTotalAmount: string | undefined;
}

const hydrateTotalAmountFields = (
  billingType: PriorAuthorityBillingType | undefined,
  costs: PriorAuthorityApplicationExpertCosts | undefined,
): HydratedTotalAmountFields => {
  const totalAmount = numberToString(hideCostsPlaceholder(costs?.totalAmount));
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
  const apportionment = hideApportionmentPlaceholder(costs?.apportionment);

  return {
    billingType,
    hourlyRate: numberToString(hideCostsPlaceholder(costs?.hourlyRate)),
    estimatedTime: hydrateEstimatedTime(costs?.timeRequested),
    ...hydrateTotalAmountFields(billingType, costs),
    costsSharedWithOtherParties: hydrateCostsSharedWithOtherParties(
      costs?.costsSharedWithOtherParties,
    ),
    numberOfParties: numberToString(apportionment.partiesSharingCosts),
    apportionedAmount: numberToString(apportionment.clientShareAmount),
  };
};

export const hydrateExpertViewModel = (
  details: PriorAuthorityApplicationExpertDetails | null | undefined,
  justification: string | undefined,
): PriorAuthorityExpert => ({
  expertType: hidePlaceholder(details?.expertType, DEFAULT_STRING),
  fullName: hidePlaceholder(details?.expertFullName, DEFAULT_STRING),
  expertPostcode: hidePlaceholder(details?.expertPostcode, DEFAULT_STRING),
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
): counselType | undefined => {
  const withoutPlaceholder = hidePlaceholder(value, DEFAULT_COUNSEL_TYPE);
  return withoutPlaceholder !== undefined && isCounselType(withoutPlaceholder)
    ? withoutPlaceholder
    : undefined;
};

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
  disbursementPurpose: hidePlaceholder(
    details?.disbursementPurpose,
    DEFAULT_STRING,
  ),
  disbursementAmount: numberToString(
    hideCostsPlaceholder(details?.disbursementAmount),
  ),
  justification,
});

export const hydratePriorAuthority = (
  draft: PriorAuthorityDraftDto,
): PriorAuthority => ({
  type: REVERSE_TYPE_MAP[draft.priorAuthorityType],
  expert: hydrateExpertViewModel(
    draft.expertDetails,
    draft.priorAuthorityType === "EXPERT"
      ? hidePlaceholder(draft.justification, DEFAULT_STRING)
      : undefined,
  ),
  counsel: hydrateCounselViewModel(
    draft.counselDetails,
    draft.priorAuthorityType === "COUNSEL"
      ? hidePlaceholder(draft.justification, DEFAULT_STRING)
      : undefined,
  ),
  disbursement: hydrateDisbursementViewModel(
    draft.disbursementDetails,
    draft.priorAuthorityType === "DISBURSEMENT"
      ? hidePlaceholder(draft.justification, DEFAULT_STRING)
      : undefined,
  ),
});
