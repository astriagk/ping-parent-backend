import { Router } from "express";

import { trackingHandlers } from "@modules/tracking/tracking.routes";

const router = Router();

// --- Tracking ---
router.post("/tracking/cleanup", trackingHandlers.admin.cleanup);

export default router;
