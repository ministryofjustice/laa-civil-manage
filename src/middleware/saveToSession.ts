import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";

const obj = {
  "/pa-form/type-pa": ["PriorAuthorityType"],
};

export const saveToSession =
  <T>(key: string) =>
  (
    req: Request<unknown, unknown, { payload: T }>,
    res: Response,
    next: NextFunction,
  ): void => {
    const fields = obj[req.path];

    if (fields) {
      fields.forEach((key) => {
        const value = req.body[key];
        if (value) {
          req.session[key] = value;
        }
      });
    }
    next();
  };
