import { Router } from "express";

import {
  createTrip,
  deleteTripProfile,
  getMyActiveTrips,
  getMyTrips,
  getMyTripsByDate,
  getTripProfile,
  updateTripProfile,
  updateTripStatus,
} from "@controllers/trip.controller";
import { validate, verifyDriverToken } from "@middlewares";
import {
  createTripSchema,
  updateTripSchema,
  updateTripStatusSchema,
} from "@validations/trip.validation";

const router = Router();

// All routes require driver authentication
router.use(verifyDriverToken);

// Trip CRUD operations
router.post("/", validate(createTripSchema), createTrip);
router.get("/my-trips", getMyTrips);
router.get("/my-trips/by-date", getMyTripsByDate);
router.get("/my-trips/active", getMyActiveTrips);
router.get("/:id", getTripProfile);
router.put("/:id", validate(updateTripSchema), updateTripProfile);
router.patch("/:id/status", validate(updateTripStatusSchema), updateTripStatus);
router.delete("/:id", deleteTripProfile);

export default router;
