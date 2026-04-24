import { userSchema } from "#src/middleware/zod-validation/user.schema.js";
import type { Request, Response } from "express";
import { z } from "zod";

interface TreeifiedError {
  errors?: string[];
  properties?: Record<string, { errors?: string[] }>;
}

export default function postSubmit(
  req: Request<Record<string, never>, Record<string, never>, FormData>,
  res: Response,
): void {
  const result = userSchema.safeParse(req.body);

  if (!result.success) {
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

    res.render("pa-form/prototype", {
      errors,
      errorMap,
      values: req.body,
    });
    return;
  }
  res.send(`
    <div">
      <h1>Success!</h1>
    </div>
  `);
}
