import {
  classifyUploadError,
  FILE_INVALID_ERROR,
  FILE_REJECTED_ERROR,
  FILE_SIZE_ERROR,
  getDeleteFileName,
  isDeleteAction,
  UPLOAD_UNAVAILABLE_ERROR,
} from "#src/utils/documentUploadHelpers.js";
import { describe, expect, it } from "bun:test";
import type { Request } from "express";

describe("isDeleteAction", () => {
  it("returns true when the body has a delete property", () => {
    const req = { body: { delete: "file-1" } } as unknown as Request;
    expect(isDeleteAction(req)).toBe(true);
  });

  it("returns false when the body has no delete property", () => {
    const req = { body: { _action: "upload" } } as unknown as Request;
    expect(isDeleteAction(req)).toBe(false);
  });
});

describe("getDeleteFileName", () => {
  it("returns the delete value when it is a string", () => {
    const req = { body: { delete: "file-1" } } as unknown as Request;
    expect(getDeleteFileName(req)).toBe("file-1");
  });

  it("returns undefined when the delete value is not a string", () => {
    const req = { body: { delete: 123 } } as unknown as Request;
    expect(getDeleteFileName(req)).toBeUndefined();
  });

  it("returns undefined when there is no delete property", () => {
    const req = { body: {} } as unknown as Request;
    expect(getDeleteFileName(req)).toBeUndefined();
  });
});

describe("classifyUploadError", () => {
  const apiError = (status: number): unknown => ({
    response: { status, statusText: "error" },
  });

  it.each([
    [400, FILE_REJECTED_ERROR],
    [409, FILE_REJECTED_ERROR],
    [413, FILE_SIZE_ERROR],
    [415, FILE_INVALID_ERROR],
  ])(
    "treats a %i from the API as a recoverable upload error",
    (status, message) => {
      expect(classifyUploadError(apiError(status))).toEqual({
        kind: "recoverable",
        message,
      });
    },
  );

  it.each([
    [400, "my-file.pdf could not be uploaded. Check the file and try again"],
    [409, "my-file.pdf could not be uploaded. Check the file and try again"],
    [413, "my-file.pdf must be 10MB or smaller"],
    [415, "my-file.pdf must be a valid PDF"],
    [
      502,
      "my-file.pdf could not be uploaded because of a temporary problem. Try again",
    ],
  ])(
    "prefixes the %i message with the file name when one is given",
    (status, message) => {
      expect(classifyUploadError(apiError(status), "my-file.pdf")).toEqual({
        kind: "recoverable",
        message,
      });
    },
  );

  it("falls back to the generic subject when the file name is blank", () => {
    expect(classifyUploadError(apiError(409), "  ")).toEqual({
      kind: "recoverable",
      message: FILE_REJECTED_ERROR,
    });
  });

  it.each([500, 502, 503, 504])(
    "treats a %i from the API as a temporary problem the user can retry",
    (status) => {
      expect(classifyUploadError(apiError(status))).toEqual({
        kind: "recoverable",
        message: UPLOAD_UNAVAILABLE_ERROR,
      });
    },
  );

  it("treats a 404 from the API as a missing prior authority", () => {
    expect(classifyUploadError(apiError(404))).toEqual({ kind: "notFound" });
  });

  it("treats an error without a response as unexpected", () => {
    expect(classifyUploadError(new Error("socket hang up"))).toEqual({
      kind: "unexpected",
    });
  });

  it("treats an unhandled API status as unexpected", () => {
    expect(classifyUploadError(apiError(418))).toEqual({ kind: "unexpected" });
  });
});
