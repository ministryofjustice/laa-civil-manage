import type { Request, Response } from "express";

export const getCounselLandingPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/counsel/counselLandingPage");
};
