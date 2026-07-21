import { describe, expect, it, mock } from "bun:test";
import type { Request, Response } from "express";
import { getExpertLandingPage } from "#src/controllers/priorAuthority/expert/expertController.js";

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
      "priorAuthorityForm/expert/expertLandingPage",
    );
    expect(req.session.priorAuthority?.counsel.counselType).toBeUndefined();
  });
});
