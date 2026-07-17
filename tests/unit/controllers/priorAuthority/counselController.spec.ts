import { describe, expect, it, mock } from "bun:test";
import type { Request, Response } from "express";
import { getCounselLandingPage } from "#src/controllers/priorAuthority/counsel/counselController.js";

describe("getCounselLandingPage", () => {
  it("clears stale expert fields when entering the counsel journey", () => {
    const req = {
      session: {
        priorAuthority: {
          type: "Counsel",
          expertType: "Psychologist",
          fullName: "Dr Example",
        },
      } as Request["session"],
    } as Request;

    const render = mock();
    const res = { render } as unknown as Response;

    getCounselLandingPage(req, res);

    expect(render).toHaveBeenCalledWith(
      "priorAuthorityForm/counsel/counselLandingPage",
    );

    // Expected behaviour: entering counsel should not keep expert journey data.
    expect(req.session.priorAuthority?.expertType).toBeUndefined();
    expect(req.session.priorAuthority?.fullName).toBeUndefined();
  });
});

