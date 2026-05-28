import axios from "#node_modules/axios";
import type {
  DraftGetResponse,
  DraftPostResponse,
} from "#src/types/drafts/api-types.js";
import type { PriorAuthority } from "#src/types/prior-authority.js";
import { mapPriorAuthorityToDraftBody } from "#src/utils/mappers/priorAuthorityDraftsMapper.js";

export const postDraft = async ({
  applicationId,
  draftBody,
}: {
  applicationId: string;
  draftBody: Partial<PriorAuthority>;
}): Promise<DraftPostResponse> => {
  const mappedDraftBody = mapPriorAuthorityToDraftBody(
    applicationId,
    draftBody,
  );

  try {
    const { data }: { data: DraftPostResponse } = await axios.post(
      `${process.env.BACKEND_URL}/prior-authority/drafts`,
      { draft: mappedDraftBody },
    );

    return data;
  } catch (error) {
    throw new Error(
      `Failed to post draft: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};

export const getDrafts = async ({
  applicationId,
}: {
  applicationId?: string;
}): Promise<DraftGetResponse[]> => {
  try {
    const { data }: { data: DraftGetResponse[] } = await axios.get(
      `${process.env.BACKEND_URL}/prior-authority/drafts`,
    );

    return data;
  } catch (error) {
    throw new Error(
      `Failed to get draft: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};

export const deleteDraft = async (draftId: string): Promise<void> => {
  try {
    await axios.delete(
      `${process.env.BACKEND_URL}/prior-authority/drafts/${draftId}`,
    );
  } catch (error) {
    throw new Error(
      `Failed to delete draft: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};

export const putDraft = async ({
  draftId,
  draftBody,
}: {
  draftId: string;
  draftBody: Partial<PriorAuthority>;
}): Promise<void> => {
  try {
    await axios.put(
      `${process.env.BACKEND_URL}/prior-authority/drafts/${draftId}`,
      { draft: mapPriorAuthorityToDraftBody(draftId, draftBody) },
    );
  } catch (error) {
    throw new Error(
      `Failed to update draft: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
