import { describe, expect, it, mock, spyOn, afterEach } from "bun:test";
import type { Request, Response } from "express";
import { logger } from "#src/utils/logger.js";
import { config } from "#src/config.js";
import * as healthModels from "#src/models/healthModels.js";
import {
  getHealth,
  getProbeStatus,
} from "#src/controllers/healthController.js";

const NO_CACHE = "no-cache, no-store, max-age=0, must-revalidate";
const UP = { status: "UP", components: { redis: { status: "UP" } } };
const DOWN = { status: "DOWN", components: { redis: { status: "DOWN" } } };

const createResponse = (): {
  res: Response;
  status: ReturnType<typeof mock>;
  json: ReturnType<typeof mock>;
  set: ReturnType<typeof mock>;
} => {
  const json = mock();
  const status = mock(() => ({ json }));
  const set = mock();
  const res = { status, set } as unknown as Response;
  return { res, status, json, set };
};

describe("getHealth", () => {
  const originalEnvironment = config.app.environment;
  const originalRedisUrl = config.session.redis_url;

  afterEach(() => {
    mock.restore();
    config.app.environment = originalEnvironment;
    config.session.redis_url = originalRedisUrl;
  });

  it("returns 200 UP when Redis responds with PONG", async () => {
    config.session.redis_url = "redis://localhost:6379";
    spyOn(healthModels, "pingRedis").mockResolvedValue("PONG");
    const logErrorSpy = spyOn(logger, "logError").mockImplementation(() => {});
    const { res, status, json, set } = createResponse();

    await getHealth({} as Request, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(UP);
    expect(set).toHaveBeenCalledWith("Cache-Control", NO_CACHE);
    expect(logErrorSpy).not.toHaveBeenCalled();
  });

  it("returns 503 DOWN and logs the error when Redis is unreachable", async () => {
    config.session.redis_url = "redis://localhost:6379";
    const redisError = new Error("connect ECONNREFUSED 127.0.0.1:6379");
    spyOn(healthModels, "pingRedis").mockRejectedValue(redisError);
    const logErrorSpy = spyOn(logger, "logError").mockImplementation(() => {});
    const { res, status, json, set } = createResponse();

    await getHealth({} as Request, res);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(DOWN);
    expect(set).toHaveBeenCalledWith("Cache-Control", NO_CACHE);
    expect(logErrorSpy).toHaveBeenCalledWith(
      "healthController.getHealth",
      "Redis health check failed",
      redisError,
    );
  });

  it("returns 503 DOWN when Redis responds with something other than PONG", async () => {
    config.session.redis_url = "redis://localhost:6379";
    spyOn(healthModels, "pingRedis").mockResolvedValue("UNEXPECTED");
    spyOn(logger, "logError").mockImplementation(() => {});
    const { res, status, json } = createResponse();

    await getHealth({} as Request, res);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(DOWN);
  });

  it("returns 200 UP without pinging Redis when SESSION_REDIS_URL is missing in development", async () => {
    config.app.environment = "development";
    config.session.redis_url = undefined;
    const pingSpy = spyOn(healthModels, "pingRedis");
    const { res, status, json } = createResponse();

    await getHealth({} as Request, res);

    expect(pingSpy).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(UP);
  });

  it("returns 503 DOWN when SESSION_REDIS_URL is missing outside development", async () => {
    config.app.environment = "production";
    config.session.redis_url = undefined;
    const logErrorSpy = spyOn(logger, "logError").mockImplementation(() => {});
    const { res, status, json } = createResponse();

    await getHealth({} as Request, res);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(DOWN);
    expect(logErrorSpy).toHaveBeenCalledWith(
      "healthController.getHealth",
      "Redis health check failed",
      expect.objectContaining({
        message: "SESSION_REDIS_URL is not configured",
      }),
    );
  });
});

describe("getProbeStatus", () => {
  afterEach(() => {
    mock.restore();
  });

  it("returns a static 200 UP without checking Redis", () => {
    const pingSpy = spyOn(healthModels, "pingRedis");
    const { res, status, json, set } = createResponse();

    getProbeStatus({} as Request, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ status: "UP" });
    expect(set).toHaveBeenCalledWith("Cache-Control", NO_CACHE);
    expect(pingSpy).not.toHaveBeenCalled();
  });
});
