import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";

// const obj = {
//   "/pa-form/type-pa": ["PriorAuthorityType"],
// };

export const saveToSession =
  <TBody>(sessionKey: string, extractValue: (body: TBody) => unknown) =>
  (
    req: Request<unknown, unknown, TBody>, // Let the generic TBody define the whole req.body
    res: Response,
    next: NextFunction,
  ): void => {
    // 1. Run the function you pass in to grab the specific value
    const valueRead = extractValue(req.body);

    // 2. Merge it into the session safely without wiping out other properties
    req.session.priorAuthority = {
      ...req.session.priorAuthority,
      [sessionKey]: valueRead,
    };

    next();
  };
