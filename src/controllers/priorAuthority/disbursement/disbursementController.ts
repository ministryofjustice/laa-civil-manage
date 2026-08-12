import { getApplicationFromSession } from "#src/middleware/priorAuthority/shared/applicationSession.js";
import type { Request, Response } from "express";

const startDisbursementJourney = (req: Request): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };

  req.session.priorAuthority = {
    ...req.session.priorAuthority,
    type: "Disbursement",
    expert: {},
    counsel: {},
  };
};

export const getDisbursementLandingPage = (
  req: Request,
  res: Response,
): void => {
  const application = getApplicationFromSession(req);

  if (!application) {
    res.redirect("/applications");
    return;
  }
  startDisbursementJourney(req);

  res.render("priorAuthority/disbursement/disbursementLandingPage", {
    applicationId: application.applicationId,
  });
};

export const getDisbursementDetailsPage = (
  req: Request,
  res: Response,
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthority = req.session.priorAuthority.disbursement;
  res.render("priorAuthority/disbursement/disbursementDetail", {
    priorAuthority,
  });
};

export const postDisbursementDetailsPage = (
  req: Request,
  res: Response,
): void => {
  res.redirect("/prior-authority/disbursement/details");
};
