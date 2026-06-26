import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import { DEV_APPLICATION_ID } from "#src/constants.js";
import { submitPriorAuthority } from "#src/models/priorAuthorityModels.js";
import type {
  PriorAuthority,
  UploadedDocument,
} from "#src/types/priorAuthority.js";
import { buildUploadedFilesList } from "#src/utils/documentUploadHelpers.js";
import type { ExpertTypeOption } from "#src/types/csrfTypes.js";
import { logger } from "#src/utils/logger.js";
import { mapPriorAuthorityToApplicationRequest } from "#src/utils/mappers/priorAuthorityApplicationMapper.js";
import { deleteDraft } from "#src/models/draftsModels.js";
import {
  buildAddressSelectItems,
  evaluateExpertBasedInLondon,
} from "#src/utils/expertBasedInLondonFlow.js";

function getStoredDocs(req: Request): UploadedDocument[] {
  const priorAuthority: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};
  return priorAuthority.uploadedDocuments ?? [];
}

export const getStartPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/startPage.njk");
};

export const getPriorAuthorityTypePage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/typePriorAuthority.njk");
};

export const postPriorAuthorityType = (req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/is-guideline-rate-exceeded");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/confirmationPage");
};

export const getExpertDetailsPage = (req: Request, res: Response): void => {
  const priorAuthority = req.session.priorAuthority ?? {};
  const expertTypes: ExpertTypeOption[] = res.locals.expertTypes ?? [];
  const currentExpertType = priorAuthority.expertType?.trim();
  const selectedExpertType = currentExpertType
    ? expertTypes.some((expertType) => expertType.value === currentExpertType)
      ? currentExpertType
      : "Other"
    : undefined;
  const otherExpertType =
    currentExpertType && selectedExpertType === "Other"
      ? currentExpertType
      : undefined;

  res.render("priorAuthorityForm/expertDetails", {
    priorAuthority,
    fallbackSelectedExpertType: selectedExpertType,
    fallbackOtherExpertType: otherExpertType,
  });
};

export const postExpertDetails = (req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/expert-costs");
};

export const getGuidelineRatesExceededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/isGuidelineRateExceeded");
};

export const postGuidelineRatesExceededPage = (
  req: Request<unknown, unknown, { GuidelineRatesExceeded?: string }>,
  res: Response,
): void => {
  if (req.body.GuidelineRatesExceeded === "Yes") {
    res.redirect("/prior-authority-form/expert-based-in-london");
  } else {
    res.redirect("/prior-authority-form/no-prior-authority-needed");
  }
};

export const getExpertCostsPage = (req: Request, res: Response): void => {
  const priorAuthority = req.session.priorAuthority ?? {};
  res.render("priorAuthorityForm/expertCosts", { priorAuthority });
};

export const postExpertCosts = (req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/document-upload");
};

export const getCheckYourAnswersPage = (req: Request, res: Response): void => {
  res.render("priorAuthorityForm/checkYourAnswers");
};

export const postCheckYourAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const priorAuthority: Partial<PriorAuthority> =
    req.session.priorAuthority ?? {};

  // TODO: source applicationId from the parent application once that flow exists.
  const applicationId = DEV_APPLICATION_ID;

  try {
    const payload = mapPriorAuthorityToApplicationRequest(
      applicationId,
      priorAuthority,
    );
    const response = await submitPriorAuthority(payload);
    req.session.priorAuthority = undefined;
    logger.logInfo(
      "postCheckYourAnswers",
      `Prior authority application submitted: submissionId=${response.submissionId} status=${response.status}`,
      req,
    );

    if (req.session.draftId) {
      const deletedDraftId = req.session.draftId;
      await deleteDraft(req.session.draftId);
      req.session.draftId = undefined;
      logger.logInfo(
        "postCheckYourAnswers",
        `Deleted draft with ID: ${deletedDraftId}`,
        req,
      );
    }

    res.redirect("/prior-authority-form/confirmation-page");
  } catch (error) {
    logger.logError(
      "postCheckYourAnswers",
      "Failed to submit prior authority",
      error,
      req,
    );
    next(error);
  }
};

export const getDocumentUploadPage = (req: Request, res: Response): void => {
  const storedDocs = getStoredDocs(req);
  const uploadedFiles = buildUploadedFilesList(storedDocs);
  res.render("priorAuthorityForm/documentUpload", { uploadedFiles });
};

export const postUploadedDocuments = (_req: Request, res: Response): void => {
  res.redirect("/prior-authority-form/check-your-answers");
};

export const getNoPriorAuthorityNeededPage = (
  req: Request,
  res: Response,
): void => {
  res.render("priorAuthorityForm/noPriorAuthorityNeeded");
};

