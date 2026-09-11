import type { NextFunction, Request, Response } from "express";
import { setApplicationInSession } from "#src/middleware/priorAuthority/shared/applicationSession.js";
import {
  getApplicationById,
  getApplications,
} from "#src/models/applications.models.js";

import { logger } from "#src/utils/logger.js";
import {
  toApplicationSummaryRows,
  toApplicationTableRows,
} from "#src/utils/mappers/applicationMappers.js";
import type { ApplicationSearch } from "#src/types/applications.js";

const parsePage = (raw: string | undefined): number => {
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

const parseSearch = (query: Request["query"]): ApplicationSearch => {
  const search: ApplicationSearch = {};

  for (const field of [
    "laaReference",
    "clientFirstName",
    "clientLastName",
  ] as const) {
    const value = query[field];
    if (typeof value === "string" && value.trim() !== "") {
      search[field] = value.trim();
    }
  }

  return search;
};

const buildApplicationsUrl = (
  page: number | undefined,
  search: ApplicationSearch,
): string => {
  const params = new URLSearchParams();

  if (page !== undefined) {
    params.set("page", String(page));
  }

  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string" && value !== "") {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/applications?${query}` : "/applications";
};

export const getAllApplicationsPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pageParam =
      typeof req.query.page === "string" ? req.query.page : undefined;
    const search = parseSearch(req.query);

    if (pageParam !== undefined) {
      req.session.applicationsPage = parsePage(pageParam);
      res.redirect(buildApplicationsUrl(undefined, search));
      return;
    }

    const sessionPage = req.session.applicationsPage;
    const currentPage: number =
      typeof sessionPage === "number" ? sessionPage : 1;
    const { paging, applications } = await getApplications(currentPage, search);

    const { totalRecords, pageSize, itemsReturned, page } = paging;
    const totalPages =
      pageSize > 0 ? Math.max(1, Math.ceil(totalRecords / pageSize)) : 1;
    const from = (page - 1) * pageSize + 1;
    const to = (page - 1) * pageSize + itemsReturned;

    const paginationItems = Array.from({ length: totalPages }, (_, i) => ({
      number: i + 1,
      href: buildApplicationsUrl(i + 1, search),
      current: i + 1 === currentPage,
    }));

    const pagination = {
      ...(currentPage > 1 && {
        previous: { href: buildApplicationsUrl(currentPage - 1, search) },
      }),
      ...(currentPage < totalPages && {
        next: { href: buildApplicationsUrl(currentPage + 1, search) },
      }),
      items: paginationItems,
      results: {
        from,
        to,
        count: totalRecords,
        text: "results",
      },
    };

    res.render("applications/allApplications", {
      applicationRows: toApplicationTableRows(applications),
      pagination,
      searchValues: search,
    });
  } catch (error) {
    logger.logError(
      "getAllApplicationsPage",
      "Failed to fetch applications for page render",
      error,
      req,
    );
    next(error);
  }
};

export const getApplicationsList = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const response = await getApplications();
    res.json(response);
  } catch (error) {
    logger.logError(
      "getApplicationsList",
      "Failed to fetch applications",
      error,
      req,
    );
    next(error);
  }
};

export const getManageApplicationPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applicationId = req.params.applicationId;

    if (Array.isArray(applicationId) || !applicationId) {
      res.status(400).send("Application ID is required");
      return;
    }

    const application = await getApplicationById(applicationId);
    setApplicationInSession(req, application);

    res.render("applications/manageApplication", {
      applicationSummary: toApplicationSummaryRows(application),
    });
  } catch (error) {
    logger.logError(
      "getManageApplicationPage",
      "Failed to fetch application for manage page render",
      error,
      req,
    );
    next(error);
  }
};
