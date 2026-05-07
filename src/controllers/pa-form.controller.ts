import type {
  Request,
  Response,
  NextFunction,
} from "#node_modules/@types/express/index.js";
import { fetchExpertTypes } from "#src/models/expertTypes.models.js";

export const getStartPage = (req: Request, res: Response): void => {
  res.render("pa-form/start-page.njk");
};

export const getPaTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/type-pa.njk");
};

export const postPriorAuthorityType = (req: Request, res: Response): void => {
  res.redirect("/pa-form/search-an-expert-type");
};

export const getConfirmationPage = (req: Request, res: Response): void => {
  res.render("pa-form/confirmation-page");
};        

export const loadExpertTypesMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const rawExpertTypes: string[] = await fetchExpertTypes();
    const formattedExpertTypes = rawExpertTypes.map((expertType) => ({
      text: expertType,
      value: expertType,
    }));

    res.locals.expertTypes = [
      { value: "", text: "" }, 
      ...formattedExpertTypes
    ];
    
    next(); 

  } catch (error) {
    if (error instanceof Error) {
      next(error);
    } else {
      next(new Error(String(error)));
    }
  }
};

export const getSearchAnExpertTypePage = (req: Request, res: Response): void => {
  res.render("pa-form/search-an-expert-type.njk");
};

export const postExpertType = (req: Request, res: Response): void => {
  res.redirect("/pa-form/expert-details");
};
