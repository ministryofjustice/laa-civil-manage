import { describe, it, expect, afterEach, mock, spyOn } from "bun:test";
import { createClient, type RedisClientType } from "redis";
import { config } from "#src/config.js";
import { logger } from "#src/utils/logger.js";
import {
  isRedisConfigured,
  pingRedis,
  setRedisClientFactory,
} from "#src/models/healthModels.js";

describe("isRedisConfigured", () => {
  const originalRedisUrl = config.session.redis_url;

  afterEach(() => {
    config.session.redis_url = originalRedisUrl;
  });

  it("returns false when SESSION_REDIS_URL is not set", () => {
    config.session.redis_url = undefined;
    expect(isRedisConfigured()).toBe(false);
  });

  it("returns false when SESSION_REDIS_URL is an empty string", () => {
    config.session.redis_url = "";
    expect(isRedisConfigured()).toBe(false);
  });

  it("returns true when SESSION_REDIS_URL is set", () => {
    config.session.redis_url = "redis://localhost:6379";
    expect(isRedisConfigured()).toBe(true);
  });
});

describe("pingRedis", () => {
  const originalRedisUrl = config.session.redis_url;

  afterEach(() => {
    config.session.redis_url = originalRedisUrl;
    setRedisClientFactory(createClient);
  });

  it("connects, pings, returns the reply, and closes the connection", async () => {
    config.session.redis_url = "redis://test-host:6379";
    const connect = mock().mockResolvedValue(undefined);
    const ping = mock().mockResolvedValue("PONG");
    const destroy = mock();
    const on = mock();
    const fakeClient = {
      connect,
      ping,
      destroy,
      on,
      isOpen: true,
    } as unknown as RedisClientType;
    const factory = mock(() => fakeClient);
    setRedisClientFactory(factory);

    const reply = await pingRedis();

    expect(factory).toHaveBeenCalledWith({
      url: "redis://test-host:6379",
      socket: { connectTimeout: 2000, reconnectStrategy: false },
    });
    expect(on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(connect).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(reply).toBe("PONG");
  });

  it("logs instead of throwing when the redis client emits an error event", async () => {
    config.session.redis_url = "redis://test-host:6380";
    let registeredErrorHandler: ((err: unknown) => void) | undefined;
    const fakeClient = {
      connect: mock().mockResolvedValue(undefined),
      ping: mock().mockResolvedValue("PONG"),
      destroy: mock(),
      on: mock((event: string, handler: (err: unknown) => void) => {
        if (event === "error") {
          registeredErrorHandler = handler;
        }
      }),
      isOpen: true,
    } as unknown as RedisClientType;
    setRedisClientFactory(mock(() => fakeClient));
    const logErrorSpy = spyOn(logger, "logError").mockImplementation(() => {});

    await pingRedis();

    const connectionRefused = new Error("connect ECONNREFUSED 127.0.0.1:6380");
    expect(() => registeredErrorHandler?.(connectionRefused)).not.toThrow();

    expect(logErrorSpy).toHaveBeenCalledWith(
      "healthModels.pingRedis",
      "Redis client error",
      connectionRefused,
    );
  });

  it("closes the connection even when the ping call fails", async () => {
    config.session.redis_url = "redis://test-host:6379";
    const connect = mock().mockResolvedValue(undefined);
    const pingError = new Error("PING timed out");
    const ping = mock().mockRejectedValue(pingError);
    const destroy = mock();
    const fakeClient = {
      connect,
      ping,
      destroy,
      on: mock(),
      isOpen: true,
    } as unknown as RedisClientType;
    setRedisClientFactory(mock(() => fakeClient));

    const error = await pingRedis().catch((err: unknown) => err);

    expect(error).toBe(pingError);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("propagates a connection/auth error without destroying a connection that was never opened", async () => {
    const connectError = new Error("WRONGPASS invalid username-password pair");
    const connect = mock().mockRejectedValue(connectError);
    const ping = mock();
    const destroy = mock();
    const fakeClient = {
      connect,
      ping,
      destroy,
      on: mock(),
      isOpen: false,
    } as unknown as RedisClientType;
    config.session.redis_url = "redis://test-host:6379";
    setRedisClientFactory(mock(() => fakeClient));

    const error = await pingRedis().catch((err: unknown) => err);

    expect(error).toBe(connectError);
    expect(ping).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });

  it("throws without attempting to connect when SESSION_REDIS_URL is not configured", async () => {
    config.session.redis_url = undefined;
    const factory = mock();
    setRedisClientFactory(factory);

    const error = await pingRedis().catch((err: unknown) => err);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("SESSION_REDIS_URL");
    expect(factory).not.toHaveBeenCalled();
  });
});
