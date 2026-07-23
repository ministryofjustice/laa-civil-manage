import type { NextFunction, Request, Response } from "express";
import { getApplications } from "#src/models/applications.models.js";

import { logger } from "#src/utils/logger.js";
import { toApplicationTableRows } from "#src/utils/mappers/applicationMappers.js";

const parsePage = (pageQuery: Request["query"]["page"]): number => {
  const raw = typeof pageQuery === "string" ? pageQuery : undefined;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

export const getAllApplicationsPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const currentPage = parsePage(req.query.page); // 1-indexed, same as API
    const { paging, applications } = await getApplications(currentPage);

    const { totalRecords, pageSize, itemsReturned, page } = paging;
    const totalPages =
      pageSize > 0 ? Math.max(1, Math.ceil(totalRecords / pageSize)) : 1;
    const from = (page - 1) * pageSize + 1;
    const to = (page - 1) * pageSize + itemsReturned;

    const paginationItems = Array.from({ length: totalPages }, (_, i) => ({
      number: i + 1,
      href: `/applications?page=${i + 1}`,
      current: i + 1 === currentPage,
    }));

    const pagination = {
      ...(currentPage > 1 && {
        previous: { href: `/applications?page=${currentPage - 1}` },
      }),
      ...(currentPage < totalPages && {
        next: { href: `/applications?page=${currentPage + 1}` },
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
