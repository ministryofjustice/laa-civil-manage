import express from "express";
import expertRouter from "#src/routes/priorAuthority/expert/expertRouter.js";
import counselRouter from "#src/routes/priorAuthority/counsel/counselRouter.js";
import { getApplyForPriorAuthorityPage } from "#src/controllers/priorAuthority/shared/sharedController.js";
import { loadApplicationReference } from "#src/middleware/priorAuthority/shared/loadApplicationReference.js";

const priorAuthorityRouter = express.Router();

priorAuthorityRouter.use(loadApplicationReference);

priorAuthorityRouter.get("/apply", getApplyForPriorAuthorityPage);
priorAuthorityRouter.use("/expert", expertRouter);
priorAuthorityRouter.use("/counsel", counselRouter);

export default priorAuthorityRouter;
