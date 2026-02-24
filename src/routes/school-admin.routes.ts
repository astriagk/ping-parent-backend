import { Router } from "express";

import { schoolHandlers } from "@modules/school/school.routes";
import { schoolDriverHandlers } from "@modules/users/school_driver/school_driver.routes";
import { verifySchoolAdminToken } from "@shared/middlewares";

const router = Router();

/**
 * SCHOOL-ADMIN GATEWAY — school_admin only
 * All routes scoped to their school via req.admin.school_id
 */
router.use(verifySchoolAdminToken);

// --- Their School ---
router.get("/school", schoolHandlers.shared.getAll);

// --- Drivers in their school ---
router.get("/drivers", schoolDriverHandlers.schoolAdmin.getAll);
router.post("/drivers", schoolDriverHandlers.schoolAdmin.add);

export default router;
