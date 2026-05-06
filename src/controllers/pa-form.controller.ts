import type { Request, Response, NextFunction } from "#node_modules/@types/express/index.js";
import { fetchExpertTypes } from "#src/models/expertTypes.models.js";
import type { PriorAuthorityType } from "#src/types/prior-authority.js";
import { logger } from "#src/utils/logger.js";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};

export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

export const postPriorAuthorityType = (
  req: Request<unknown, unknown, { PriorAuthorityType: PriorAuthorityType }>,
  res: Response,
): void => {
  const priorAuthorityType = req.body.PriorAuthorityType;
  req.session.priorAuthority = { type: priorAuthorityType };

  res.redirect("/pa-form/expert");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};

export const getSearchAnExpertTypePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawExpertTypes = await fetchExpertTypes();

    const formattedExpertTypes = rawExpertTypes.map(expertType => ({
      text: expertType,
      value: expertType
    }));

    formattedExpertTypes.unshift({
      value: "",
      text: "Select an expert type",
    });

    res.render("pa-form/search-an-expert-type.njk", { 
      expertTypes: formattedExpertTypes 
    });
  } catch (error) {
    logger.logError(
      req.method,
      "expertTypes: Error Getting Expert Types",
      error,
      req,
    );
    next(error);
  }
};
