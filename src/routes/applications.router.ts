import express from "express";
import { getAllApplicationsPage } from "#src/controllers/applications.controller.js";

const applicationsRouter = express.Router();

applicationsRouter.get("/", getAllApplicationsPage);

export default applicationsRouter;
