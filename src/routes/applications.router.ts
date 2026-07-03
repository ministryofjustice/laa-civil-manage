import express from "express";
import { getApplicationsList } from "#src/controllers/applications.controller.js";

const applicationsRouter = express.Router();

applicationsRouter.get("/", getApplicationsList);

export default applicationsRouter;
