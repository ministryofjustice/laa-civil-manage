import SessionManager from "#src/middleware/session/sessionManager.js";
import type { RedisClientType } from "redis";
import type { RedisStore } from "connect-redis";
import { Logger } from "#src/utils/logger.js";
import {
  getSessionConfigTestCases,
  MS_IN_TWELVE_HOURS,
} from "#tests/unit/middleware/session/sessionManagerFixture.js";
import { describe, expect, it, mock, spyOn } from "bun:test";
import type { SessionOptions } from "express-session";

describe("getSessionConfig", () => {
  getSessionConfigTestCases.forEach(({ testName, envConfig, expected }) => {
    it(testName, async () => {
      const fakeStore = {} as RedisStore;
      const fakeRedisStoreFactory: () => Promise<RedisStore> = async () =>
        await new Promise((resolve) => {
          resolve(fakeStore);
        });

      const fakeClient = { connect: () => {}, on: () => {} } as RedisClientType;
      function fakeClientFactory(): RedisClientType {
        return fakeClient;
      }

      const factory = new SessionManager();
      factory.setClientFactory(fakeClientFactory);
      factory.setRedisStoreFactory(fakeRedisStoreFactory);

      expected.store &&= fakeStore;

      const actual = await factory.getSessionConfig(envConfig);

      expect(actual).toEqual(expected as SessionOptions);
    });
  });
});

describe("session cookie security attributes (CM-S1 / CM-T2)", () => {
  const buildManager = (): SessionManager => {
    const manager = new SessionManager();
    manager.setClientFactory(
      () => ({ connect: () => {} }) as unknown as RedisClientType,
    );
    return manager;
  };

  const baseEnvConfig = {
    secret: "sec",
    name: "my-app-session",
    resave: false,
    saveUninitialized: false,
    maxAge: MS_IN_TWELVE_HOURS,
    httpOnly: true,
  };

  it("cookie has HttpOnly set to prevent client-side script access", async () => {
    const config = await buildManager().getSessionConfig({
      ...baseEnvConfig,
      secure: false,
    });
    expect(config.cookie?.httpOnly).toBe(true);
  });

  it("cookie has SameSite=Lax to mitigate CSRF", async () => {
    const config = await buildManager().getSessionConfig({
      ...baseEnvConfig,
      secure: false,
    });
    expect(config.cookie?.sameSite).toBe("lax");
  });

  it("cookie is scoped to Path=/ so it is not leaked to sub-paths", async () => {
    const config = await buildManager().getSessionConfig({
      ...baseEnvConfig,
      secure: false,
    });
    expect(config.cookie?.path).toBe("/");
  });

  it("cookie has an explicit Max-Age (Target Requirement)", async () => {
    const config = await buildManager().getSessionConfig({
      ...baseEnvConfig,
      secure: false,
    });
    expect(typeof config.cookie?.maxAge).toBe("number");
    expect((config.cookie?.maxAge as number) > 0).toBe(true);
  });

  it("cookie carries Secure flag in production environments (CM-S1)", async () => {
    const config = await buildManager().getSessionConfig({
      ...baseEnvConfig,
      secure: true,
    });
    expect(config.cookie?.secure).toBe(true);
  });

  it("cookie does NOT carry Secure flag in non-production environments", async () => {
    const config = await buildManager().getSessionConfig({
      ...baseEnvConfig,
      secure: false,
    });
    expect(config.cookie?.secure).toBe(false);
  });

  it("session cookie uses the configured application name, not the framework default (connect.sid)", async () => {
    const config = await buildManager().getSessionConfig({
      ...baseEnvConfig,
      secure: false,
    });
    expect(config.name).toBe("my-app-session");
    expect(config.name).not.toBe("connect.sid");
  });

  it("rolling is enabled so the idle timeout resets on every response (CM-469)", async () => {
    const config = await buildManager().getSessionConfig({
      ...baseEnvConfig,
      secure: false,
    });
    expect(config.rolling).toBe(true);
  });
});

