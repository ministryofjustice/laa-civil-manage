import { api } from "#src/middleware/auth/apiClient.js";

import type {
  PriorAuthorityCreateDraftResponse,
  PriorAuthorityDraftDto,
  PriorAuthorityGetDraftResponse,
  PriorAuthoritySubmitResponse,
} from "#src/types/priorAuthority/api.js";

export const createPriorAuthorityDraft = async (
  draft: PriorAuthorityDraftDto,
): Promise<PriorAuthorityCreateDraftResponse> => {
  const { data }: { data: PriorAuthorityCreateDraftResponse } = await api.post(
    `${process.env.BACKEND_URL}/prior-authorities`,
    draft,
  );
  return data;
};

export const getPriorAuthorityDraft = async (
  priorAuthorityId: string,
): Promise<PriorAuthorityGetDraftResponse> => {
  const { data }: { data: PriorAuthorityGetDraftResponse } = await api.get(
    `${process.env.BACKEND_URL}/prior-authorities/${priorAuthorityId}`,
  );
  return data;
};

export const updatePriorAuthorityDraft = async (
  priorAuthorityId: string,
  draft: PriorAuthorityDraftDto,
): Promise<void> => {
  await api.put(
    `${process.env.BACKEND_URL}/prior-authorities/${priorAuthorityId}`,
    draft,
  );
};

export const submitPriorAuthorityDraft = async (
  priorAuthorityId: string,
): Promise<PriorAuthoritySubmitResponse> => {
  const { data }: { data: PriorAuthoritySubmitResponse } = await api.post(
    `${process.env.BACKEND_URL}/prior-authorities/${priorAuthorityId}/submit`,
  );
  return data;
};
