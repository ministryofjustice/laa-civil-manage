export const REDIS_PORT = process.env.REDIS_PORT ?? "6379";
export const REDIS_URL =
  process.env.SESSION_REDIS_URL ?? `redis://localhost:${REDIS_PORT}`;
