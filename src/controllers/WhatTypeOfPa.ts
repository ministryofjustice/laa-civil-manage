import type { Request, Response, NextFunction } from "express";
import router from "#src/routes/index.router.js";


export const getWhatTypeOfPa = (
  _req: Request, 
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.render("main/what-type-of-pa"); 
  } catch (error) {
    next(error);
  }
};

router.get("/main/apply-sca-and-other", getWhatTypeOfPa);