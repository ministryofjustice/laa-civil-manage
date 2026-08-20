import type { Request, Response } from "#node_modules/@types/express/index.js";
import type { PriorAuthorityType } from "#src/types/priorAuthority/shared.js";
import {
  getApplicationFromSession,
  clearApplicationFromSession,
} from "#src/middleware/priorAuthority/shared/applicationSession.js";

export const postPriorAuthorityType = (
  req: Request<unknown, unknown, { PriorAuthorityType: PriorAuthorityType }>,
  res: Response,
): void => {
  switch (req.body.PriorAuthorityType) {
    case "Expert": {
      res.redirect("/prior-authority/expert");
      break;
    }
    case "Counsel": {
      res.redirect("/prior-authority/counsel");
      break;
    }
    case "Disbursement": {
      res.redirect("/prior-authority/disbursement");
      break;
    }
  }
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  const { applicationId, laaReference } = getApplicationFromSession(req) ?? {};
  clearApplicationFromSession(req);

  res.render("priorAuthority/confirmationPage", {
    applicationId,
    laaReference,
  });
};
