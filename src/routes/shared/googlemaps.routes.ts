import { Router } from "express";

import { googlemapsHandlers } from "@modules/googlemaps/googlemaps.routes";
import { verifyParentTripAccess } from "@shared/middlewares/trip-ownership.middleware";

const router = Router();

// --- Google Maps (read-only, parents can only access trips with their students) ---
router.get(
  "/googlemaps/:tripId/tracking",
  verifyParentTripAccess,
  googlemapsHandlers.shared.getTracking,
);
router.get(
  "/googlemaps/:tripId/current-position",
  verifyParentTripAccess,
  googlemapsHandlers.shared.getCurrentPosition,
);
router.get(
  "/googlemaps/:tripId/details",
  verifyParentTripAccess,
  googlemapsHandlers.shared.getRouteDetails,
);

export default router;
