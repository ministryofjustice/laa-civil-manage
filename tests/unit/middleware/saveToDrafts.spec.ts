import { saveToDrafts } from "#src/middleware/priorAuthority/shared/saveToDrafts.js";
import { postDraft, putDraft } from "#src/models/draftsModels.js";
import { describe, it, expect, mock, beforeEach } from "bun:test";
import type { NextFunction, Request, Response } from "express";

void mock.module("#src/models/draftsModels.js", () => ({
  postDraft: mock(
    async () => await Promise.resolve({ draftId: "new-draft-id" }),
  ),
  putDraft: mock(async () => {
    await Promise.resolve();
  }),
}));

void mock.module("#src/constants.js", () => ({
  DEV_APPLICATION_ID: "test-application-id",
}));

describe("saveToDrafts middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let redirect: ReturnType<typeof mock>;

  beforeEach(() => {
    redirect = mock(() => {});
    req = {
      body: {},
      session: {
        userId: "user-123",
        priorAuthority: { type: "Expert", expert: {}, counsel: {} },
      } as Request["session"],
    };
    res = { redirect };
    next = mock();
    (postDraft as ReturnType<typeof mock>).mockClear();
    (putDraft as ReturnType<typeof mock>).mockClear();
  });

  it("calls next() when _action is 'continue'", async () => {
    req.body = { _action: "continue" };

    await saveToDrafts(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("calls next() when _action is absent", async () => {
    await saveToDrafts(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("calls postDraft with session data and redirects when no draftId exists", async () => {
    req.body = { _action: "draft" };

    await saveToDrafts(req as Request, res as Response, next);

    expect(postDraft).toHaveBeenCalledWith({
      applicationId: "test-application-id",
      draftBody: { type: "Expert", expert: {}, counsel: {} },
    });
    expect(redirect).toHaveBeenCalledWith("/applications");
    expect(next).not.toHaveBeenCalled();
  });

  it("calls putDraft with the existing draftId and redirects", async () => {
    req.body = { _action: "draft" };
    req.session = {
      userId: "user-123",
      priorAuthority: { type: "Expert", expert: {}, counsel: {} },
      draftId: "existing-id",
    } as Request["session"];

    await saveToDrafts(req as Request, res as Response, next);

    expect(putDraft).toHaveBeenCalledWith({
      draftId: "existing-id",
      applicationId: "test-application-id",
      draftBody: { type: "Expert", expert: {}, counsel: {} },
    });
    expect(redirect).toHaveBeenCalledWith("/applications");
    expect(next).not.toHaveBeenCalled();
  });

  it("falls back to an empty object when priorAuthority is not in session", async () => {
    req.body = { _action: "draft" };
    req.session = { userId: "user-123" } as Request["session"];

    await saveToDrafts(req as Request, res as Response, next);

    expect(postDraft).toHaveBeenCalledWith({
      applicationId: "test-application-id",
      draftBody: { expert: {}, counsel: {}, disbursement: {} },
    });
  });

  it("throws when the draft API call fails", async () => {
    req.body = { _action: "draft" };
    (postDraft as ReturnType<typeof mock>).mockImplementationOnce(
      async () => await Promise.reject(new Error("API unavailable")),
    );

    let caughtError: unknown;
    try {
      await saveToDrafts(req as Request, res as Response, next);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe("API unavailable");
  });
});
