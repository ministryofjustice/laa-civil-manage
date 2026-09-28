import { RedisStore } from "connect-redis";
import type { SessionOptions } from "express-session";
import { createClient, type RedisClientType } from "redis";
import { setTimeout as delay } from "node:timers/promises";
import { type Logger, logger } from "#src/utils/logger.js";
import type { SessionConfig } from "#src/types/config.js";

export default class SessionManager {
  clientFactory: (options: object) => RedisClientType;
  redisStoreFactory:
    ((sessionConfig: SessionConfig) => Promise<RedisStore>) | undefined;
  logger: Logger;

  constructor() {
    this.clientFactory = createClient;
    this.logger = logger;
  }

  public setClientFactory(
    clientFactory: (options: object) => RedisClientType,
  ): void {
    this.clientFactory = clientFactory;
  }

  public setRedisStoreFactory(
    redisStoreFactory: (sessionConfig: SessionConfig) => Promise<RedisStore>,
  ): void {
    this.redisStoreFactory = redisStoreFactory;
  }

  public setLogger(logger: Logger): void {
    this.logger = logger;
  }

  public getSessionConfig = async (
    envConfig: SessionConfig,
  ): Promise<SessionOptions> => {
    const baseConfig = {
      secret: envConfig.secret,
      name: envConfig.name,
      resave: envConfig.resave,
      saveUninitialized: envConfig.saveUninitialized,
      rolling: true,
      cookie: {
        secure: envConfig.secure,
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        maxAge: envConfig.maxAge,
      },
    };

    if (envConfig.redis_url) {
      const factory = this.redisStoreFactory ?? this.getRedisStore;
      const redisStore = await factory(envConfig);
      return { ...baseConfig, store: redisStore };
    }

    return baseConfig;
  };

  public getRedisStore = async (
    envConfig: SessionConfig,
  ): Promise<RedisStore> => {
    this.logger.logInfo(
      "SessionManager.getRedisStore",
      "Creating Redis Client",
    );
    const redisClient = this.clientFactory({
      url: envConfig.redis_url,
      socket: { connectTimeout: 2000 },
    });

    redisClient.on("error", (err: unknown) => {
      this.logger.logError(
        "SessionManager.getRedisStore",
        "Redis client error",
        err,
      );
    });

    const connectTimeout = new AbortController();
    const rejectAfterTimeout = async (): Promise<never> => {
      await delay(2000, undefined, { signal: connectTimeout.signal });
      throw new Error("Redis connection timeout");
    };

    try {
      await Promise.race([redisClient.connect(), rejectAfterTimeout()]);
      this.logger.logInfo(
        "SessionManager.getRedisStore",
        "Connected to Redis server successfully.",
      );
    } catch (error) {
      this.logger.logError(
        "SessionManager.getRedisStore",
        "Redis unreachable at startup; starting anyway",
        error,
      );
    } finally {
      connectTimeout.abort();
    }

    return new RedisStore({ client: redisClient });
  };
}
