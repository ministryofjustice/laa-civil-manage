import { describe, it, expect, mock, beforeEach } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import { getApplicationsList } from "#src/controllers/applications.controller.js";
import { getApplications } from "#src/models/applications.models.js";

void mock.module("#src/models/applications.models.js", () => ({
  getApplications: mock(async () => await Promise.resolve([{ id: "app-1" }])),
}));

describe("getApplicationsList controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let json: ReturnType<typeof mock>;

  beforeEach(() => {
    json = mock();
    req = { session: {} as Request["session"] };
    res = { json };
    next = mock();
    (getApplications as ReturnType<typeof mock>).mockClear();
  });

  it("responds with the applications from the model as JSON", async () => {
    (getApplications as ReturnType<typeof mock>).mockImplementation(
      async () => await Promise.resolve([{ id: "app-1" }]),
    );

    await getApplicationsList(req as Request, res as Response, next);

    expect(getApplications).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledWith([{ id: "app-1" }]);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards errors to next when the model throws", async () => {
    const error = new Error("backend down");
    (getApplications as ReturnType<typeof mock>).mockImplementation(
      async () => await Promise.reject(error),
    );

    await getApplicationsList(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(json).not.toHaveBeenCalled();
  });
});
