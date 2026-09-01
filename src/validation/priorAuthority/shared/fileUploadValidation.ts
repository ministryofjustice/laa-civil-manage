const PDF_EXTENSION = "pdf";
const PDF_MIME_TYPE = "application/pdf";
const PDF_SIGNATURE = Buffer.from("%PDF-");
const MAX_FILE_NAME_LENGTH = 255;

export interface UploadValidationFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export type UploadValidationResult =
  | { valid: true; sanitizedFileName: string }
  | { valid: false; message: string };

export const sanitizeFileName = (fileName: string): string =>
  fileName.replaceAll("\0", "").replaceAll(/%00/giv, "");

export const validatePdfUpload = (
  file: UploadValidationFile,
): UploadValidationResult => {
  const sanitizedFileName = sanitizeFileName(file.originalname);
  const lastDotIndex = sanitizedFileName.lastIndexOf(".");
  const extension = sanitizedFileName.slice(lastDotIndex + 1);

  if (lastDotIndex <= 0 || extension.toLowerCase() !== PDF_EXTENSION) {
    return { valid: false, message: "The selected file must be a PDF" };
  }

  if (sanitizedFileName.length > MAX_FILE_NAME_LENGTH) {
    return {
      valid: false,
      message: "The selected file name must be 255 characters or fewer",
    };
  }

  if (file.mimetype !== PDF_MIME_TYPE) {
    return {
      valid: false,
      message: "The selected file does not have a valid PDF media type",
    };
  }

  if (!file.buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
    return {
      valid: false,
      message: "The selected file does not contain valid PDF content",
    };
  }

  return { valid: true, sanitizedFileName };
};
