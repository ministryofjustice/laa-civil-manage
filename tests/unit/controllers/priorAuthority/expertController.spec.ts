import { describe, expect, it, mock } from "bun:test";
import type { Request, Response } from "express";
import {
  getExpertCheckYourAnswersPage,
  getExpertLandingPage,
  postCostsSharedPage,
  postExpertCosts,
} from "#src/controllers/priorAuthority/expert/expertController.js";

describe("getExpertLandingPage", () => {
  it("clears stale counsel fields when entering the expert journey", () => {
    const req = {
      session: {
        priorAuthority: {
          type: "Expert",
          expert: {},
          counsel: {
            counselType: "KINGS_COUNSEL_ALONE",
          },
        },
      } as Request["session"],
    } as Request;

    const render = mock();
    const res = { render } as unknown as Response;

    getExpertLandingPage(req, res);

    expect(render).toHaveBeenCalledWith(
      "priorAuthority/expert/expertLandingPage",
    );
    expect(req.session.priorAuthority?.counsel.counselType).toBeUndefined();
  });
});

describe("getExpertCheckYourAnswersPage", () => {
  it("renders the expert check your answers page", () => {
    const render = mock();
    const res = { render } as unknown as Response;

    getExpertCheckYourAnswersPage({} as Request, res);

    expect(render).toHaveBeenCalledWith("priorAuthority/checkYourAnswers", {
      basePath: "/prior-authority/expert",
      summaryCardsTemplate: "priorAuthority/expert/checkYourAnswersSummary.njk",
    });
  });
});

describe("postExpertCosts", () => {
  it("redirects to the costs-shared page", () => {
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postExpertCosts({} as Request, res);

    expect(redirect).toHaveBeenCalledWith("/prior-authority/expert/costs-shared");
  });
});

describe("postCostsSharedPage", () => {
  it("redirects to share-of-costs page when costs are shared", () => {
    const req = {
      body: { CostsShared: "Yes" },
    } as Request<unknown, unknown, { CostsShared?: string }>;
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postCostsSharedPage(req, res);

    expect(redirect).toHaveBeenCalledWith("/prior-authority/expert/share-of-costs");
  });

  it("redirects to justification when costs are not shared", () => {
    const req = {
      body: { CostsShared: "No" },
    } as Request<unknown, unknown, { CostsShared?: string }>;
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postCostsSharedPage(req, res);

    expect(redirect).toHaveBeenCalledWith("/prior-authority/expert/justification");
  });
});

