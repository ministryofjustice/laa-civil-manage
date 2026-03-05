import {
  getApplicationById,
  getApplications,
} from "#src/controllers/applications.controllers.js";
import express from "express";

const applicationsRouter = express.Router();

applicationsRouter.get("/", getApplications);

applicationsRouter.get("/:id", getApplicationById);

export default applicationsRouter;
