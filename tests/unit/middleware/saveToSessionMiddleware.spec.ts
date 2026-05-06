import { saveToSession } from "#src/middleware/saveToSession.js";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";
import { describe, it, expect, mock } from "bun:test";
import type { Request, Response } from "express";

describe("saveToSession middleware", () => {
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

    const middleware = saveToSession<
      { PriorAuthorityType: PriorAuthorityType },
      "type"
    >("type", (body) => body.PriorAuthorityType);

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockRequest.session.priorAuthority).toBeDefined();
    expect(mockRequest.session.priorAuthority).toEqual({ type: "Expert" });

    expect(mockNext).toHaveBeenCalled();
  });

  it("should merge with existing priorAuthority data without overwriting", () => {
    const mockRequest = {
      body: {
        PriorAuthorityType: "Expense",
      },
      session: {
        priorAuthority: {},
      },
    } as unknown as Request<
      unknown,
      unknown,
      { PriorAuthorityType: PriorAuthorityType }
    >;

    const mockResponse = {} as Response;
    const mockNext = mock(() => {});

    // TODO - AP-6773 - update this so that there's something else in the session before we act
    const middleware = saveToSession<
      { PriorAuthorityType: PriorAuthorityType },
      "type"
    >("type", (body) => body.PriorAuthorityType);

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockRequest.session.priorAuthority).toEqual({
      type: "Expense",
    });
    expect(mockNext).toHaveBeenCalled();
  });
});
