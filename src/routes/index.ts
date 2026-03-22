import { Router } from "express";

import "@modules/users";

import adminRoutes from "./admin";
import authRoutes from "./auth";
import driverRoutes from "./driver";
import parentRoutes from "./parent";
import publicRoutes from "./public";
import schoolAdminRoutes from "./school-admin";
import sharedRoutes from "./shared";
import superadminRoutes from "./superadmin";

const router = Router();

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/shared", sharedRoutes);
router.use("/parent", parentRoutes);
router.use("/driver", driverRoutes);
router.use("/admin", adminRoutes);
router.use("/superadmin", superadminRoutes);
router.use("/school-admin", schoolAdminRoutes);

export default router;
