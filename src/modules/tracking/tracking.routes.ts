import { Router } from "express";

import {
  validate,
  verifyAdminToken,
  verifyDriverToken,
} from "@shared/middlewares";

import {
  calculateRouteHandler,
  cleanTrackingDataHandler,
  getCurrentPositionHandler,
  getRouteDetailsHandler,
  getTrackingHandler,
  updatePositionHandler,
} from "./tracking.controller";
import {
  calculateRouteSchema,
  updatePositionSchema,
} from "./tracking.validation";

const router = Router();

// Calculate optimal route for a trip
router.post(
  "/calculate",
  verifyDriverToken,
  validate(calculateRouteSchema),
  calculateRouteHandler,
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
