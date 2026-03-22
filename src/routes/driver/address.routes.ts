import { Router } from "express";

import { driverHandlers } from "@modules/users/driver/driver.routes";

const router = Router();

// --- Address ---
router.get("/address", driverHandlers.getAddress);
router.post(
  "/address",
  driverHandlers.validateAddress,
  driverHandlers.upsertAddress,
);

export default router;
