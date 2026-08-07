import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.js";

export const justificationBackLink = (
  expert: PriorAuthorityExpert | undefined,
): string =>
  expert?.costsSharedWithOtherParties === "Yes"
    ? "/prior-authority/expert/share-of-costs"
    : "/prior-authority/expert/costs-shared";
