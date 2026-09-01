import { describe, expect, it, mock } from "bun:test";
import type { Request, Response } from "express";
import {
  getExpertCheckYourAnswersPage,
  getExpertTypePage,
  getExpertLandingPage,
  getProviderNamePage,
  getOtherExpertTypePage,
  postCostsSharedPage,
  postExpertCosts,
  postExpertType,
  postProviderName,
  postOtherExpertType,
  saveExpertTypeSelection,
} from "#src/controllers/priorAuthority/expert/expertController.js";

const expertTypeLocals = {
  expertTypes: [
    { value: "", text: "" },
    { value: "Dentist", text: "Dentist" },
    { value: "Other", text: "Other" },
  ],
};

describe("getExpertLandingPage", () => {
  it("redirects to applications when no application is in session", () => {
    const req = { session: {} as Request["session"] } as Request;
    const redirect = mock();
    const render = mock();
    const res = { redirect, render } as unknown as Response;

    getExpertLandingPage(req, res);

    expect(redirect).toHaveBeenCalledWith("/applications");
    expect(render).not.toHaveBeenCalled();
  });

  it("clears stale counsel fields when entering the expert journey", () => {
    const req = {
      session: {
        application: { applicationId: "APP-1001" },
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
      { applicationId: "APP-1001" },
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

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/expert/costs-shared",
    );
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

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/expert/share-of-costs",
    );
  });

  it("redirects to justification when costs are not shared", () => {
    const req = {
      body: { CostsShared: "No" },
    } as Request<unknown, unknown, { CostsShared?: string }>;
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postCostsSharedPage(req, res);

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/expert/justification",
    );
  });
});

describe("getExpertTypePage", () => {
  it("marks a stored custom service as Other in the select", () => {
    const req = {
      session: {
        priorAuthority: { expert: { expertType: "Osteopath" } },
      } as Request["session"],
    } as Request;
    const render = mock();
    const res = { render, locals: expertTypeLocals } as unknown as Response;

    getExpertTypePage(req, res);

    expect(render).toHaveBeenCalledWith("priorAuthority/expert/expertType", {
      priorAuthority: { expertType: "Osteopath" },
      fallbackSelectedExpertType: "Other",
    });
  });

  it("keeps a listed service selected in the select", () => {
    const req = {
      session: {
        priorAuthority: { expert: { expertType: "Dentist" } },
      } as Request["session"],
    } as Request;
    const render = mock();
    const res = { render, locals: expertTypeLocals } as unknown as Response;

    getExpertTypePage(req, res);

    expect(render).toHaveBeenCalledWith("priorAuthority/expert/expertType", {
      priorAuthority: { expertType: "Dentist" },
      fallbackSelectedExpertType: "Dentist",
    });
  });
});

