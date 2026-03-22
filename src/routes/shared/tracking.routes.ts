import { Router } from "express";

import { trackingHandlers } from "@modules/tracking/tracking.routes";
import { verifyParentTripAccess } from "@shared/middlewares/trip-ownership.middleware";

const router = Router();

// --- Tracking (read-only, parents can only access trips with their students) ---
router.get(
  "/tracking/:tripId/tracking",
  verifyParentTripAccess,
  trackingHandlers.shared.getTracking,
);
router.get(
  "/tracking/:tripId/current-position",
  verifyParentTripAccess,
  trackingHandlers.shared.getCurrentPosition,
);
router.get(
  "/tracking/:tripId/details",
  verifyParentTripAccess,
  trackingHandlers.shared.getRouteDetails,
);

export default router;
