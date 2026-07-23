export const WIREMOCK_PORT = process.env.WIREMOCK_PORT ?? "8081";
export const WIREMOCK_URL = `http://127.0.0.1:${WIREMOCK_PORT}`;
export const WIREMOCK_ADMIN_URL =
  process.env.WIREMOCK_ADMIN_URL ?? `${WIREMOCK_URL}/__admin`;
