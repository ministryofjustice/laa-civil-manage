import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import { logger } from "#src/utils/logger.js";

export const routeNotFound = (_: Request, res: Response): void => {
  res.status(404).render("errors/not-found", {
    status: 404,
    message: "Page not found",
  });
};

export const serverErrors = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  logger.logError("Server Error Middleware", "Internal Server Error", err, req);
  res.render("errors/index", { status: 500, message: "Internal Server Error" });
};
