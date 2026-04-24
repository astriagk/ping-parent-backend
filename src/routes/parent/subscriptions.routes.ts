import { Router } from "express";

import { subscriptionHandlers } from "@modules/billing/parent_subscription/parent_subscription.routes";

const router = Router();

// --- Subscriptions ---
router.get(
  "/subscriptions/recommendations",
  subscriptionHandlers.parent.getRecommendations,
);
router.post(
  "/subscriptions",
  subscriptionHandlers.parent.validateCreate,
  subscriptionHandlers.parent.create,
);
router.get("/subscriptions", subscriptionHandlers.parent.getMySubscriptions);
router.get("/subscriptions/active", subscriptionHandlers.parent.getMyActive);
router.get("/subscriptions/details", subscriptionHandlers.parent.getMyDetails);
router.post(
  "/subscriptions/upgrade",
  subscriptionHandlers.parent.validateUpgrade,
  subscriptionHandlers.parent.upgrade,
);
router.get("/subscriptions/:id", subscriptionHandlers.parent.getById);
router.put(
  "/subscriptions/:id",
  subscriptionHandlers.parent.validateUpdate,
  subscriptionHandlers.parent.update,
);
router.post("/subscriptions/:id/cancel", subscriptionHandlers.parent.cancel);
router.delete("/subscriptions/:id", subscriptionHandlers.parent.delete);

export default router;
