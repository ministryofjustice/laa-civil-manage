import {
  getDeleteFileName,
  isDeleteAction,
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
