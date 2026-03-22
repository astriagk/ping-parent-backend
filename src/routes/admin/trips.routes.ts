import { Router } from "express";

import { tripHandlers } from "@modules/trips/trip/trip.routes";

const router = Router();

// --- Trips ---
router.get("/trips", tripHandlers.admin.getAll);

export default router;
