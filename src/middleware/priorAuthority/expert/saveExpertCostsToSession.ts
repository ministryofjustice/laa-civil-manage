import type { ExpertCostsBody } from "#src/types/priorAuthority/expert.js";
import { mapExpertCostsBodyToPriorAuthority } from "#src/utils/mappers/priorAuthorityMapper.js";
import type { NextFunction, Request, Response } from "express";

export const saveExpertCostsToSession = (
  req: Request<unknown, unknown, ExpertCostsBody>,
  _res: Response,
  next: NextFunction,
): void => {
  req.session.priorAuthority ??= { expert: {}, counsel: {} };
  const priorAuthorityData = req.session.priorAuthority;

  req.session.priorAuthority = {
    ...priorAuthorityData,
    expert: {
      ...priorAuthorityData.expert,
      ...mapExpertCostsBodyToPriorAuthority(req.body),
    },
  };

  next();
};
