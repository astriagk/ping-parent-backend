import { Router } from "express";

import { subscriptionHandlers } from "@modules/billing/parent_subscription/parent_subscription.routes";

const router = Router();

// --- Subscriptions (parent) ---
router.get("/subscriptions", subscriptionHandlers.admin.getAll);

export default router;
