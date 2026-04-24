import { Router } from "express";

import { driverHandlers } from "@modules/users/driver/driver.routes";

const router = Router();

// --- Documents ---
router.get("/documents", driverHandlers.getDocuments);
router.post(
  "/documents",
  driverHandlers.uploadDocumentsMiddleware,
  driverHandlers.validateCreateDocuments,
  driverHandlers.createDocuments,
);
router.put(
  "/documents",
  driverHandlers.uploadDocumentsMiddleware,
  driverHandlers.validateUpdateDocuments,
  driverHandlers.updateDocuments,
);

export default router;
