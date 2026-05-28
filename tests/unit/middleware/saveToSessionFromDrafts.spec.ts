import { saveToSessionFromDrafts } from "#src/middleware/saveToSessionFromDrafts.js";
import { getDrafts } from "#src/models/drafts.models.js";
import { describe, it, expect, mock, beforeEach } from "bun:test";
import type { NextFunction, Request, Response } from "express";

void mock.module("#src/models/drafts.models.js", () => ({
  getDrafts: mock(
    async () =>
      await Promise.resolve([
        { draftId: "draft-123", draftBody: { type: "Expert" } },
      ]),
  ),
}));

const makeRequest = (overrides: object = {}): Request =>
  ({
    query: { draftId: "draft-123" },
    session: { userId: "user-123" },
    ...overrides,
  }) as unknown as Request;

describe("saveToSessionFromDrafts middleware", () => {
  const res = {} as Response;

  beforeEach(() => {
    (getDrafts as ReturnType<typeof mock>).mockClear();
  });

  it("calls next() without fetching if draftId query param is absent", async () => {
    const req = makeRequest({ query: {} });
    const next: NextFunction = mock(() => {});

    await saveToSessionFromDrafts(req, res, next);

    expect(getDrafts).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("calls next() without fetching if userId is not in session", async () => {
    const req = makeRequest({ session: {} });
    const next: NextFunction = mock(() => {});

    await saveToSessionFromDrafts(req, res, next);

    expect(getDrafts).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("loads the draft into session and calls next()", async () => {
    const req = makeRequest();
    const next: NextFunction = mock(() => {});

    await saveToSessionFromDrafts(req, res, next);

    expect(getDrafts).toHaveBeenCalledWith({ userId: "user-123" });
    expect(req.session.priorAuthority).toEqual({ type: "Expert" });
    expect(req.session.draftId).toBe("draft-123");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("still calls next() if getDrafts throws", async () => {
    (getDrafts as ReturnType<typeof mock>).mockRejectedValueOnce(
      new Error("API unavailable"),
    );

    const req = makeRequest();
    const next: NextFunction = mock(() => {});

    await saveToSessionFromDrafts(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.session.priorAuthority).toBeUndefined();
  });
});
