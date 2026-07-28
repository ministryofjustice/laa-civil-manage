import express from "express";
import {
  getAllApplicationsPage,
  getManageApplicationPage,
} from "#src/controllers/applications.controller.js";

const applicationsRouter = express.Router();

applicationsRouter.get("/", getAllApplicationsPage);

applicationsRouter.get("/manage/:applicationId", getManageApplicationPage);

export default applicationsRouter;
