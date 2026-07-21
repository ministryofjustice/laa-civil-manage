import type { PriorAuthorityCounsel } from "#src/types/priorAuthority/counsel.js";
import type { PriorAuthorityExpert } from "#src/types/priorAuthority/expert.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import "express-session";

const ensurePriorAuthority = (
  session: Request["session"],
): PriorAuthority => (session.priorAuthority ??= { expert: {}, counsel: {} });

/**
 * Saves a single top-level field (e.g. "type") onto the prior authority session.
 */
export function saveToSession<TBody, TKey extends keyof PriorAuthority>(
  sessionKey: TKey,
  extractValue: (body: TBody) => PriorAuthority[TKey],
): RequestHandler<unknown, unknown, TBody> {
  return (
    req: Request<unknown, unknown, TBody>,
    _res: Response,
    next: NextFunction,
  ): void => {
    ensurePriorAuthority(req.session)[sessionKey] = extractValue(req.body);
    next();
  };
}

const saveSectionField =
  <Section extends "expert" | "counsel">(section: Section) =>
  <Field extends keyof PriorAuthority[Section], TBody>(
    field: Field,
    extractValue: (body: TBody) => PriorAuthority[Section][Field],
  ): RequestHandler<unknown, unknown, TBody> =>
  (
    req: Request<unknown, unknown, TBody>,
    _res: Response,
    next: NextFunction,
  ): void => {
    ensurePriorAuthority(req.session)[section][field] = extractValue(req.body);
    next();
  };

/**
 * Saves a single field within the `expert` section of the prior authority
 * session, leaving all other expert fields untouched.
 */
export const saveExpert = <Field extends keyof PriorAuthorityExpert, TBody>(
  field: Field,
  extractValue: (body: TBody) => PriorAuthorityExpert[Field],
): RequestHandler<unknown, unknown, TBody> =>
  saveSectionField("expert")(field, extractValue);

/**
 * Saves a single field within the `counsel` section of the prior authority
 * session, leaving all other counsel fields untouched.
 */
export const saveCounsel = <Field extends keyof PriorAuthorityCounsel, TBody>(
  field: Field,
  extractValue: (body: TBody) => PriorAuthorityCounsel[Field],
): RequestHandler<unknown, unknown, TBody> =>
  saveSectionField("counsel")(field, extractValue);
