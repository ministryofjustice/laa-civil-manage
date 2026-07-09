import express from "express";
import { getExpertCostsPage } from "#src/controllers/priorAuthority/expert/expertController.js";

const expertRouter = express.Router();

expertRouter.get("/expert-costs", getExpertCostsPage);
