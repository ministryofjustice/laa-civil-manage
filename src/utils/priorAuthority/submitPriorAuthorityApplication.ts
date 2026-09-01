import type { NextFunction, Request, Response } from "express";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import { DEV_APPLICATION_ID, DEV_LAA_REFERENCE } from "#src/constants.js";
import { getApplicationFromSession } from "#src/middleware/priorAuthority/shared/applicationSession.js";
import { deleteDraft } from "#src/models/draftsModels.js";
import { submitPriorAuthority } from "#src/models/priorAuthorityModels.js";
import { logger } from "#src/utils/logger.js";
import { mapPriorAuthorityToApplicationRequest } from "#src/utils/mappers/priorAuthorityApplicationMapper.js";

export const submitPriorAuthorityApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
  confirmationPath: string,
): Promise<void> => {
  // Prefer the application stored on the session; fall back to the dev ID until
  // every entry point into this flow stores the parent application.
  const application = getApplicationFromSession(req);
  const applicationId = application?.applicationId ?? DEV_APPLICATION_ID;
  const laaReference = application?.laaReference ?? DEV_LAA_REFERENCE;
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority: PriorAuthority = req.session.priorAuthority;

  try {
    const payload = mapPriorAuthorityToApplicationRequest(
      applicationId,
      laaReference,
      priorAuthority,
    );
    const response = await submitPriorAuthority(payload);
    req.session.priorAuthority = undefined;
    logger.logInfo(
      "submitPriorAuthorityApplication",
      `Prior authority application submitted: submissionId=${response.submissionId} status=${response.status}`,
      req,
    );

    if (req.session.draftId) {
      const deletedDraftId = req.session.draftId;
      await deleteDraft(req.session.draftId);
      req.session.draftId = undefined;
      logger.logInfo(
        "submitPriorAuthorityApplication",
        `Deleted draft with ID: ${deletedDraftId}`,
        req,
      );
    }

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
