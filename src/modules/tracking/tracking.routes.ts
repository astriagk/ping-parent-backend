import { validate } from "@shared/middlewares";

import {
  calculateOptimalRouteWithTomTomHandler,
  cleanTrackingDataHandler,
  getAlternativeRoutesHandler,
  getCurrentPositionHandler,
  getRouteDetailsHandler,
  getTrackingHandler,
  recalculateRouteHandler,
  updatePositionHandler,
} from "./tracking.controller";
import {
  calculateOptimalRouteWithTomTomSchema,
  getAlternativeRoutesSchema,
  updatePositionSchema,
} from "./tracking.validation";

/**
 * Handler group for tracking module.
 * Import in src/routes/driver.routes.ts, shared.routes.ts, admin.routes.ts — NO auth middleware here.
 *
 * Route calculation strategies (TomTom-only):
 * - calculateOptimal: TomTom Matrix API optimization (accurate)
 * - recalculate: Re-optimize from new position (uses TomTom Matrix)
 */
export const trackingHandlers = {
  // Driver-specific
  driver: {
    validateOptimal: validate(calculateOptimalRouteWithTomTomSchema),
    calculateOptimal: calculateOptimalRouteWithTomTomHandler,
    recalculate: recalculateRouteHandler,
    validateUpdatePosition: validate(updatePositionSchema),
    updatePosition: updatePositionHandler,
  },

  // Shared (any authenticated user)
  shared: {
    getTracking: getTrackingHandler,
    getCurrentPosition: getCurrentPositionHandler,
    getRouteDetails: getRouteDetailsHandler,
    validateGetAlternativeRoutes: validate(getAlternativeRoutesSchema),
    getAlternativeRoutes: getAlternativeRoutesHandler,
  },

  // Admin-specific
  admin: {
    cleanup: cleanTrackingDataHandler,
  },
};
