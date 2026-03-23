import SessionManager from "#src/middleware/session/session-manager.js";
import type { RedisClientType } from "redis";
import type { RedisStore } from "connect-redis";
import { Logger } from "#src/utils/logger.js";
import {
  getSessionConfigTestCases,
  MS_IN_TWELVE_HOURS,
} from "#tests/unit/middleware/session/session-manager-fixture.js";
import { describe, expect, it, mock, spyOn } from "bun:test";
import type { SessionOptions } from "#node_modules/@types/express-session/index.js";

describe("getSessionConfig", () => {
  getSessionConfigTestCases.forEach(({ testName, envConfig, expected }) => {
    it(testName, async () => {
      const fakeStore = {} as RedisStore;
      const fakeRedisStoreFactory: () => Promise<RedisStore> = async () =>
        await new Promise((resolve) => {
          resolve(fakeStore);
        });

      const fakeClient = { connect: () => {} } as RedisClientType;
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

describe("getRedisStore", () => {
  it("should return a redis store with a connected client", async () => {
    const envConfig = {
      secret: "test-secret",
      name: "session-name",
      redis_url: "redis://redis:6379",
      resave: false,
      saveUninitialized: false,
      maxAge: MS_IN_TWELVE_HOURS,
      redis: {},
    };

    const fakeClientConnectMock = mock();
    const fakeClient = {
      connect: fakeClientConnectMock,
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
    expect(factorySpy).toHaveBeenCalledWith({ url: "redis://redis:6379" });

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
  });
});
