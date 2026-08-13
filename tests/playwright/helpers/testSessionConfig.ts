// Single source of truth for the session secret/name used by the Playwright
// webServer (see playwright.config.ts) and by test helpers that seed/reset
// sessions directly in Redis (seedSession.ts, resetSession.ts).
//
// These must match exactly: the webServer signs/verifies session cookies
// with this secret, and if a test helper signs a cookie with a different
// secret (e.g. one picked up from a local .env file), the server's signature
// check silently fails, causing it to discard the seeded session and start a
// brand new, empty one.
export const TEST_SESSION_SECRET =
  "test-session-secret-must-be-defined-key-32ch";
export const TEST_SESSION_NAME = "sessionId";
