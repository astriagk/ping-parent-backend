import { Router } from "express";

import { redemptionHandlers } from "@modules/billing/redemption/redemption.routes";

const router = Router();

// --- Redemption codes (available codes) ---
router.get(
  "/redemptions/available/codes",
  redemptionHandlers.public.getAvailableCodes,
);

export default router;
