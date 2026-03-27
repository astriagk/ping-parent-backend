import { Router } from "express";

import { driverHandlers } from "@modules/users/driver/driver.routes";

const router = Router();

// --- Onboarding ---
router.get("/onboarding/screen", driverHandlers.getOnboardingScreen);
router.put(
  "/onboarding/screen",
  driverHandlers.validateUpdateOnboarding,
  driverHandlers.updateOnboardingScreen,
);

export default router;
