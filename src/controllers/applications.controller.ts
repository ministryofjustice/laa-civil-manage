import type { NextFunction, Request, Response } from "express";
import { getApplications } from "#src/models/applications.models.js";
import { logger } from "#src/utils/logger.js";

export const getApplicationsList = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applications = await getApplications();
    res.json(applications);
  } catch (error) {
    logger.logError(
      "getApplicationsList",
      "Failed to fetch applications",
      error,
      req,
    );
    next(error);
  }
};
