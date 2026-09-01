import {
  sanitizeFileName,
  validatePdfUpload,
} from "#src/validation/priorAuthority/shared/fileUploadValidation.js";
import { describe, expect, it } from "bun:test";

const validPdf = {
  originalname: "document.pdf",
  mimetype: "application/pdf",
  buffer: Buffer.from("%PDF-1.7\ncontent"),
};

describe("sanitizeFileName", () => {
  it("removes null bytes and encoded null bytes", () => {
    expect(sanitizeFileName("doc\0%00ument.pdf")).toBe("document.pdf");
  });
});

describe("validatePdfUpload", () => {
  it("accepts a PDF whose extension, media type and signature match", () => {
    expect(validatePdfUpload(validPdf)).toEqual({
      valid: true,
      sanitizedFileName: "document.pdf",
    });
  });

  it.each(["document", "document.txt", ".pdf"])(
    "rejects the invalid PDF filename %s",
    (originalname) => {
      expect(validatePdfUpload({ ...validPdf, originalname }).valid).toBe(
        false,
      );
    },
  );

  it("accepts a filename containing multiple dots", () => {
    expect(
      validatePdfUpload({ ...validPdf, originalname: "document.docx.pdf" })
        .valid,
    ).toBe(true);
  });

  it("rejects filenames longer than 255 characters", () => {
    const result = validatePdfUpload({
      ...validPdf,
      originalname: `${"a".repeat(252)}.pdf`,
    });

    expect(result).toEqual({
      valid: false,
      message: "The selected file name must be 255 characters or fewer",
    });
  });

  it("rejects a non-PDF media type", () => {
    const result = validatePdfUpload({
      ...validPdf,
      mimetype: "text/plain",
    });

    expect(result).toEqual({
      valid: false,
      message: "The selected file does not have a valid PDF media type",
    });
  });

  it("rejects content without a PDF signature", () => {
    const result = validatePdfUpload({
      ...validPdf,
      buffer: Buffer.from("not a PDF"),
    });

    expect(result).toEqual({
      valid: false,
      message: "The selected file does not contain valid PDF content",
    });
  });
});
