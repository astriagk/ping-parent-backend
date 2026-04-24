import { Router } from "express";

import { schoolHandlers } from "@modules/school/school.routes";

const router = Router();

// --- Schools (read-only for any authenticated user) ---
router.get("/schools", schoolHandlers.shared.getAll);
router.get("/schools/:school_id", schoolHandlers.shared.getById);

export default router;
