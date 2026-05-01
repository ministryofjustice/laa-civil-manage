import type { Request, Response } from "#node_modules/@types/express/index.js";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};

interface RequestWithCSRF extends Request {
  csrfToken?: () => string;
}

export const getPaTypePage = (req: RequestWithCSRF, res: Response): void => {
  const csrfToken =
    typeof req.csrfToken === "function" ? req.csrfToken() : undefined;
  res.render("pa-form/type-pa.njk", { csrfToken });
};

export interface PaTypeBody {
  PriorAuthorityType: PriorAuthorityType;
}

export const postPriorAuthorityType = (
  req: Request<unknown, unknown, PaTypeBody>,
  res: Response,
): void => {
  const priorAuthorityType = req.body.PriorAuthorityType;
  req.session.priorAuthority = { type: priorAuthorityType };
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};
