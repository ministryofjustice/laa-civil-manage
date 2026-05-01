import { postPriorAuthorityType } from "#src/controllers/pa-form.controller.js";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";
import { describe, it, expect } from "bun:test";
import type { Request, Response } from "express";

describe("pa-form controller", () => {
  it("should set prior authority type on the session when it is posted", () => {
    const mockRequest = {
      body: {
        PriorAuthorityType: "Expert",
      },
      session: {},
    } as unknown as Request<
      unknown,
      unknown,
      { PriorAuthorityType: PriorAuthorityType }
    >;

    const mockResponse = {} as unknown as Response;

    postPriorAuthorityType(mockRequest, mockResponse);

    expect(mockRequest.session.priorAuthority).toBeDefined();
    expect(mockRequest.session.priorAuthority).toEqual({ type: "Expert" });
  });
});
