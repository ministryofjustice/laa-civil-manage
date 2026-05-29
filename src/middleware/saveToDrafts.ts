import { postDraft, putDraft } from "#src/models/drafts.models.js";
import { logger } from "#src/utils/logger.js";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import z from "zod";

const actionSchema = z.object({ _action: z.string().optional() });

export const saveToDrafts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { _action } = actionSchema.parse(req.body);

  if (_action === "draft") {
    try {
      if (req.session.draftId) {
        await putDraft({
          draftId: req.session.draftId,
          draftBody: req.session.priorAuthority ?? {},
        });
      } else {
        const postedDraft = await postDraft({
          applicationId: randomUUID(),
          draftBody: req.session.priorAuthority ?? {},
        });
        req.session.draftId = postedDraft.draftId;
      }

      res.redirect("/pa-form/start-page");
    } catch (error) {
      logger.logError("saveToDrafts", "Failed to create draft", error, req);
      throw error;
    }
  } else {
    next();
  }
};
