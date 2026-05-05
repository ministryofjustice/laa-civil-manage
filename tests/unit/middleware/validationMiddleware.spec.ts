import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { validateData } from "#src/middleware/validationMiddleware.js";
import { describe, it, expect, beforeEach, mock } from "bun:test";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";

describe("validateData middleware", () => {
  const testSchema = z.object({
    field1: z.number().min(1, "must be greater than 1"),
    field2: z.string({ error: "must be present" }),
  });

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} };
    res = { render: mock() };
    next = mock();
  });

  it("should call next() if validation passes", () => {
    req.body = { field1: 1, field2: "someString" };

    const middleware = validateData(testSchema, "/my-route");
    middleware(
      req as Request<
        Record<string, never>,
        Record<string, never>,
        FormData | PriorAuthorityType
      >,
      res as Response,
      next,
    );

    expect(next).toHaveBeenCalled();
    expect(res.render).not.toHaveBeenCalled();
  });

  it("should transform Zod errors into GOV.UK compliant error structures", () => {
    req.body = { field1: 0 };

    const middleware = validateData(testSchema, "/my-route");
    middleware(
      req as Request<
        Record<string, never>,
        Record<string, never>,
        FormData | PriorAuthorityType
      >,
      res as Response,
      next,
    );

    expect(next).not.toHaveBeenCalled();

    expect(res.render).toHaveBeenCalledWith("/my-route", {
      values: { field1: 0 },
      errorMap: {
        field1: "must be greater than 1",
        field2: "must be present",
      },
      errors: [
        {
          href: "#field1",
          text: "must be greater than 1",
        },
        {
          href: "#field2",
          text: "must be present",
        },
      ],
    });
  });
});
