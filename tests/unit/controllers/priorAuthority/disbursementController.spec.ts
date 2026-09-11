import { describe, expect, it, mock, spyOn, beforeEach } from "bun:test";
import type { Request, Response } from "express";
import * as priorAuthorityModels from "#src/models/priorAuthorityModels.js";
import {
  getDisbursementCheckYourAnswersPage,
  getDisbursementDetailsPage,
  getDisbursementJustificationPage,
  getDisbursementLandingPage,
  postDisbursementDetailsPage,
  postDisbursementJustificationPage,
  postStartDisbursementJourney,
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

  it("renders the landing page without mutating session state", () => {
    const req = {
      session: {
        application: { applicationId: "APP-1001" },
      } as Request["session"],
    } as Request;

    const render = mock();
    const res = { render } as unknown as Response;

    getDisbursementLandingPage(req, res);

    expect(render).toHaveBeenCalledWith(
      "priorAuthority/disbursement/disbursementLandingPage",
      { applicationId: "APP-1001" },
    );
    expect(req.session.priorAuthorityId).toBeUndefined();
  });
});

describe("postStartDisbursementJourney", () => {
  let createDraftSpy: ReturnType<
    typeof spyOn<typeof priorAuthorityModels, "createPriorAuthorityDraft">
  >;

  beforeEach(() => {
    createDraftSpy = spyOn(priorAuthorityModels, "createPriorAuthorityDraft");
  });

  it("creates a new draft and stores its id in session before redirecting", async () => {
    createDraftSpy.mockResolvedValue({ priorAuthorityId: "PA-1" });
    const req = {
      session: {
        application: { applicationId: "APP-1001" },
      } as Request["session"],
    } as Request;
    const redirect = mock();
    const next = mock();
    const res = { redirect } as unknown as Response;

    await postStartDisbursementJourney(req, res, next);

    expect(createDraftSpy).toHaveBeenCalledWith({
      applicationId: "APP-1001",
      priorAuthorityType: "DISBURSEMENT",
    });
    expect(req.session.priorAuthorityId).toBe("PA-1");
    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/disbursement/details",
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with the error when draft creation fails", async () => {
    const error = new Error("backend unavailable");
    createDraftSpy.mockRejectedValue(error);
    const req = { session: {} as Request["session"] } as Request;
    const redirect = mock();
    const next = mock();
    const res = { redirect } as unknown as Response;

    await postStartDisbursementJourney(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("getDisbursementDetailsPage", () => {
  it("renders the details page with the disbursement values from the loaded draft", () => {
    const req = {
      priorAuthority: {
        expert: {},
        counsel: {},
        disbursement: {
          disbursementPurpose: "Medical records request",
          disbursementAmount: "150.50",
        },
      },
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
  it("renders the justification page with the disbursement values from the loaded draft", () => {
    const req = {
      priorAuthority: {
        expert: {},
        counsel: {},
        disbursement: {
          justification: "Because it is needed",
        },
      },
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
