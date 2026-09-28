import type { Request, Response } from "express";
import { logger } from "#src/utils/logger.js";
import { config } from "#src/config.js";
import * as healthModels from "#src/models/healthModels.js";

const SUCCESSFUL_REQUEST = 200;
const SERVICE_UNAVAILABLE = 503;
const CACHE_CONTROL_HEADER = "no-cache, no-store, max-age=0, must-revalidate";

type HealthStatus = "UP" | "DOWN";

const healthPayload = (
  status: HealthStatus,
): {
  status: HealthStatus;
  components: { redis: { status: HealthStatus } };
} => ({
  status,
  components: { redis: { status } },
});

const isRedisOptional = (): boolean =>
  !healthModels.isRedisConfigured() && config.app.environment === "development";

const assertRedisResponds = async (): Promise<void> => {
  const reply = await healthModels.pingRedis();
  if (reply !== "PONG") {
    throw new Error(`Unexpected Redis PING reply: ${reply}`);
  }
};

export const getHealth = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.set("Cache-Control", CACHE_CONTROL_HEADER);

  try {
    if (!isRedisOptional()) {
      await assertRedisResponds();
    }
    res.status(SUCCESSFUL_REQUEST).json(healthPayload("UP"));
  } catch (error: unknown) {
    logger.logError(
      "healthController.getHealth",
      "Redis health check failed",
      error,
    );
    res.status(SERVICE_UNAVAILABLE).json(healthPayload("DOWN"));
  }
};

export const getProbeStatus = (_req: Request, res: Response): void => {
  res.set("Cache-Control", CACHE_CONTROL_HEADER);
  res.status(SUCCESSFUL_REQUEST).json({ status: "UP" });
};
