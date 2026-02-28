import { validate } from "@shared/middlewares";

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

/**
 * Handler group for tracking module.
 * Import in src/routes/driver.routes.ts, shared.routes.ts, admin.routes.ts — NO auth middleware here.
 */
export const trackingHandlers = {
  // Driver-specific
  driver: {
    validateCalculate: validate(calculateRouteSchema),
    calculate: calculateRouteHandler,
    validateTomTom: validate(calculateOptimalRouteWithTomTomSchema),
    calculateTomTom: calculateOptimalRouteWithTomTomHandler,
    validateRecalculate: validate(calculateOptimalRouteWithTomTomSchema),
    recalculate: recalculateRouteHandler,
    validateUpdatePosition: validate(updatePositionSchema),
    updatePosition: updatePositionHandler,
  },

  // Shared (any authenticated user)
  shared: {
    getTracking: getTrackingHandler,
    getCurrentPosition: getCurrentPositionHandler,
    getRouteDetails: getRouteDetailsHandler,
  },

  // Admin-specific
  admin: {
    cleanup: cleanTrackingDataHandler,
  },
};
