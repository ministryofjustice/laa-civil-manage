import type {
  Request,
  Response,
  NextFunction,
} from "#node_modules/@types/express/index.js";
import {
  fetchApplicationById,
  fetchApplications,
} from "#src/models/applications.models.js";

export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applications = await fetchApplications();

    res.render("applications/index", { applications });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  try {
    const application = await fetchApplicationById(id);

    res.render("application/index", { application });
  } catch (error) {
    next(error);
  }
};
