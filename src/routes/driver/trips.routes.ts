import { Router } from "express";

import { tripHandlers } from "@modules/trips/trip/trip.routes";

const router = Router();

// --- Trips ---
router.post(
  "/trips",
  tripHandlers.driver.validateCreate,
  tripHandlers.driver.create,
);
router.get("/trips", tripHandlers.driver.getMyTrips);
router.get("/trips/by-date", tripHandlers.driver.getMyTripsByDate);
router.get("/trips/active", tripHandlers.driver.getActiveTrips);
router.patch(
  "/trips/:id/status",
  tripHandlers.driver.validateUpdateStatus,
  tripHandlers.driver.updateStatus,
);
router.get("/trips/:id/progress", tripHandlers.driver.getProgress);
router.get("/trips/:id/completed", tripHandlers.driver.getCompletedDetails);
router.get("/trips/:id", tripHandlers.driver.getById);
router.put(
  "/trips/:id",
  tripHandlers.driver.validateUpdate,
  tripHandlers.driver.update,
);
router.delete("/trips/:id", tripHandlers.driver.delete);

export default router;
