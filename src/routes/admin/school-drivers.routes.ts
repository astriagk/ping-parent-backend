import { Router } from "express";

import { schoolDriverHandlers } from "@modules/users/school_driver/school_driver.routes";

const router = Router();

// --- School Drivers ---
router.get("/school-drivers/:schoolId", schoolDriverHandlers.admin.getBySchool);
router.post("/school-drivers/assign", schoolDriverHandlers.admin.assign);
router.post(
  "/school-drivers/:driverId/remove",
  schoolDriverHandlers.admin.remove,
);
router.get(
  "/school-drivers/:driverId/details",
  schoolDriverHandlers.admin.getDetails,
);

export default router;