export const getExpertBasedInLondonPage = (
  req: Request,
  res: Response,
): void => {
  renderExpertBasedInLondonPage(req, res);
};

interface ExpertBasedInLondonBody {
  expertPostcode: string;
  expertAddressSelection?: string;
}

type ExpertBasedInLondonRequest = Request<
  Record<string, string>,
  unknown,
  ExpertBasedInLondonBody
>;

interface RenderExpertBasedInLondonParams {
  errors?: Array<{ text: string; href: string }>;
  errorMap?: Record<string, string>;
  values?: {
    expertPostcode?: string;
    expertAddressSelection?: string;
  };
  addressOptions?: Array<{ label: string }>;
  addressSelectItems?: Array<{
    value: string;
    text: string;
    selected?: boolean;
  }>;
  londonDecision?: {
    value: "Yes" | "No";
  };
}

const renderExpertBasedInLondonPage = (
  req: Request,
  res: Response,
  params: RenderExpertBasedInLondonParams = {},
): void => {
  res.render("priorAuthorityForm/expertBasedInLondon", {
    priorAuthority: req.session.priorAuthority ?? {},
    errors: params.errors,
    errorMap: params.errorMap,
    values: params.values,
    addressOptions: params.addressOptions ?? [],
    addressSelectItems:
      params.addressSelectItems ??
      buildAddressSelectItems([], params.values?.expertAddressSelection),
    londonDecision: params.londonDecision,
  });
};

const persistExpertLocationSelection = (
  priorAuthority: Partial<PriorAuthority>,
  postcode: string,
  selectedAddress: string | undefined,
  addresses: Array<{ label: string }>,
): Partial<PriorAuthority> => {
  const updatedPriorAuthority: Partial<PriorAuthority> = {
    ...priorAuthority,
    expertPostcode: postcode,
    expertAddressSelection: selectedAddress,
  };

  if (selectedAddress) {
    const selectedAddressOption = addresses.find(
      (address) => address.label === selectedAddress,
    );
    updatedPriorAuthority.expertAddressLabel = selectedAddressOption?.label;
  } else {
    updatedPriorAuthority.expertAddressLabel = undefined;
  }

  return updatedPriorAuthority;
};
export const postExpertBasedInLondonPage = async (
  req: ExpertBasedInLondonRequest,
  res: Response,
): Promise<void> => {
  const postcode = req.body.expertPostcode.trim().toUpperCase();
  const selectedAddress = req.body.expertAddressSelection?.trim();

  try {
    const flowOutcome = await evaluateExpertBasedInLondon({
      postcode,
      selectedAddress,
    });

    if (flowOutcome.type === "needs-selection") {
      renderExpertBasedInLondonPage(req, res, {
        errors: [
          {
            text: "We need more information. Select an address below.",
            href: "#expertAddressSelection",
          },
        ],
        errorMap: {
          expertAddressSelection:
            "We need more information. Select an address below.",
        },
        values: {
          expertPostcode: flowOutcome.postcode,
          expertAddressSelection: flowOutcome.selectedAddress,
        },
        addressOptions: flowOutcome.addresses,
        addressSelectItems: buildAddressSelectItems(
          flowOutcome.addresses,
          flowOutcome.selectedAddress,
        ),
      });
      return;
    }

    if (flowOutcome.type === "error") {
      renderExpertBasedInLondonPage(req, res, {
        errors: [
          {
            text: flowOutcome.message,
            href: "#expertPostcode",
          },
        ],
        errorMap: {
          expertPostcode: flowOutcome.message,
        },
        values: {
          expertPostcode: flowOutcome.postcode,
          expertAddressSelection: flowOutcome.selectedAddress,
        },
      });
      return;
    }

    req.session.priorAuthority = persistExpertLocationSelection(
      req.session.priorAuthority ?? {},
      flowOutcome.postcode,
      flowOutcome.selectedAddress,
      flowOutcome.addresses,
    );

    req.session.priorAuthority.expertBasedInLondon =
      flowOutcome.expertBasedInLondon;

    renderExpertBasedInLondonPage(req, res, {
      values: {
        expertPostcode: flowOutcome.postcode,
        expertAddressSelection: flowOutcome.selectedAddress,
      },
      londonDecision: {
        value: flowOutcome.expertBasedInLondon,
      },
    });
  } catch (error) {
    logger.logError(
      "postExpertBasedInLondonPage",
      "Failed to process postcode lookup",
      error,
      req,
    );

    renderExpertBasedInLondonPage(req, res, {
      errors: [
        {
          text: "We could not check that postcode right now. Try again.",
          href: "#expertPostcode",
        },
      ],
      errorMap: {
        expertPostcode:
          "We could not check that postcode right now. Try again.",
      },
      values: {
        expertPostcode: postcode,
        expertAddressSelection: selectedAddress,
      },
    });
  }
};
