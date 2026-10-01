import type {
  NextFunction,
  Request,
  Response,
} from "#node_modules/@types/express/index.js";
import { logger } from "#src/utils/logger.js";

export const routeNotFound = (_: Request, res: Response): void => {
  res.status(404).render("errors/notFound", {
    status: 404,
    message: "Page not found",
  });
};

const isCsrfTokenError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code?: unknown }).code === "EBADCSRFTOKEN";

const isRequestTooLargeError = (err: unknown): boolean => {
  if (typeof err !== "object" || err === null) {
    return false;
  }

  const error = err as {
    status?: unknown;
    response?: { status?: unknown };
  };

  return error.status === 413 || error.response?.status === 413;
};

const justificationPageDetails = (
  path: string,
): {
  backLinkHref: string;
  formAction: string;
  heading: string;
  hintText: string;
  section: "expert" | "counsel" | "disbursement";
} | null => {
  if (path === "/prior-authority/counsel/justification") {
    return {
      backLinkHref: "/prior-authority/counsel/type",
      formAction: path,
      heading: "Why is this application necessary?",
      hintText:
        "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required",
      section: "counsel",
    };
  }

  if (path === "/prior-authority/expert/justification") {
    return {
      backLinkHref: "/prior-authority/expert/costs-shared",
      formAction: path,
      heading: "Is there anything else you'd like to tell us?",
      hintText:
        "Provide a background to the case that demonstrates the relevant circumstances and explanation of the specific service required",
      section: "expert",
    };
  }

  if (path === "/prior-authority/disbursement/justification") {
    return {
      backLinkHref: "/prior-authority/disbursement/details",
      formAction: path,
      heading: "Why is this disbursement required?",
      hintText: "Explain why this request is necessary",
      section: "disbursement",
    };
  }

  return null;
};

export const serverErrors = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (isCsrfTokenError(err)) {
    logger.logInfo(
      "Server Error Middleware",
      "CSRF token invalid — likely expired session, destroying session and redirecting to timeout page",
      req,
    );

    req.session.destroy((destroyErr: unknown) => {
      if (destroyErr != null) {
        logger.logError(
          "Server Error Middleware",
          "Failed to destroy session after CSRF error",
          destroyErr,
          req,
        );
      }

      res.redirect("/session-timeout");
    });
    return;
  }

  const pageDetails = justificationPageDetails(req.path);
  if (isRequestTooLargeError(err) && pageDetails) {
    const message =
      "Your justification is too large to send. Please try again with less text.";
    const { section, ...renderDetails } = pageDetails;

    logger.logError(
      "Server Error Middleware",
      "Justification is too large",
      err,
      req,
    );
    res.render("priorAuthority/justificationPage", {
      ...renderDetails,
      values: {
        justification: req.priorAuthority?.[section].justification,
      },
      errors: [{ href: "#justification", text: message }],
      errorMap: { justification: message },
    });
    return;
  }

  logger.logError("Server Error Middleware", "Internal Server Error", err, req);
  res.render("errors/index", { status: 500, message: "Internal Server Error" });
};
