import { getDrafts } from "#src/models/drafts.models.js";
import { logger } from "#src/utils/logger.js";
import { mapDraftBodyToPriorAuthority } from "#src/utils/mappers/priorAuthorityDraftsMapper.js";
import type {
  Request,
  Response,
  NextFunction,
} from "#node_modules/@types/express";

export const saveToSessionFromDrafts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { draftId } = req.query;

  if (typeof draftId !== "string") {
    next();
    return;
  }

  if (!req.session.userId) {
    logger.logError(
      "saveToSessionFromDrafts",
      "No user ID in session, cannot load draft",
      undefined,
      req,
    );
    next();
    return;
  }

  try {
    // TODO we just take the first draft for now, but this should be updated to find the correct draft based on the applicationId when that functionality is available in the backend
    const drafts = await getDrafts({});
    if (drafts.length === 0) {
      logger.logInfo(
        "saveToSessionFromDrafts",
        `No draft found for draftId ${draftId}`,
        req,
      );
      next();
      return;
    }
    const draft = drafts[0];
    req.session.priorAuthority = mapDraftBodyToPriorAuthority(draft.draft);
    req.session.draftId = draft.draftId;
    logger.logInfo(
      "saveToSessionFromDrafts",
      `Loaded draft ${draftId} into session`,
      req,
    );
  } catch (error) {
    logger.logError(
      "saveToSessionFromDrafts",
      `Failed to load draft ${draftId}`,
      error,
      req,
    );
  }

  next();
};
