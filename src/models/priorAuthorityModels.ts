import axios from "#node_modules/axios/index.js";

import type {
  PriorAuthorityApplicationRequest,
  PriorAuthorityApplicationResponse,
} from "#src/types/priorAuthorityApi.js";

export const submitPriorAuthority = async (
  payload: PriorAuthorityApplicationRequest,
): Promise<PriorAuthorityApplicationResponse> => {
  const { data }: { data: PriorAuthorityApplicationResponse } =
    await axios.post(`${process.env.BACKEND_URL}/prior-authority`, payload);
  return data;
};
