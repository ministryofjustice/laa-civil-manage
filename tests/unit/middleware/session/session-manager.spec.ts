import { strict as assert } from "node:assert";
import SessionManager from "#src/middleware/session/session-manager.js";
import sinon from "sinon";
import type { RedisClientType } from "redis";
import type { RedisStore } from "connect-redis";
import { Logger } from "#src/utils/logger.js";
import { MS_IN_TWELVE_HOURS } from "#src/constants/times.js";
import { getSessionConfigTestCases } from "#tests/unit/middleware/session/session-manager-fixture.js";

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

      assert.deepEqual(actual, expected);
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
    const fakeClient = { connect: () => {} } as RedisClientType;
    const clientSpy = sinon.spy(fakeClient, "connect");

    const fakeLogger = new Logger();
    const loggerSpy = sinon.spy(fakeLogger, "logInfo");

    const objectToMock = {
      clientFactory: () => fakeClient,
    };
    const mocker = sinon.mock(objectToMock);
    mocker
      .expects("clientFactory")
      .once()
      .withArgs({ url: "redis://redis:6379" })
      .returns(fakeClient);

    const manager = new SessionManager();
    manager.setClientFactory(objectToMock.clientFactory);
    manager.setLogger(fakeLogger);

    const actualRedisStore: RedisStore = await manager.getRedisStore(envConfig);

    mocker.verify();
    assert.equal(actualRedisStore.client, fakeClient);
    assert.equal(clientSpy.calledOnce, true);
    assert(
      loggerSpy.calledWith(
        "SessionManager.getRedisStore",
        "Creating Redis Client",
      ),
    );
    assert(
      loggerSpy.calledWith(
        "SessionManager.getRedisStore",
        "Connected to Redis server successfully.",
      ),
    );
  });
});
