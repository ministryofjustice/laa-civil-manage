import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";

import { api } from "#src/middleware/auth/apiClient.js";
import {
  updatePriorAuthorityDocumentType,
  uploadPriorAuthorityDocument,
} from "#src/models/priorAuthorityDocuments.models.js";

describe("uploadPriorAuthorityDocument", () => {
  afterEach(() => {
    mock.restore();
  });

  it("posts a file as multipart form data and returns the uploaded document", async () => {
    const uploadedDocument = {
      documentId: "document-1",
      documentType: null,
      fileName: "evidence.pdf",
      fileType: "pdf",
      mediaType: "application/pdf",
      size: 24,
      uploadedAt: "2026-09-15T10:00:00Z",
      sourceService: "CIVIL_APPLY",
    };
    const postSpy = spyOn(api, "post").mockResolvedValue({
      data: uploadedDocument,
    });
    const file = {
      buffer: Buffer.from("%PDF-1.7\ntest document"),
      mimetype: "application/pdf",
      originalname: "evidence.pdf",
    };

    const result = await uploadPriorAuthorityDocument(
      "prior-authority-1",
      file,
    );

    expect(postSpy).toHaveBeenCalledWith(
      "/prior-authorities/prior-authority-1/documents",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    expect(result).toEqual(uploadedDocument);
  });
});

describe("updatePriorAuthorityDocumentType", () => {
  afterEach(() => {
    mock.restore();
  });

  it("patches the selected document category", async () => {
    const patchSpy = spyOn(api, "patch").mockResolvedValue({
      data: { documentId: "document-1", updatedAt: "2026-09-15T10:01:00Z" },
    });

    await updatePriorAuthorityDocumentType(
      "prior-authority-1",
      "document-1",
      "COURT_ORDER",
    );

    expect(patchSpy).toHaveBeenCalledWith(
      "/prior-authorities/prior-authority-1/documents/document-1",
      { documentType: "COURT_ORDER" },
    );
  });
});
