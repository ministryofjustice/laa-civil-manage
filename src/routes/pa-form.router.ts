import express from "express";

import {
  getConfirmationPage,
  getPaTypePage,
  getStartingPage,
} from "#src/controllers/pa-form.controllers.js";

const paFormRouter = express.Router();

// TODO This can be removed once the app has a landing page
paFormRouter.get("/", getStartingPage);

paFormRouter.get("/pa-form/start-page", getStartingPage);

paFormRouter.get("/pa-form/type-pa", getPaTypePage);

paFormRouter.get("/pa-form/confirmation-page", getConfirmationPage);

export default paFormRouter;