describe("saveExpertTypeSelection", () => {
  it("saves a listed service as the expert type", () => {
    const req = {
      body: { PriorAuthorityExpertType: "Dentist" },
      session: { priorAuthority: { expert: {} } } as Request["session"],
    } as Request<unknown, unknown, { PriorAuthorityExpertType?: string }>;
    const next = mock();
    const res = { locals: expertTypeLocals } as unknown as Response;

    saveExpertTypeSelection(req, res, next);

    expect(req.session.priorAuthority?.expert.expertType).toBe("Dentist");
    expect(next).toHaveBeenCalled();
  });

  it("clears a previously listed service when switching to Other", () => {
    const req = {
      body: { PriorAuthorityExpertType: "Other" },
      session: {
        priorAuthority: { expert: { expertType: "Dentist" } },
      } as Request["session"],
    } as Request<unknown, unknown, { PriorAuthorityExpertType?: string }>;
    const next = mock();
    const res = { locals: expertTypeLocals } as unknown as Response;

    saveExpertTypeSelection(req, res, next);

    expect(req.session.priorAuthority?.expert.expertType).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it("keeps an existing custom service when re-selecting Other", () => {
    const req = {
      body: { PriorAuthorityExpertType: "Other" },
      session: {
        priorAuthority: { expert: { expertType: "Osteopath" } },
      } as Request["session"],
    } as Request<unknown, unknown, { PriorAuthorityExpertType?: string }>;
    const next = mock();
    const res = { locals: expertTypeLocals } as unknown as Response;

    saveExpertTypeSelection(req, res, next);

    expect(req.session.priorAuthority?.expert.expertType).toBe("Osteopath");
    expect(next).toHaveBeenCalled();
  });

  it("does not persist free text that is not a listed service", () => {
    const req = {
      body: { PriorAuthorityExpertType: "Not a real service" },
      session: { priorAuthority: { expert: {} } } as Request["session"],
    } as Request<unknown, unknown, { PriorAuthorityExpertType?: string }>;
    const next = mock();
    const res = { locals: expertTypeLocals } as unknown as Response;

    saveExpertTypeSelection(req, res, next);

    expect(req.session.priorAuthority?.expert.expertType).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it("does not overwrite a committed service with invalid free text", () => {
    const req = {
      body: { PriorAuthorityExpertType: "Not a real service" },
      session: {
        priorAuthority: { expert: { expertType: "Dentist" } },
      } as Request["session"],
    } as Request<unknown, unknown, { PriorAuthorityExpertType?: string }>;
    const next = mock();
    const res = { locals: expertTypeLocals } as unknown as Response;

    saveExpertTypeSelection(req, res, next);

    expect(req.session.priorAuthority?.expert.expertType).toBe("Dentist");
    expect(next).toHaveBeenCalled();
  });
});

describe("postExpertType", () => {
  it("redirects to the service type page when Other is selected", () => {
    const req = {
      body: { PriorAuthorityExpertType: "Other" },
    } as Request<unknown, unknown, { PriorAuthorityExpertType?: string }>;
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postExpertType(req, res);

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/expert/other-expert-type",
    );
  });

  it("redirects to the provider name page for a listed service", () => {
    const req = {
      body: { PriorAuthorityExpertType: "Dentist" },
    } as Request<unknown, unknown, { PriorAuthorityExpertType?: string }>;
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postExpertType(req, res);

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/expert/provider-name",
    );
  });
});

describe("getOtherExpertTypePage", () => {
  it("redirects to provider name when a listed service is already chosen", () => {
    const req = {
      session: {
        priorAuthority: { expert: { expertType: "Dentist" } },
      } as Request["session"],
    } as Request;
    const redirect = mock();
    const render = mock();
    const res = {
      redirect,
      render,
      locals: expertTypeLocals,
    } as unknown as Response;

    getOtherExpertTypePage(req, res);

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/expert/provider-name",
    );
    expect(render).not.toHaveBeenCalled();
  });

  it("renders and prefills the custom service", () => {
    const req = {
      session: {
        priorAuthority: { expert: { expertType: "Osteopath" } },
      } as Request["session"],
    } as Request;
    const redirect = mock();
    const render = mock();
    const res = {
      redirect,
      render,
      locals: expertTypeLocals,
    } as unknown as Response;

    getOtherExpertTypePage(req, res);

    expect(render).toHaveBeenCalledWith(
      "priorAuthority/expert/otherExpertType",
      {
        priorAuthority: { expertType: "Osteopath" },
        fallbackOtherExpertType: "Osteopath",
      },
    );
  });
});

describe("postOtherExpertType", () => {
  it("redirects to the provider name page", () => {
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postOtherExpertType({} as Request, res);

    expect(redirect).toHaveBeenCalledWith(
      "/prior-authority/expert/provider-name",
    );
  });
});

describe("getProviderNamePage", () => {
  it("uses the expert type page as the back link for a listed service", () => {
    const req = {
      session: {
        priorAuthority: { expert: { expertType: "Dentist" } },
      } as Request["session"],
    } as Request;
    const render = mock();
    const res = { render, locals: expertTypeLocals } as unknown as Response;

    getProviderNamePage(req, res);

    expect(render).toHaveBeenCalledWith("priorAuthority/expert/providerName", {
      priorAuthority: { expertType: "Dentist" },
      backLinkHref: "/prior-authority/expert/expert-type",
    });
  });

  it("uses the other expert type page as the back link for a custom service", () => {
    const req = {
      session: {
        priorAuthority: { expert: { expertType: "Osteopath" } },
      } as Request["session"],
    } as Request;
    const render = mock();
    const res = { render, locals: expertTypeLocals } as unknown as Response;

    getProviderNamePage(req, res);

    expect(render).toHaveBeenCalledWith("priorAuthority/expert/providerName", {
      priorAuthority: { expertType: "Osteopath" },
      backLinkHref: "/prior-authority/expert/other-expert-type",
    });
  });
});

describe("postProviderName", () => {
  it("redirects to the postcode page", () => {
    const redirect = mock();
    const res = { redirect } as unknown as Response;

    postProviderName({} as Request, res);

    expect(redirect).toHaveBeenCalledWith("/prior-authority/expert/postcode");
  });
});
