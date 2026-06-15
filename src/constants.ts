// TODO Temporary hardcoded application ID used until the parent application flow is in scope.
export const DEV_APPLICATION_ID = "00000000-0000-0000-0000-000000000001";

// TODO Temporary fallback values until dedicated frontend pages are wired.
export const TEMP_EXPERT_POSTCODE = "SW1H 9AJ" as string;
export const TEMP_PRIOR_AUTHORITY_JUSTIFICATION =
  "Submitted via Civil Manage frontend";

export const pages = [
  "/",
  "/pa-form/start-page",
  "/pa-form/type-pa",
  "/pa-form/expert-costs",
  "/pa-form/expert-details",
  "/pa-form/confirmation-page",
  "/pa-form/no-prior-authority-needed",
  "/pa-form/is-guideline-rate-exceeded",
  "/pa-form/document-upload",
  "/pa-form/expert-based-in-london",
  "/pa-form/check-your-answers",
];
