import { Router } from "express";

import {
  validate,
  verifyAdminToken,
  verifyDriverToken,
} from "@shared/middlewares";

import {
  calculateOptimalRouteWithTomTomHandler,
  calculateRouteHandler,
  cleanTrackingDataHandler,
  getCurrentPositionHandler,
  getRouteDetailsHandler,
  getTrackingHandler,
  recalculateRouteHandler,
  updatePositionHandler,
} from "./tracking.controller";
import {
  calculateOptimalRouteWithTomTomSchema,
  calculateRouteSchema,
  updatePositionSchema,
} from "./tracking.validation";

const router = Router();

// Calculate optimal route (free version - simple distance-based optimization)
router.post(
  "/calculate",
  verifyDriverToken,
  validate(calculateRouteSchema),
  calculateRouteHandler,
);

// Calculate optimal route using TomTom Matrix API (premium - includes navigation & alternatives)
router.post(
  "/tomtom",
  verifyDriverToken,
  validate(calculateOptimalRouteWithTomTomSchema),
  calculateOptimalRouteWithTomTomHandler,
);

// Recalculate route from current position (when driver changes route)
// Works with both free and TomTom versions based on initial optimization
router.post(
  "/:tripId/recalculate",
  verifyDriverToken,
  validate(calculateOptimalRouteWithTomTomSchema),
  recalculateRouteHandler,
);

// Update driver's current position during trip
router.patch(
  "/:tripId/position",
  verifyDriverToken,
  validate(updatePositionSchema),
  updatePositionHandler,
);

// Get tracking history for a trip (parents can track assigned students' drivers)
router.get("/:tripId/tracking", getTrackingHandler);

// Get latest driver position for a trip
router.get("/:tripId/current-position", getCurrentPositionHandler);

// Get complete route details including geometry, waypoints, current position
router.get("/:tripId/details", getRouteDetailsHandler);

// Clean old tracking data (admin only)
router.post("/admin/cleanup", verifyAdminToken, cleanTrackingDataHandler);

export default router;
