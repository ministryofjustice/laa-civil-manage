import { saveToSessionFromDrafts } from "#src/middleware/saveToSessionFromDrafts.js";
import { getDrafts } from "#src/models/drafts.models.js";
import { describe, it, expect, mock } from "bun:test";
import type { NextFunction, Request, Response } from "express";

void mock.module("#src/models/drafts.models.js", () => ({
  getDrafts: mock(async () => await Promise.resolve([])),
}));

const mockDraft = {
  draftId: "draft-123",
  draft: {
    applicationId: "app-123",
    priorAuthorityType: "EXPERT",
    expertFullName: "Dr Joe Bloggs",
    expertType: "Dentist",
    billingType: "HOURLY",
    hourlyRate: 45,
    timeHours: 2,
    timeMinutes: 30,
    totalAmount: 135,
    justification: "Draft justification",
    uploadedDocuments: null,
  },
};

const makeRequest = (overrides: object = {}): Request =>
  ({
    query: { draftId: "draft-123" },
    session: { userId: "user-123" },
    ...overrides,
  }) as unknown as Request;

describe("saveToSessionFromDrafts middleware", () => {
  const res = {} as Response;

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
    (getDrafts as ReturnType<typeof mock>).mockImplementationOnce(
      async () => await Promise.resolve([mockDraft]),
    );

    const req = makeRequest();
    const next: NextFunction = mock(() => {});

    await saveToSessionFromDrafts(req, res, next);

    expect(getDrafts).toHaveBeenCalledWith({});
    expect(req.session.priorAuthority).toEqual({
      type: "Expert",
      fullName: "Dr Joe Bloggs",
      expertType: "Dentist",
      billingType: "Hourly",
      hourlyRate: "45",
      estimatedTime: { estimatedHours: "2", estimatedMinutes: "30" },
      totalAmount: "135",
      fixedRateTotalAmount: undefined,
      justification: "Draft justification",
      uploadedDocuments: undefined,
    });
    expect(req.session.draftId).toBe("draft-123");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("calls next() without setting session if no drafts are found", async () => {
    const req = makeRequest();
    const next: NextFunction = mock(() => {});

    await saveToSessionFromDrafts(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.session.priorAuthority).toBeUndefined();
  });

  it("still calls next() if getDrafts throws", async () => {
    (getDrafts as ReturnType<typeof mock>).mockImplementationOnce(async () => {
      await Promise.reject(new Error("API unavailable"));
    });

    const req = makeRequest();
    const next: NextFunction = mock(() => {});

    await saveToSessionFromDrafts(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.session.priorAuthority).toBeUndefined();
  });
});