describe("getRedisStore", () => {
  it("should return a redis store with a connected client", async () => {
    const envConfig = {
      secret: "test-secret",
      name: "session-name",
      redis_url: "redis://redis:6379",
      resave: false,
      saveUninitialized: false,
      maxAge: MS_IN_TWELVE_HOURS,
      secure: false,
      httpOnly: true,
      redis: {},
    };

    const fakeClientConnectMock = mock();
    const fakeClientOnMock = mock();
    const fakeClient = {
      connect: fakeClientConnectMock,
      on: fakeClientOnMock,
    } as unknown as RedisClientType;

    const fakeLogger = new Logger();
    const loggerSpy = spyOn(fakeLogger, "logInfo");

    const objectToMock = {
      clientFactory: () => fakeClient,
    };
    const factorySpy = spyOn(objectToMock, "clientFactory");

    const manager = new SessionManager();
    manager.setClientFactory(objectToMock.clientFactory);
    manager.setLogger(fakeLogger);

    const actualRedisStore = await manager.getRedisStore(envConfig);

    expect(factorySpy).toHaveBeenCalledTimes(1);
    expect(factorySpy).toHaveBeenCalledWith({
      url: "redis://redis:6379",
      socket: { connectTimeout: 2000 },
    });

    expect(actualRedisStore.client).toBe(fakeClient);

    expect(fakeClientConnectMock).toHaveBeenCalledTimes(1);

    expect(loggerSpy).toHaveBeenCalledWith(
      "SessionManager.getRedisStore",
      "Creating Redis Client",
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      "SessionManager.getRedisStore",
      "Connected to Redis server successfully.",
    );

    expect(fakeClientOnMock).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
    );
  });

  it("logs instead of throwing when the redis client emits an error event", async () => {
    const envConfig = {
      secret: "test-secret",
      name: "session-name",
      redis_url: "redis://redis:6379",
      resave: false,
      saveUninitialized: false,
      maxAge: MS_IN_TWELVE_HOURS,
      secure: false,
      httpOnly: true,
      redis: {},
    };

    let registeredErrorHandler: ((err: unknown) => void) | undefined;
    const fakeClient = {
      connect: mock().mockResolvedValue(undefined),
      on: mock((event: string, handler: (err: unknown) => void) => {
        if (event === "error") {
          registeredErrorHandler = handler;
        }
      }),
    } as unknown as RedisClientType;

    const fakeLogger = new Logger();
    const logErrorSpy = spyOn(fakeLogger, "logError");

    const manager = new SessionManager();
    manager.setClientFactory(() => fakeClient);
    manager.setLogger(fakeLogger);

    await manager.getRedisStore(envConfig);

    const connectionRefused = new Error("connect ECONNREFUSED 127.0.0.1:6380");
    expect(() => registeredErrorHandler?.(connectionRefused)).not.toThrow();

    expect(logErrorSpy).toHaveBeenCalledWith(
      "SessionManager.getRedisStore",
      "Redis client error",
      connectionRefused,
    );
  });

  it("starts anyway and logs an error if the redis client fails to connect at startup", async () => {
    const envConfig = {
      secret: "test-secret",
      name: "session-name",
      redis_url: "redis://redis:6379",
      resave: false,
      saveUninitialized: false,
      maxAge: 43200000,
      secure: false,
      httpOnly: true,
      redis: {},
    };

    const connectError = new Error("Connection timeout");
    const fakeClient = {
      connect: mock().mockRejectedValue(connectError),
      on: mock(),
    } as unknown as RedisClientType;

    const fakeLogger = new Logger();
    const logErrorSpy = spyOn(fakeLogger, "logError");
    const logInfoSpy = spyOn(fakeLogger, "logInfo");

    const manager = new SessionManager();
    manager.setClientFactory(() => fakeClient);
    manager.setLogger(fakeLogger);

    const store = await manager.getRedisStore(envConfig);

    expect(store.client).toBe(fakeClient);

    expect(logErrorSpy).toHaveBeenCalledWith(
      "SessionManager.getRedisStore",
      "Redis unreachable at startup; starting anyway",
      connectError,
    );

    expect(logInfoSpy).not.toHaveBeenCalledWith(
      "SessionManager.getRedisStore",
      "Connected to Redis server successfully.",
    );
  });
});
