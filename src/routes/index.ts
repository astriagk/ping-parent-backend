import { Router } from "express";

import authRoutes from "./auth.routes";
import driverRoutes from "./driver.routes";
import parentRoutes from "./parent.routes";
import studentRoutes from "./student.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/parent", parentRoutes);
router.use("/driver", driverRoutes);
router.use("/students", studentRoutes);

export default router;
