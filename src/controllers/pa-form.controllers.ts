import type { Request, Response } from "#node_modules/@types/express/index.js";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";
import { logger } from "#src/utils/logger.js";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};

export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

interface PaTypeBody {
  WhatTypeOfPA: PriorAuthorityType;
}

export const postPaType = (
  req: Request<unknown, unknown, PaTypeBody>,
  res: Response,
): void => {
  const priorAuthorityType = req.body.WhatTypeOfPA;
  req.session.priorAuthority = { type: priorAuthorityType };

  logger.logInfo(
    "PriorAuthorityType",
    JSON.stringify(req.session.priorAuthority),
  );
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};
