import { Router } from "express";

import { driverHandlers } from "@modules/users/driver/driver.routes";

const router = Router();

// --- Profile ---
router.get("/profile", driverHandlers.getProfile);
router.post(
  "/profile",
  driverHandlers.validateCreateProfile,
  driverHandlers.createProfile,
);
router.put(
  "/profile",
  driverHandlers.validateUpdateProfile,
  driverHandlers.updateProfile,
);

export default router;
