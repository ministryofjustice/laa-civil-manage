import type { ExpertCostsBody } from "#src/types/priorAuthority/expert.js";
import { mapExpertCostsBodyToPriorAuthority } from "#src/utils/mappers/priorAuthorityMapper.js";
import type { NextFunction, Request, Response } from "express";

export const saveExpertCostsToSession = (
  req: Request<unknown, unknown, ExpertCostsBody>,
  _res: Response,
  next: NextFunction,
): void => {
  req.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} };
  const priorAuthorityData = req.priorAuthority;
  const costsFields = mapExpertCostsBodyToPriorAuthority(req.body);

  req.priorAuthority = {
    ...priorAuthorityData,
    expert: {
      ...priorAuthorityData.expert,
      ...costsFields,
    },
  };

  next();
};
