import { api } from "#src/middleware/auth/apiClient.js";

import type {
  PriorAuthorityApplicationRequest,
  PriorAuthorityApplicationResponse,
} from "#src/types/priorAuthority/api.js";

export const submitPriorAuthority = async (
  payload: PriorAuthorityApplicationRequest,
): Promise<PriorAuthorityApplicationResponse> => {
  const { data }: { data: PriorAuthorityApplicationResponse } = await api.post(
    `${process.env.BACKEND_URL}/prior-authority`,
    payload,
  );
  return data;
};
