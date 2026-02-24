import { Router } from "express";

import "@modules/users";

import adminRoutes from "./admin.routes";
import newAuthRoutes from "./auth.routes";
import newDriverRoutes from "./driver.routes";
import newParentRoutes from "./parent.routes";
import publicRoutes from "./public.routes";
import schoolAdminRoutes from "./school-admin.routes";
import sharedRoutes from "./shared.routes";
import superadminRoutes from "./superadmin.routes";

const router = Router();

router.use("/auth", newAuthRoutes);
router.use("/public", publicRoutes);
router.use("/shared", sharedRoutes);
router.use("/parent", newParentRoutes);
router.use("/driver", newDriverRoutes);
router.use("/admin", adminRoutes);
router.use("/superadmin", superadminRoutes);
router.use("/school-admin", schoolAdminRoutes);

export default router;
