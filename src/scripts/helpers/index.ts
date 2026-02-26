/**
 * Helpers Index
 *
 * Central export point for all helper utilities.
 * This allows for cleaner imports throughout the application.
 *
 * Usage:
 * import { devLog, safeString, formatDate } from '#src/scripts/helpers';
 */

// Development logging utilities
// export {
//   devLog,
//   devWarn,
//   devError,
//   devDebug,
//   isDevelopment,
// } from "/devLogger.js";

// Date formatting utilities
export {
  formatDate,
  dateStringFromThreeFields,
} from "#/src/scripts/helpers/dateFormatter.js";

// Session helpers
export {
  storeSessionData,
  getSessionData,
  clearSessionData,
  clearAllOriginalFormData,
  storeOriginalFormData,
} from "#/src/scripts/helpers/sessionHelpers.js";

// Error handling utilities
export {
  extractErrorMessage,
  isHttpError,
  isAuthError,
  isForbiddenError,
  isNotFoundError,
  isServerError,
  createProcessedError,
  extractAndLogError,
} from "#/src/scripts/helpers/errorHandler.js";
