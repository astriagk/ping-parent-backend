import { Router } from "express";

import { schoolHandlers } from "@modules/school/school.routes";

const router = Router();

// --- Their School ---
router.get("/school", schoolHandlers.shared.getAll);

export default router;
