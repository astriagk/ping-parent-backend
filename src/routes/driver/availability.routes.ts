import { Router } from "express";

import { driverHandlers } from "@modules/users/driver/driver.routes";

const router = Router();

// --- Availability ---
router.patch("/availability", driverHandlers.setAvailability);

export default router;
