import { Router } from "express";

import { subscriptionHandlers } from "@modules/billing/parent_subscription/parent_subscription.routes";

const router = Router();

router.post(
  "/parent-subscriptions",
  subscriptionHandlers.admin.validateCreate,
  subscriptionHandlers.admin.create,
);
router.patch(
  "/parent-subscriptions/:id/cancel",
  subscriptionHandlers.admin.cancel,
);

export default router;
