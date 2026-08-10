import { describe, expect, it, mock } from "bun:test";
import type { Request, Response } from "express";
import { getDisbursementLandingPage } from "#src/controllers/priorAuthority/disbursement/disbursementController.js";

describe("getDisbursementLandingPage", () => {
  it("redirects to applications when no application is in session", () => {
    const req = { session: {} as Request["session"] } as Request;
    const redirect = mock();
    const render = mock();
    const res = { redirect, render } as unknown as Response;

    getDisbursementLandingPage(req, res);

    expect(redirect).toHaveBeenCalledWith("/applications");
    expect(render).not.toHaveBeenCalled();
  });

  it("clears stale expert and counsel fields when entering the disbursement journey", () => {
    const req = {
      session: {
        application: { applicationId: "APP-1001" },
        priorAuthority: {
          type: "Expert",
          expert: {
            expertType: "Psychologist",
            fullName: "Dr Example",
          },
          counsel: {
            counselType: "KINGS_COUNSEL_ALONE",
          },
          disbursement: {},
        },
      } as unknown as Request["session"],
    } as Request;

    const render = mock();
    const res = { render } as unknown as Response;

    getDisbursementLandingPage(req, res);

    expect(render).toHaveBeenCalledWith(
      "priorAuthority/disbursement/disbursementLandingPage",
      { applicationId: "APP-1001" },
    );
    expect(req.session.priorAuthority?.type).toBe("Disbursement");
    expect(req.session.priorAuthority?.expert.expertType).toBeUndefined();
    expect(req.session.priorAuthority?.counsel.counselType).toBeUndefined();
  });
});
