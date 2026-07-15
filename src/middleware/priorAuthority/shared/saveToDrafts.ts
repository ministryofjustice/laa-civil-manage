import { DEV_APPLICATION_ID } from "#src/constants.js";
import { postDraft, putDraft } from "#src/models/draftsModels.js";
import { logger } from "#src/utils/logger.js";
import type { NextFunction, Request, Response } from "express";
import z from "zod";

const actionSchema = z.object({ _action: z.string().optional() });

type DraftBody = Parameters<typeof postDraft>[0]["draftBody"];
type SessionWithDraftId = Request["session"] & { draftId?: string };

const getDraftBodyFromSession = (req: Request): DraftBody => {
  if (req.session.priorAuthorityType === "Counsel") {
    return {
      type: "Counsel",
      ...req.session.priorAuthorityCounsel,
    };
  }

  if (req.session.priorAuthorityType === "Expert") {
    return {
      type: "Expert",
      ...req.session.priorAuthorityExpert,
    };
  }

  return {};
};

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
  const session = req.session as SessionWithDraftId;
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
