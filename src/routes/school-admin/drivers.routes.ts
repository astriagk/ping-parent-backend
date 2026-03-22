import { Router } from "express";

import { schoolDriverHandlers } from "@modules/users/school_driver/school_driver.routes";

const router = Router();

// --- Drivers in their school ---
router.get("/drivers", schoolDriverHandlers.schoolAdmin.getAll);
router.post("/drivers", schoolDriverHandlers.schoolAdmin.add);

export default router;
