import { savePriorAuthorityType } from "#src/middleware/priorAuthority/shared/saveToSession.js";
import type { PriorAuthorityType } from "#src/types/priorAuthority/shared.js";
import { describe, it, expect, mock } from "bun:test";
import type { Request, Response } from "express";

describe("savePriorAuthorityType middleware", () => {
  it("should extract the value, save it to the session, and call next()", () => {
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

    const mockResponse = {} as Response;

    const mockNext = mock(() => {});

    const middleware = savePriorAuthorityType(
      (body: { PriorAuthorityType: PriorAuthorityType }) =>
        body.PriorAuthorityType,
    );

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockRequest.session.priorAuthority).toBeDefined();
    expect(mockRequest.session.priorAuthority).toEqual({
      type: "Expert",
      expert: {},
      counsel: {},
    });

    expect(mockNext).toHaveBeenCalled();
  });

  it("should merge with existing priorAuthority data without overwriting", () => {
    const mockRequest = {
      body: {
        PriorAuthorityType: "Disbursement",
      },
      session: {
        priorAuthority: { expert: {}, counsel: {} },
      },
    } as unknown as Request<
      unknown,
      unknown,
      { PriorAuthorityType: PriorAuthorityType }
    >;

    const mockResponse = {} as Response;
    const mockNext = mock(() => {});

    // TODO - AP-6773 - update this so that there's something else in the session before we act
    const middleware = savePriorAuthorityType(
      (body: { PriorAuthorityType: PriorAuthorityType }) =>
        body.PriorAuthorityType,
    );

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockRequest.session.priorAuthority).toEqual({
      type: "Disbursement",
      expert: {},
      counsel: {},
    });
    expect(mockNext).toHaveBeenCalled();
  });
});
