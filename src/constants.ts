// TODO Temporary hardcoded application ID used until the parent application flow is in scope.
export const DEV_APPLICATION_ID = "00000000-0000-0000-0000-000000000001";
// TODO Temporary hardcoded LAA reference used until the parent application flow is in scope.
export const DEV_LAA_REFERENCE = "LAA-000000";

export const pages = [
  // General
  "/",
  "/applications",

  // Counsel
  "/prior-authority/counsel",
  "/prior-authority/counsel/type",
  "/prior-authority/counsel/justification",
  "/prior-authority/counsel/document-upload",

  // Expert
  "/prior-authority/expert",
  "/prior-authority/expert/expert-type",
  "/prior-authority/expert/other-expert-type",
  "/prior-authority/expert/provider-name",
  "/prior-authority/expert/postcode",
  "/prior-authority/expert/costs",
  "/prior-authority/expert/justification",
  "/prior-authority/expert/document-upload",
  "/prior-authority/expert/check-your-answers",
  "/prior-authority/expert/confirmation-page",

  // Disbursements
  "/prior-authority/disbursement",
  "/prior-authority/disbursement/details",
  "/prior-authority/disbursement/justification",
];
