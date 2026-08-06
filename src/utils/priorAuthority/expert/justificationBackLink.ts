import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.js";

export const justificationBackLink = (
  expert: PriorAuthorityExpert | undefined,
): string =>
  expert?.apportioned === "Yes"
    ? "/prior-authority/expert/share-of-costs"
    : "/prior-authority/expert/costs-shared";
