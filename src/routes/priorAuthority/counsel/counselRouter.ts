import express from "express";
import { getCounselLandingPage } from "#src/controllers/priorAuthority/counsel/counselController.js";

const counselRouter = express.Router();

counselRouter.get("/", getCounselLandingPage);

export default counselRouter;
