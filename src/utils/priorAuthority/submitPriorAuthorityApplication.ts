import type { NextFunction, Request, Response } from "express";
import { submitPriorAuthorityDraft } from "#src/models/priorAuthorityModels.js";
import { logger } from "#src/utils/logger.js";

export const submitPriorAuthorityApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
  confirmationPath: string,
): Promise<void> => {
  const priorAuthorityId = req.session.priorAuthorityId;
  if (priorAuthorityId === undefined) {
    next(new Error("Cannot submit prior authority: no draft in session"));
    return;
  }

  try {
    const response = await submitPriorAuthorityDraft(priorAuthorityId);
    req.session.priorAuthorityId = undefined;
    logger.logInfo(
      "submitPriorAuthorityApplication",
      `Prior authority submitted: priorAuthorityId=${response.priorAuthorityId} submittedAt=${response.submittedAt}`,
      req,
    );

    res.redirect(confirmationPath);
  } catch (error) {
    logger.logError(
      "submitPriorAuthorityApplication",
      "Failed to submit prior authority",
      error,
      req,
    );
    next(error);
  }
};
