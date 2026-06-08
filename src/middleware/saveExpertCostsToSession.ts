import type {
  ExpertCostsBody,
  PriorAuthority,
} from "#src/types/prior-authority.js";
import { mapExpertCostsBodyToPriorAuthority } from "#src/utils/mappers/priorAuthorityMapper.js";
import type { NextFunction, Request, Response } from "express";

export const saveExpertCostsToSession = (
  req: Request<unknown, unknown, ExpertCostsBody>,
  _res: Response,
  next: NextFunction,
): void => {
  const priorAuthorityData: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};

  req.session.priorAuthority = {
    ...priorAuthorityData,
    ...mapExpertCostsBodyToPriorAuthority(req.body),
  };

  next();
};
