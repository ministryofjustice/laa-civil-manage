import express from "express";
import expertRouter from "#src/routes/priorAuthority/expert/expertRouter.js";
import sharedRouter from "#src/routes/priorAuthority/sharedRouter.js";

const priorAuthorityRouter = express.Router();

priorAuthorityRouter.use(sharedRouter);
priorAuthorityRouter.use(expertRouter);

export default priorAuthorityRouter;
