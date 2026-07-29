import express from "express";
import expertRouter from "#src/routes/priorAuthority/expert/expertRouter.js";
import counselRouter from "#src/routes/priorAuthority/counsel/counselRouter.js";
import { getApplyForPriorAuthorityPage } from "#src/controllers/priorAuthority/shared/sharedController.js";

const priorAuthorityRouter = express.Router();

priorAuthorityRouter.get("/apply", getApplyForPriorAuthorityPage);
priorAuthorityRouter.use("/expert", expertRouter);
priorAuthorityRouter.use("/counsel", counselRouter);

export default priorAuthorityRouter;
