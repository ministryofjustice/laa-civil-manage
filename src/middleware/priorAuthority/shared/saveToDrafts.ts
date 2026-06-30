import { DEV_APPLICATION_ID } from "#src/constants.js";
import { postDraft, putDraft } from "#src/models/draftsModels.js";
import { logger } from "#src/utils/logger.js";
import type { NextFunction, Request, Response } from "express";
import z from "zod";

const actionSchema = z.object({ _action: z.string().optional() });

export const saveToDrafts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { _action } = actionSchema.parse(req.body);
  const applicationId = DEV_APPLICATION_ID; // TODO: Replace with actual application ID when available

  if (_action === "draft") {
    try {
      if (req.session.draftId) {
        await putDraft({
          draftId: req.session.draftId,
          applicationId,
          draftBody: req.session.priorAuthority ?? {},
        });
      } else {
        const postedDraft = await postDraft({
          applicationId,
          draftBody: req.session.priorAuthority ?? {},
        });
        req.session.draftId = postedDraft.draftId;
      }

      res.redirect("/prior-authority-form/start-page");
    } catch (error) {
      logger.logError("saveToDrafts", "Failed to create draft", error, req);
      throw error;
    }
  } else {
    next();
  }
};
