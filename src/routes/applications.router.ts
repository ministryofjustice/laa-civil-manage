// routes/applications.ts
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

const router = express.Router();

router.get(
  "/applications",
  (req: Request, res: Response, next: NextFunction) => {
    const application = {
      applicationId: "b6f23f0b-9c61-44d0-9a3b-2a1d1a1f9f31",
      clientFirstName: "Jane",
      clientLastName: "Smith",
      status: "PENDING",
    };

    res.render("applications/index", { application });
  },
);

export default router;
