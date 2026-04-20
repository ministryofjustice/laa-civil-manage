import express from "express";

import {
  getConfirmationPage,
  getPaTypePage,
  getPrototype,
  getStartPage,
} from "#src/controllers/pa-form.controllers.js";

const paFormRouter = express.Router();

// TODO This can be removed once the app has a landing page
paFormRouter.get("/", getStartPage);

paFormRouter.get("/pa-form/start-page", getStartPage);

paFormRouter.get("/pa-form/type-pa", getPaTypePage);

paFormRouter.get("/pa-form/confirmation-page", getConfirmationPage);

paFormRouter.get("/pa-form/prototype", getPrototype);

export default paFormRouter;
