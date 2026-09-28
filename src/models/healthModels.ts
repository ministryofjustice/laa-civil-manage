import { createClient, type RedisClientType } from "redis";
import { config } from "#src/config.js";
import { logger } from "#src/utils/logger.js";

const HEALTH_CHECK_CONNECT_TIMEOUT_MS = 2000;

export interface HealthCheckClientOptions {
  url: string;
  socket: { connectTimeout: number; reconnectStrategy: false };
}

export type RedisClientFactory = (
  options: HealthCheckClientOptions,
) => RedisClientType;

let clientFactory: RedisClientFactory = createClient;

export const setRedisClientFactory = (factory: RedisClientFactory): void => {
  clientFactory = factory;
};

export const isRedisConfigured = (): boolean => {
  const redisUrl = config.session.redis_url;
  return redisUrl !== undefined && redisUrl !== "";
};

export const pingRedis = async (): Promise<string> => {
  const redisUrl = config.session.redis_url;
  if (redisUrl === undefined || redisUrl === "") {
    throw new Error("SESSION_REDIS_URL is not configured");
  }

  const client = clientFactory({
    url: redisUrl,
    socket: {
      connectTimeout: HEALTH_CHECK_CONNECT_TIMEOUT_MS,
      reconnectStrategy: false,
    },
  });
  client.on("error", (err: unknown) => {
    logger.logError("healthModels.pingRedis", "Redis client error", err);
  });

  try {
    await client.connect();
    return await client.ping();
  } finally {
    if (client.isOpen) {
      client.destroy();
    }
  }
};
