export const REDIS_PORT = process.env.REDIS_PORT ?? "6379";
export const REDIS_URL =
  process.env.SESSION_REDIS_URL ?? `redis://127.0.0.1:${REDIS_PORT}`;
