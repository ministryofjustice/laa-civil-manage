import { describe, expect, it, mock } from "bun:test";
import type { Request, Response } from "express";
import {
  getDisbursementCheckYourAnswersPage,
  getDisbursementDetailsPage,
  getDisbursementJustificationPage,
  getDisbursementLandingPage,
  postDisbursementDetailsPage,
  postDisbursementJustificationPage,
} from "#src/controllers/priorAuthority/disbursement/disbursementController.js";

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

describe("getDisbursementDetailsPage", () => {
  it("renders the details page with the disbursement values from session", () => {
    const req = {
      session: {
        priorAuthority: {
          expert: {},
          counsel: {},
          disbursement: {
            disbursementPurpose: "Medical records request",
            disbursementAmount: "150.50",
          },
        },
      } as unknown as Request["session"],
    } as Request;

    const render = mock();
    const res = { render } as unknown as Response;

    getDisbursementDetailsPage(req, res);

    expect(render).toHaveBeenCalledWith(
      "priorAuthority/disbursement/disbursementDetail",
      {
        priorAuthority: {
          disbursementPurpose: "Medical records request",
          disbursementAmount: "150.50",
        },
      },
    );
  });
});

describe("postDisbursementDetailsPage", () => {
  it("redirects to the justification page", () => {
    const req = { session: {} as Request["session"] } as Request;
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postDisbursementDetailsPage(req, res);

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/disbursement/justification",
    );
  });
});

describe("getDisbursementJustificationPage", () => {
  it("renders the justification page with the disbursement values from session", () => {
    const req = {
      session: {
        priorAuthority: {
          expert: {},
          counsel: {},
          disbursement: {
            justification: "Because it is needed",
          },
        },
      } as unknown as Request["session"],
    } as Request;

    const render = mock();
    const res = { render } as unknown as Response;

    getDisbursementJustificationPage(req, res);

    expect(render).toHaveBeenCalledWith("priorAuthority/justificationPage", {
      priorAuthority: { justification: "Because it is needed" },
      backLinkHref: "/prior-authority/disbursement/details",
      formAction: "/prior-authority/disbursement/justification",
      hintText: "Explain why this request is necessary",
      heading: "Why is this disbursement required?",
    });
  });
});

describe("postDisbursementJustificationPage", () => {
  it("redirects to the justification page", () => {
    const req = { session: {} as Request["session"] } as Request;
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postDisbursementJustificationPage(req, res);

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/disbursement/document-upload",
    );
  });
});

describe("getDisbursementCheckYourAnswersPage", () => {
  it("renders the disbursement check your answers page", () => {
    const render = mock();
    const res = { render } as unknown as Response;

    getDisbursementCheckYourAnswersPage({} as Request, res);

    expect(render).toHaveBeenCalledWith("priorAuthority/checkYourAnswers", {
      basePath: "/prior-authority/disbursement",
      summaryCardsTemplate:
        "priorAuthority/disbursement/checkYourAnswersSummary.njk",
      justificationTitle: "Why is this disbursement required?",
    });
  });
});
