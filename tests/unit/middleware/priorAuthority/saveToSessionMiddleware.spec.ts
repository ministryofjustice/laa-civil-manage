import { describe, expect, it, mock, spyOn, beforeEach } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import * as priorAuthorityModels from "#src/models/priorAuthorityModels.js";
import {
  loadPriorAuthority,
  persistPriorAuthority,
  saveCounsel,
  saveDisbursement,
  saveExpert,
} from "#src/middleware/priorAuthority/shared/saveToSession.js";

describe("loadPriorAuthority", () => {
  it("redirects to the journey landing page when no draft id is in session", () => {
    const req = { session: {} as Request["session"] } as Request;
    const redirect = mock();
    const next = mock();
    const res = { redirect } as unknown as Response;

    loadPriorAuthority("expert")(req, res, next);

    expect(redirect).toHaveBeenCalledWith("/prior-authority/expert");
    expect(next).not.toHaveBeenCalled();
  });

  it("hydrates req.priorAuthority and res.locals.priorAuthority from the backend draft", async () => {
    const getDraftSpy = spyOn(priorAuthorityModels, "getPriorAuthorityDraft");
    getDraftSpy.mockResolvedValue({
      priorAuthorityId: "PA-1",
      status: "PENDING",
      draft: {
        applicationId: "APP-1001",
        priorAuthorityType: "EXPERT",
        justification: "Because it is needed",
        expertDetails: { expertType: "Dentist" },
      },
    });

    const req = {
      session: { priorAuthorityId: "PA-1" } as Request["session"],
    } as Request;
    const res = { locals: {} } as unknown as Response;

    await new Promise<void>((resolve) => {
      loadPriorAuthority("expert")(req, res, (() => {
        resolve();
      }) as NextFunction);
    });

    expect(req.priorAuthority?.expert.expertType).toBe("Dentist");
    expect(res.locals.priorAuthority).toEqual({
      type: "Expert",
      expertType: "Dentist",
      fullName: undefined,
      expertPostcode: undefined,
      justification: "Because it is needed",
      billingType: undefined,
      hourlyRate: undefined,
      estimatedTime: undefined,
      totalAmount: undefined,
      fixedRateTotalAmount: undefined,
      costsSharedWithOtherParties: undefined,
      numberOfParties: undefined,
      apportionedAmount: undefined,
      uploadedDocuments: [],
    });
  });

  it("calls next with the error when the backend request fails", async () => {
    const error = new Error("backend unavailable");
    spyOn(priorAuthorityModels, "getPriorAuthorityDraft").mockRejectedValue(
      error,
    );

    const req = {
      session: { priorAuthorityId: "PA-1" } as Request["session"],
    } as Request;
    const res = { locals: {} } as unknown as Response;

    await new Promise<void>((resolve) => {
      loadPriorAuthority("expert")(req, res, ((err: unknown) => {
        expect(err).toBe(error);
        resolve();
      }) as NextFunction);
    });
  });
});

describe("persistPriorAuthority", () => {
  let updateDraftSpy: ReturnType<
    typeof spyOn<typeof priorAuthorityModels, "updatePriorAuthorityDraft">
  >;

  beforeEach(() => {
    updateDraftSpy = spyOn(priorAuthorityModels, "updatePriorAuthorityDraft");
  });

  it("forward-maps req.priorAuthority and persists it", async () => {
    updateDraftSpy.mockResolvedValue(undefined);
    const req = {
      session: {
        priorAuthorityId: "PA-1",
        application: { applicationId: "APP-1001" },
      } as Request["session"],
      priorAuthority: {
        type: "Expert",
        expert: { expertType: "Dentist" },
        counsel: {},
        disbursement: {},
      },
    } as Request;

    await new Promise<void>((resolve) => {
      persistPriorAuthority(
        req,
        {} as Response,
        (() => {
          resolve();
        }) as NextFunction,
      );
    });

    expect(updateDraftSpy).toHaveBeenCalledWith(
      "PA-1",
      expect.objectContaining({
        applicationId: "APP-1001",
        priorAuthorityType: "EXPERT",
      }),
    );
  });

  it("calls next with an error when no draft is loaded", () => {
    const req = { session: {} as Request["session"] } as Request;
    const next = mock();

    persistPriorAuthority(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("saveExpert / saveCounsel / saveDisbursement", () => {
  it("mutates the matching section on req.priorAuthority", () => {
    const req = {
      priorAuthority: { expert: {}, counsel: {}, disbursement: {} },
      body: { name: "Dr Example" },
    } as Request<unknown, unknown, { name: string }>;
    const next = mock();

    saveExpert("fullName", (body: { name: string }) => body.name)(
      req,
      {} as Response,
      next,
    );

    expect(req.priorAuthority?.expert.fullName).toBe("Dr Example");
    expect(next).toHaveBeenCalled();
  });

  it("initialises req.priorAuthority when missing", () => {
    const req = {
      body: { type: "KINGS_COUNSEL_ALONE" },
    } as Request<unknown, unknown, { type: "KINGS_COUNSEL_ALONE" }>;
    const next = mock();

    saveCounsel(
      "counselType",
      (body: { type: "KINGS_COUNSEL_ALONE" }) => body.type,
    )(req, {} as Response, next);

    expect(req.priorAuthority?.counsel.counselType).toBe("KINGS_COUNSEL_ALONE");
    expect(next).toHaveBeenCalled();
  });

  it("saves disbursement fields", () => {
    const req = {
      priorAuthority: { expert: {}, counsel: {}, disbursement: {} },
      body: { purpose: "Medical records request" },
    } as Request<unknown, unknown, { purpose: string }>;
    const next = mock();

    saveDisbursement(
      "disbursementPurpose",
      (body: { purpose: string }) => body.purpose,
    )(req, {} as Response, next);

    expect(req.priorAuthority?.disbursement.disbursementPurpose).toBe(
      "Medical records request",
    );
    expect(next).toHaveBeenCalled();
  });
});
