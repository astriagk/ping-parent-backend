import { Router } from "express";

import { verifySchoolAdminToken } from "@shared/middlewares";

import driversRouter from "./drivers.routes";
import schoolRouter from "./school.routes";

const router = Router();

/**
 * SCHOOL-ADMIN GATEWAY — school_admin only
 * All routes scoped to their school via req.admin.school_id
 */
router.use(verifySchoolAdminToken);

router.use("/", schoolRouter);
router.use("/", driversRouter);

export default router;
