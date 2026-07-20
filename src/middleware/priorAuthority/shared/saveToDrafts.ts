import { DEV_APPLICATION_ID } from "#src/constants.js";
import { postDraft, putDraft } from "#src/models/draftsModels.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import { logger } from "#src/utils/logger.js";
import type { NextFunction, Request, Response } from "express";
import z from "zod";

const actionSchema = z.object({ _action: z.string().optional() });

type DraftBody = Partial<PriorAuthority>;

const getDraftBodyFromSession = (req: Request): DraftBody =>
  req.session.priorAuthority ?? {};

export const saveToDrafts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { _action } = actionSchema.parse(req.body);
  const applicationId = DEV_APPLICATION_ID;

  if (_action !== "draft") {
    next();
    return;
  }

  const draftBody = getDraftBodyFromSession(req);
  const session = req.session;
  const existingDraftId = session.draftId;

  try {
    if (typeof existingDraftId === "string") {
      await putDraft({
        draftId: existingDraftId,
        applicationId,
        draftBody,
      });
    } else {
      const postedDraft = await postDraft({
        applicationId,
        draftBody,
      });
      session.draftId = postedDraft.draftId;
    }

    res.redirect("/prior-authority-form/prior-authority-type");
  } catch (error) {
    logger.logError("saveToDrafts", "Failed to create draft", error, req);
    throw error;
  }
};
