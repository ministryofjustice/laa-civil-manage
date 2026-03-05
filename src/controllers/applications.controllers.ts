import type {
  Request,
  Response,
  NextFunction,
} from "#node_modules/@types/express/index.js";
import { fetchApplications } from "#src/models/applications.models.js";

export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const application = await fetchApplications();

    res.render("applications/index", { application: application[0] });
  } catch (error) {
    next(error);
  }
};
