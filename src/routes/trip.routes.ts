import { Router } from "express";

import {
  createTrip,
  deleteTripProfile,
  getAllTripsController,
  getMyActiveTrips,
  getMyTrips,
  getMyTripsByDate,
  getTripProfile,
  updateTripProfile,
  updateTripStatus,
} from "@controllers/trip.controller";
import { validate, verifyAdminToken, verifyDriverToken } from "@middlewares";
import {
  createTripSchema,
  updateTripSchema,
  updateTripStatusSchema,
} from "@validations/trip.validation";

const router = Router();

// Admin routes
router.get("/admin/all-trips", verifyAdminToken, getAllTripsController);

// All routes require driver authentication
router.use(verifyDriverToken);

// 01. Create Trip (Driver)
router.post("/", validate(createTripSchema), createTrip);

// 02. Get My Trips (Driver)
router.get("/my-trips", getMyTrips);

// 03. Get Trips by Date
router.get("/my-trips/by-date", getMyTripsByDate);

// 04. Start Trip / Update Trip Status
router.patch("/:id/status", validate(updateTripStatusSchema), updateTripStatus);

// 05. Complete Trip (handled by Update Trip Status endpoint)
// (Same as above - uses status field)

// Additional Routes
// Get Active Trips
router.get("/my-trips/active", getMyActiveTrips);

// Get Trip Details
router.get("/:id", getTripProfile);

// Update Trip
router.put("/:id", validate(updateTripSchema), updateTripProfile);

// Delete Trip
router.delete("/:id", deleteTripProfile);

export default router;
