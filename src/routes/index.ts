import { Router } from "express";

import authRoutes from "./auth.routes";
import driverRoutes from "./driver.routes";
import parentRoutes from "./parent.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/parent", parentRoutes);
router.use("/driver", driverRoutes);

export default router;
