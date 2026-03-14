import { validate } from "@shared/middlewares";

import {
  calculateGoogleRouteHandler,
  cleanGoogleTrackingDataHandler,
  getCurrentGooglePositionHandler,
  getGoogleRouteDetailsHandler,
  getGoogleTrackingHandler,
  recalculateGoogleRouteHandler,
  updateGooglePositionHandler,
} from "./googlemaps.controller";
import {
  calculateGoogleRouteSchema,
  recalculateGoogleRouteSchema,
  updateGooglePositionSchema,
} from "./googlemaps.validation";

/**
 * Handler group for Google Maps module.
 * Import in src/routes/driver.routes.ts, shared.routes.ts, admin.routes.ts — NO auth middleware here.
 */
export const googlemapsHandlers = {
  // Driver-specific
  driver: {
    validateCalculate: validate(calculateGoogleRouteSchema),
    calculate: calculateGoogleRouteHandler,
    validateRecalculate: validate(recalculateGoogleRouteSchema),
    recalculate: recalculateGoogleRouteHandler,
    validateUpdatePosition: validate(updateGooglePositionSchema),
    updatePosition: updateGooglePositionHandler,
  },

  // Shared (any authenticated user)
  shared: {
    getTracking: getGoogleTrackingHandler,
    getCurrentPosition: getCurrentGooglePositionHandler,
    getRouteDetails: getGoogleRouteDetailsHandler,
  },

  // Admin-specific
  admin: {
    cleanup: cleanGoogleTrackingDataHandler,
  },
};
