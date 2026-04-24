import { Router } from "express";

import { googlemapsHandlers } from "@modules/googlemaps/googlemaps.routes";

const router = Router();

// --- Google Maps ---
router.post("/googlemaps/cleanup", googlemapsHandlers.admin.cleanup);

export default router;
