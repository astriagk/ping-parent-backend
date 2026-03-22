import { Router } from "express";

import { schoolHandlers } from "@modules/school/school.routes";

const router = Router();

// --- Schools ---
router.get("/schools", schoolHandlers.shared.getAll);
router.get("/schools/:school_id", schoolHandlers.shared.getById);
router.post(
  "/schools",
  schoolHandlers.admin.validateCreate,
  schoolHandlers.admin.create,
);
router.put(
  "/schools/:school_id",
  schoolHandlers.admin.validateUpdate,
  schoolHandlers.admin.update,
);
router.delete("/schools/:school_id", schoolHandlers.admin.delete);

export default router;
