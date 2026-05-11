import { Router } from "express";

import { driverHandlers } from "@modules/users/driver/driver.routes";

const router = Router();

router.post(
  "/drivers",
  driverHandlers.admin.validateCreate,
  driverHandlers.admin.create,
);
router.put(
  "/drivers/:driverId",
  driverHandlers.admin.validateUpdate,
  driverHandlers.admin.update,
);
router.delete("/drivers/:driverId", driverHandlers.admin.delete);

router.get("/drivers/:driverId/address", driverHandlers.admin.getAddress);
router.put(
  "/drivers/:driverId/address",
  driverHandlers.admin.validateAddress,
  driverHandlers.admin.upsertAddress,
);

router.get("/drivers/:driverId/documents", driverHandlers.admin.getDocuments);
router.post(
  "/drivers/:driverId/documents",
  driverHandlers.admin.validateUpsertDocuments,
  driverHandlers.admin.upsertDocuments,
);
router.put(
  "/drivers/:driverId/documents",
  driverHandlers.admin.validateUpdateDocuments,
  driverHandlers.admin.updateDocuments,
);

export default router;
