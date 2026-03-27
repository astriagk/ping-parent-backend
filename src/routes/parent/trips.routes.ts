import { Router } from "express";

import { parentHandlers } from "@modules/users/parent/parent.routes";

const router = Router();

// --- Trips (read-only for parents) ---
router.get("/trips", parentHandlers.getAllTrips);
router.get("/trips/active", parentHandlers.getActiveTrips);

export default router;
