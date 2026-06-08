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

  // TODO - replace with getDraftById once implemented

  try {
    const drafts = await getDrafts({});
    const draft = drafts.find((draft) => draft.draftId === draftId);
    if (!draft) {
      logger.logInfo(
        "saveToSessionFromDrafts",
        `No draft found for draftId ${draftId}`,
        req,
      );
      next();
      return;
    }

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
