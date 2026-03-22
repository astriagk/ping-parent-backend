import { Router } from "express";

import { trackingHandlers } from "@modules/tracking/tracking.routes";

const router = Router();

// --- Tracking ---
router.post(
  "/tracking/calculate",
  trackingHandlers.driver.validateOptimal,
  trackingHandlers.driver.calculateOptimal,
);
router.post(
  "/tracking/recalculate",
  trackingHandlers.driver.validateOptimal,
  trackingHandlers.driver.recalculate,
);
router.patch(
  "/tracking/:tripId/position",
  trackingHandlers.driver.validateUpdatePosition,
  trackingHandlers.driver.updatePosition,
);

export default router;
