import { fetchExpertTypes } from "#src/models/expertTypes.models.js";
import type { Request, Response, NextFunction } from "express";

export const loadExpertTypesMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rawExpertTypes: string[] = await fetchExpertTypes();
    const formattedExpertTypes = rawExpertTypes.map((expertType) => ({
      text: expertType,
      value: expertType,
    }));

    res.locals.expertTypes = [
      { value: "", text: "" },
      ...formattedExpertTypes,
      { value: "Other", text: "Other" },
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
