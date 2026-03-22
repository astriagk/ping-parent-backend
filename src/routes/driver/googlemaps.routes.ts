import { Router } from "express";

import { googlemapsHandlers } from "@modules/googlemaps/googlemaps.routes";

const router = Router();

// --- Google Maps ---
router.post(
  "/googlemaps/calculate",
  googlemapsHandlers.driver.validateCalculate,
  googlemapsHandlers.driver.calculate,
);
router.post(
  "/googlemaps/recalculate",
  googlemapsHandlers.driver.validateRecalculate,
  googlemapsHandlers.driver.recalculate,
);
router.patch(
  "/googlemaps/:tripId/position",
  googlemapsHandlers.driver.validateUpdatePosition,
  googlemapsHandlers.driver.updatePosition,
);

export default router;
