import {
  deleteFileFromSession,
  getDeleteFileName,
  isDeleteAction,
} from "#src/utils/documentUploadHelpers.js";
import type { PriorAuthoritySection } from "#src/utils/documentUploadHelpers.js";
import type { UploadedDocument } from "#src/types/priorAuthority/shared.js";
import { describe, expect, it } from "bun:test";
import type { Request } from "express";

const buildRequest = (
  section: PriorAuthoritySection,
  uploadedDocuments: UploadedDocument[],
): Request =>
  ({
    session: {
      priorAuthority: {
        expert: section === "expert" ? { uploadedDocuments } : {},
        counsel: section === "counsel" ? { uploadedDocuments } : {},
      },
    },
  }) as unknown as Request;

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

describe("deleteFileFromSession", () => {
  it("removes the matching file from the given section", () => {
    const req = buildRequest("expert", [
      { fileName: "file-1", originalFileName: "one.pdf" },
      { fileName: "file-2", originalFileName: "two.pdf" },
    ]);

    deleteFileFromSession(req, "expert", "file-1");

    expect(req.session.priorAuthority?.expert.uploadedDocuments).toEqual([
      { fileName: "file-2", originalFileName: "two.pdf" },
    ]);
  });

  it("leaves the list unchanged when the file name does not match", () => {
    const req = buildRequest("expert", [
      { fileName: "file-1", originalFileName: "one.pdf" },
    ]);

    deleteFileFromSession(req, "expert", "does-not-exist");

    expect(req.session.priorAuthority?.expert.uploadedDocuments).toEqual([
      { fileName: "file-1", originalFileName: "one.pdf" },
    ]);
  });

  it("only affects the targeted section, leaving the other section untouched", () => {
    const req = {
      session: {
        priorAuthority: {
          expert: {
            uploadedDocuments: [
              { fileName: "expert-1", originalFileName: "expert.pdf" },
            ],
          },
          counsel: {
            uploadedDocuments: [
              { fileName: "counsel-1", originalFileName: "counsel.pdf" },
            ],
          },
        },
      },
    } as unknown as Request;

    deleteFileFromSession(req, "counsel", "counsel-1");

    expect(req.session.priorAuthority?.counsel.uploadedDocuments).toEqual([]);
    expect(req.session.priorAuthority?.expert.uploadedDocuments).toEqual([
      { fileName: "expert-1", originalFileName: "expert.pdf" },
    ]);
  });

  it("initialises the session and results in an empty list when none exists", () => {
    const req = { session: {} } as unknown as Request;

    deleteFileFromSession(req, "expert", "file-1");

    expect(req.session.priorAuthority?.expert.uploadedDocuments).toEqual([]);
  });
});
