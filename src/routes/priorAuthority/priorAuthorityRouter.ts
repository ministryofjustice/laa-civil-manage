import express from "express";
import expertRouter from "#src/routes/priorAuthority/expert/expertRouter.js";
import sharedRouter from "#src/routes/priorAuthority/sharedRouter.js";
import counselRouter from "#src/routes/priorAuthority/counsel/counselRouter.js";

const priorAuthorityRouter = express.Router();

priorAuthorityRouter.use(sharedRouter);
priorAuthorityRouter.use(expertRouter);
priorAuthorityRouter.use("/counsel", counselRouter);

export default priorAuthorityRouter;
