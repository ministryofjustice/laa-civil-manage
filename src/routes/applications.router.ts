import axios from "#node_modules/axios/index.js";
import type { Application } from "#types/application.js";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

const applicationsRouter = express.Router();

applicationsRouter.get(
  "/applications",
  async (req: Request, res: Response, next: NextFunction) => {
    const { data }: { data: Application[] } = await axios.get(
      "http://localhost:8080/applications",
    );

    res.render("applications/index", { application: data[0] });
  },
);

export default applicationsRouter;
