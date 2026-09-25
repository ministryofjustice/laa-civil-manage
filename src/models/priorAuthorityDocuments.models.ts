import { api } from "#src/middleware/auth/apiClient.js";
import type {
  PriorAuthorityDocumentTypeUpdateResponse,
  PriorAuthorityUploadedDocument,
} from "#src/types/priorAuthority/api.js";

export interface PriorAuthorityDocumentUploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export const uploadPriorAuthorityDocument = async (
  priorAuthorityId: string,
  file: PriorAuthorityDocumentUploadFile,
): Promise<PriorAuthorityUploadedDocument> => {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
    file.originalname,
  );
  const { data }: { data: PriorAuthorityUploadedDocument } = await api.post(
    `/prior-authorities/${priorAuthorityId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
};

export const updatePriorAuthorityDocumentType = async (
  priorAuthorityId: string,
  documentId: string,
  documentType: string,
): Promise<PriorAuthorityDocumentTypeUpdateResponse> => {
  const { data }: { data: PriorAuthorityDocumentTypeUpdateResponse } =
    await api.patch(
      `/prior-authorities/${priorAuthorityId}/documents/${documentId}`,
      { documentType },
    );
  return data;
};

export const deletePriorAuthorityDocument = async (
  priorAuthorityId: string,
  documentId: string,
): Promise<void> => {
  await api.delete(
    `/prior-authorities/${priorAuthorityId}/documents/${documentId}`,
  );
};
