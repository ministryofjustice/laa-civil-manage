import {
  getApplicationById,
  getApplications,
} from "#src/controllers/application.controller.js";
import express from "express";

const applicationsRouter = express.Router();

applicationsRouter.get("/applications", getApplications);

applicationsRouter.get("/applications/:id", getApplicationById);

export default applicationsRouter;
