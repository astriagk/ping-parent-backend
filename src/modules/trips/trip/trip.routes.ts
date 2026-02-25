import { validate } from "@shared/middlewares";

import {
  createTrip,
  deleteTripProfile,
  getAllTripsController,
  getCompletedTripDetails,
  getMyActiveTrips,
  getMyTrips,
  getMyTripsByDate,
  getTripProfile,
  getTripProgress,
  updateTripProfile,
  updateTripStatus,
} from "./trip.controller";
import {
  createTripSchema,
  updateTripSchema,
  updateTripStatusSchema,
} from "./trip.validation";

/**
 * Handler group for trip module.
 * Import in src/routes/driver.routes.ts, admin.routes.ts.
 * NO auth middleware lives here.
 */
export const tripHandlers = {
  // Driver-specific
  driver: {
    validateCreate: validate(createTripSchema),
    create: createTrip,
    getMyTrips: getMyTrips,
    getMyTripsByDate: getMyTripsByDate,
    validateUpdateStatus: validate(updateTripStatusSchema),
    updateStatus: updateTripStatus,
    getActiveTrips: getMyActiveTrips,
    getProgress: getTripProgress,
    getCompletedDetails: getCompletedTripDetails,
    getById: getTripProfile,
    validateUpdate: validate(updateTripSchema),
    update: updateTripProfile,
    delete: deleteTripProfile,
  },

  // Admin-specific
  admin: {
    getAll: getAllTripsController,
  },
};
