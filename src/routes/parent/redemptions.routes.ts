import { Router } from "express";

import { redemptionHandlers } from "@modules/billing/redemption/redemption.routes";

const router = Router();

// --- Redemptions ---
router.post(
  "/redemptions/redeem",
  redemptionHandlers.parent.validateRedeem,
  redemptionHandlers.parent.redeem,
);
router.get("/redemptions/active", redemptionHandlers.parent.getActive);
router.get("/redemptions", redemptionHandlers.parent.getAll);
router.get("/redemptions/status/check", redemptionHandlers.parent.checkStatus);
router.get("/redemptions/:subscriptionId", redemptionHandlers.parent.getById);
router.post(
  "/redemptions/cancel",
  redemptionHandlers.parent.validateCancel,
  redemptionHandlers.parent.cancel,
);

export default router;
