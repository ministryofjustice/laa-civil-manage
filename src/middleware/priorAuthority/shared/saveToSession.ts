import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthorityDisbursement } from "#src/types/priorAuthority/disbursement.js";
import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import { DEV_APPLICATION_ID } from "#src/constants.js";
import { getApplicationFromSession } from "#src/middleware/priorAuthority/shared/applicationSession.js";
import {
  getPriorAuthorityDraft,
  updatePriorAuthorityDraft,
} from "#src/models/priorAuthorityModels.js";
import {
  buildPriorAuthorityDraftDto,
  hydratePriorAuthority,
} from "#src/utils/mappers/priorAuthorityDraftMapper.js";
import type { PriorAuthoritySection } from "#src/utils/documentUploadHelpers.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import "express-session";

interface HasPriorAuthority {
  priorAuthority?: PriorAuthority;
}

const ensurePriorAuthority = (req: HasPriorAuthority): PriorAuthority =>
  (req.priorAuthority ??= { expert: {}, counsel: {}, disbursement: {} });

export const loadPriorAuthority =
  (section: PriorAuthoritySection): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const priorAuthorityId = req.session.priorAuthorityId;
    if (priorAuthorityId === undefined) {
      res.redirect(`/prior-authority/${section}`);
      return;
    }

    getPriorAuthorityDraft(priorAuthorityId)
      .then(({ draft }) => {
        const priorAuthority = hydratePriorAuthority(draft);
        req.priorAuthority = priorAuthority;
        res.locals.priorAuthority = {
          type: priorAuthority.type,
          ...priorAuthority[section],
          uploadedDocuments: req.session.uploadedDocuments?.[section] ?? [],
        };
        next();
      })
      .catch(next);
  };

export const persistPriorAuthority = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const priorAuthorityId = req.session.priorAuthorityId;
  const priorAuthority = req.priorAuthority;
  if (priorAuthorityId === undefined || priorAuthority === undefined) {
    next(new Error("Cannot persist prior authority: no draft loaded"));
    return;
  }

  const applicationId =
    getApplicationFromSession(req)?.applicationId ?? DEV_APPLICATION_ID;
  const draft = buildPriorAuthorityDraftDto(applicationId, priorAuthority);

  updatePriorAuthorityDraft(priorAuthorityId, draft)
    .then(() => {
      next();
    })
    .catch(next);
};

const saveSectionField =
  <Section extends "expert" | "counsel" | "disbursement">(section: Section) =>
  <Field extends keyof PriorAuthority[Section], TBody>(
    field: Field,
    extractValue: (body: TBody) => PriorAuthority[Section][Field],
  ): RequestHandler<unknown, unknown, TBody> =>
  (
    req: Request<unknown, unknown, TBody>,
    _res: Response,
    next: NextFunction,
  ): void => {
    const value = extractValue(req.body);
    ensurePriorAuthority(req)[section][field] = value;
    next();
  };

export const saveExpert = <Field extends keyof PriorAuthorityExpert, TBody>(
  field: Field,
  extractValue: (body: TBody) => PriorAuthorityExpert[Field],
): RequestHandler<unknown, unknown, TBody> =>
  saveSectionField("expert")(field, extractValue);

export const saveCounsel = <Field extends keyof PriorAuthorityCounsel, TBody>(
  field: Field,
  extractValue: (body: TBody) => PriorAuthorityCounsel[Field],
): RequestHandler<unknown, unknown, TBody> =>
  saveSectionField("counsel")(field, extractValue);

export const saveDisbursement = <
  Field extends keyof PriorAuthorityDisbursement,
  TBody,
>(
  field: Field,
  extractValue: (body: TBody) => PriorAuthorityDisbursement[Field],
): RequestHandler<unknown, unknown, TBody> =>
  saveSectionField("disbursement")(field, extractValue);
