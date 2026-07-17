import { api } from "#src/middleware/auth/api-client.js";
import type {
  DraftGetResponse,
  DraftPostResponse,
} from "#src/types/priorAuthority/draft.js";
import { mapPriorAuthorityToDraftBody } from "#src/utils/mappers/priorAuthorityDraftsMapper.js";
import type { PriorAuthority } from "#src/types/priorAuthority/shared.js";

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
    const { data } = await api.post<DraftPostResponse>(
      `${process.env.BACKEND_URL}/prior-authority/drafts`,
      mappedDraftBody,
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
    const { data }: { data: DraftGetResponse[] } = await api.get(
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
    await api.delete(
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
  applicationId,
  draftBody,
}: {
  draftId: string;
  applicationId: string;
  draftBody: Partial<PriorAuthority>;
}): Promise<void> => {
  try {
    await api.put(
      `${process.env.BACKEND_URL}/prior-authority/drafts/${draftId}`,
      mapPriorAuthorityToDraftBody(applicationId, draftBody),
    );
  } catch (error) {
    throw new Error(
      `Failed to update draft: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
