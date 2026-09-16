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
      uploadedDocuments: [
        {
          documentId: "document-1",
          documentType: "COURT_ORDER",
          fileName: "court-order.pdf",
          fileType: "pdf",
          mediaType: "application/pdf",
          size: 1024,
          uploadedAt: "2026-09-15T10:00:00Z",
          sourceService: "CIVIL_APPLY",
        },
      ],
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
      uploadedDocuments: [
        {
          documentId: "document-1",
          fileName: "document-1",
          originalFileName: "court-order.pdf",
          category: "COURT_ORDER",
          mimeType: "application/pdf",
          size: 1024,
        },
      ],
    });
    expect(req.priorAuthority?.uploadedDocuments).toEqual([
      {
        documentId: "document-1",
        fileName: "document-1",
        originalFileName: "court-order.pdf",
        category: "COURT_ORDER",
        mimeType: "application/pdf",
        size: 1024,
      },
    ]);
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

  it("maps req.priorAuthority to a draft DTO and persists it", async () => {
    updateDraftSpy.mockResolvedValue(undefined);
    const req = {
      session: {
        priorAuthorityId: "PA-1",
        application: { applicationId: "APP-1001" },
      } as Request["session"],
      priorAuthority: {
        type: "Expert",
        expert: { expertType: "Dentist", fullName: "Dr Smith" },
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

    expect(updateDraftSpy).toHaveBeenCalledWith("PA-1", {
      applicationId: "APP-1001",
      priorAuthorityType: "EXPERT",
      justification: undefined,
      expertDetails: {
        expertType: "Dentist",
        expertFullName: "Dr Smith",
        expertPostcode: undefined,
        expertCosts: undefined,
      },
    });
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
