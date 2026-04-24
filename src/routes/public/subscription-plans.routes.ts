import { Router } from "express";

import { subscriptionPlanHandlers } from "@modules/billing/subscription_plan/subscription_plan.routes";

const router = Router();

// --- Subscription Plans ---
router.get("/subscription-plans", subscriptionPlanHandlers.public.getAll);
router.get("/subscription-plans/:id", subscriptionPlanHandlers.public.getById);

export default router;
