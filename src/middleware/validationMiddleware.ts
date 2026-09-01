import type { Request, Response, NextFunction } from "express";
import z, { type ZodType } from "zod";

interface TreeifiedError {
  errors?: string[];
  properties?: Record<string, { errors?: string[] }>;
}

export function validateData<T>(
  schema:
    | ZodType
    | ((
        req: Request<unknown, unknown, FormData | T>,
        res: Response,
      ) => ZodType),
  route: string,
  getData: (req: Request<unknown, unknown, FormData | T>) => unknown = (req) =>
    req.body,
) {
  return (
    req: Request<unknown, unknown, FormData | T>,
    res: Response,
    next: NextFunction,
  ) => {
    const resolvedSchema =
      typeof schema === "function" ? schema(req, res) : schema;
    const result = resolvedSchema.safeParse(getData(req));

    if (result.success) {
      next();
    } else {
      const treeified = z.treeifyError(result.error) as TreeifiedError;

      const fieldErrors = treeified.properties || {};
      const errors = Object.entries(fieldErrors).flatMap(([key, value]) => {
        const messages =
          value.errors && value.errors.length > 0
            ? value.errors
            : ["Invalid input"];
        return messages.map((message) => ({
          text: message,
          href: `#${key}`,
        }));
      });

      const errorMap: Record<string, string> = {};
      Object.entries(fieldErrors).forEach(([key, value]) => {
        if (value.errors && value.errors.length > 0) {
          errorMap[key] = value.errors[0];
        }
      });

      res.render(route, {
        errors,
        errorMap,
        values: req.body,
      });
    }
  };
}
