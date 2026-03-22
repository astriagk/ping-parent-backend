import { Router } from "express";

import { subscriptionPlanHandlers } from "@modules/billing/subscription_plan/subscription_plan.routes";

const router = Router();

// --- Subscription Plans ---
router.post(
  "/subscription-plans",
  subscriptionPlanHandlers.admin.validateCreate,
  subscriptionPlanHandlers.admin.create,
);
router.put(
  "/subscription-plans/:id",
  subscriptionPlanHandlers.admin.validateUpdate,
  subscriptionPlanHandlers.admin.update,
);
router.patch(
  "/subscription-plans/:id/activate",
  subscriptionPlanHandlers.admin.activate,
);
router.patch(
  "/subscription-plans/:id/deactivate",
  subscriptionPlanHandlers.admin.deactivate,
);

export default router;
