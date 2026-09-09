import { describe, expect, it, mock, spyOn, beforeEach } from "bun:test";
import type { Request, Response } from "express";
import * as priorAuthorityModels from "#src/models/priorAuthorityModels.js";
import {
  getCounselCheckYourAnswersPage,
  getCounselLandingPage,
  postStartCounselJourney,
} from "#src/controllers/priorAuthority/counsel/counselController.js";

describe("getCounselLandingPage", () => {
  it("renders the landing page without mutating session state", () => {
    const req = { session: {} as Request["session"] } as Request;
    const render = mock();
    const res = { render } as unknown as Response;

    getCounselLandingPage(req, res);

    expect(render).toHaveBeenCalledWith(
      "priorAuthority/counsel/counselLandingPage",
    );
    expect(req.session.priorAuthorityId).toBeUndefined();
  });
});

describe("postStartCounselJourney", () => {
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

    await postStartCounselJourney(req, res, next);

    expect(createDraftSpy).toHaveBeenCalledWith({
      applicationId: "APP-1001",
      priorAuthorityType: "COUNSEL",
    });
    expect(req.session.priorAuthorityId).toBe("PA-1");
    expect(redirect).toHaveBeenCalledWith("/prior-authority/counsel/type");
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with the error when draft creation fails", async () => {
    const error = new Error("backend unavailable");
    createDraftSpy.mockRejectedValue(error);
    const req = { session: {} as Request["session"] } as Request;
    const redirect = mock();
    const next = mock();
    const res = { redirect } as unknown as Response;

    await postStartCounselJourney(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("getCounselCheckYourAnswersPage", () => {
  it("renders the counsel check your answers page", () => {
    const render = mock();
    const res = { render } as unknown as Response;

    getCounselCheckYourAnswersPage({} as Request, res);

    expect(render).toHaveBeenCalledWith("priorAuthority/checkYourAnswers", {
      basePath: "/prior-authority/counsel",
      summaryCardsTemplate:
        "priorAuthority/counsel/checkYourAnswersSummary.njk",
    });
  });
});
