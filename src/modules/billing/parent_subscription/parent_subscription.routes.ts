import { Router } from "express";

import {
  validate,
  verifyAdminToken,
  verifyParentToken,
} from "@shared/middlewares";

import {
  cancelSubscriptionById,
  createSubscription,
  deleteSubscriptionById,
  getAllParentSubscriptionsController,
  getMyActiveSubscription,
  getMySubscriptionDetailsController,
  getMySubscriptions,
  getRecommendations,
  getSubscriptionById,
  updateSubscriptionById,
  upgradeSubscription,
} from "./parent_subscription.controller";
import {
  createParentSubscriptionSchema,
  updateParentSubscriptionSchema,
  upgradeParentSubscriptionSchema,
} from "./parent_subscription.validation";

const router = Router();

// All routes require parent authentication
router.use(verifyParentToken);

// 01. Get subscription recommendations (smart plan suggestions)
router.get("/recommendations", getRecommendations);

// 02. Subscribe to Plan (Parent) — auto-includes all active kids
router.post("/", validate(createParentSubscriptionSchema), createSubscription);

// 03. Get My Subscriptions (with plan + student names populated)
router.get("/my-subscriptions", getMySubscriptions);

// 04. Get Active Subscription (with plan + student names populated)
router.get("/my-active-subscription", getMyActiveSubscription);

// 05. Get Active Subscription Full Details (with schools, drivers, payments)
router.get("/my-subscription-details", getMySubscriptionDetailsController);

// 06. Upgrade existing subscription to a new plan
router.post(
  "/upgrade",
  validate(upgradeParentSubscriptionSchema),
  upgradeSubscription,
);

// Additional Routes
// Get Subscription by ID
router.get("/:id", getSubscriptionById);

// Update Subscription
router.put(
  "/:id",
  validate(updateParentSubscriptionSchema),
  updateSubscriptionById,
);

// Cancel Subscription (resets parent flags)
router.post("/:id/cancel", cancelSubscriptionById);

// Delete Subscription
router.delete("/:id", deleteSubscriptionById);

// Admin routes
router.get(
  "/admin/all-subscriptions",
  verifyAdminToken,
  getAllParentSubscriptionsController,
);

export default router;

/**
 * Handler group for parent_subscription module.
 * Import in src/routes/parent.routes.ts, admin.routes.ts — NO auth middleware here.
 */
export const subscriptionHandlers = {
  // Parent-specific
  parent: {
    getRecommendations: getRecommendations,
    validateCreate: validate(createParentSubscriptionSchema),
    create: createSubscription,
    getMySubscriptions: getMySubscriptions,
    getMyActive: getMyActiveSubscription,
    getMyDetails: getMySubscriptionDetailsController,
    validateUpgrade: validate(upgradeParentSubscriptionSchema),
    upgrade: upgradeSubscription,
    getById: getSubscriptionById,
    validateUpdate: validate(updateParentSubscriptionSchema),
    update: updateSubscriptionById,
    cancel: cancelSubscriptionById,
    delete: deleteSubscriptionById,
  },

  // Admin-specific
  admin: {
    getAll: getAllParentSubscriptionsController,
  },
};
