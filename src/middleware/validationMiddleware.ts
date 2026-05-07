import type { Request, Response, NextFunction } from "express";
import z, { type ZodType } from "zod";

interface TreeifiedError {
  errors?: string[];
  properties?: Record<string, { errors?: string[] }>;
}

export function validateData<T>(schema: ZodType, route: string) {
  return (
    req: Request<unknown, unknown, FormData | T>,
    res: Response,
    next: NextFunction,
  ) => {
    const result = schema.safeParse(req.body);

    if (result.success) {
      next();
    } else {
      const treeified = z.treeifyError(result.error) as TreeifiedError;

      const fieldErrors = treeified.properties || {};
      const errors = Object.entries(fieldErrors).map(([key, value]) => {
        const errorMessage = value.errors?.[0] || "Invalid input";
        return {
          text: errorMessage,
          href: `#${key}`,
        };
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
