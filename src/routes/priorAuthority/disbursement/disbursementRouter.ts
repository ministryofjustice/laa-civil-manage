import { getDisbursementLandingPage } from "#src/controllers/priorAuthority/disbursement/disbursementController.js";
import express from "express";

const disbursementRouter = express.Router();

disbursementRouter.get("/", getDisbursementLandingPage);

export default disbursementRouter;
