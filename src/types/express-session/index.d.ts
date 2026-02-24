import "express-session";
// import type { AssessmentDecision } from "#src/types/frontend-components/decision.js";

declare module "express-session" {
  interface SessionData {
    idToken: string;
    userId: string;
    userDisplayName: string;
    accessToken: string;
    originalUrl: string;
    // assessmentDecisionFormData: Partial<SessionData> & AssessmentDecision;
    assignedApplicationIds: undefined | string[];
    assignedLeadApplicationId: undefined | string;
    assignedLeadLaaReference: undefined | string;
    errorMessage: undefined | string;
  }
}

export default session;
