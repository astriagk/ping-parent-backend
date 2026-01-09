import { Router } from "express";

import {
  cancelSubscriptionById,
  createSubscription,
  deleteSubscriptionById,
  getAllParentSubscriptionsController,
  getMyActiveSubscription,
  getMySubscriptions,
  getSubscriptionById,
  updateSubscriptionById,
} from "@controllers/parent_subscription.controller";
import {
  validate,
  verifyAdminToken,
  verifyParentToken,
} from "@shared/middlewares";
import {
  createParentSubscriptionSchema,
  updateParentSubscriptionSchema,
} from "@validations/parent_subscription.validation";

const router = Router();

// All routes require parent authentication
router.use(verifyParentToken);

// 01. Subscribe to Plan (Parent)
router.post("/", validate(createParentSubscriptionSchema), createSubscription);

// 02. Get My Subscriptions
router.get("/my-subscriptions", getMySubscriptions);

// 03. Get Active Subscription
router.get("/my-active-subscription", getMyActiveSubscription);

// Additional Routes
// Get Subscription by ID
router.get("/:id", getSubscriptionById);

// Update Subscription
router.put(
  "/:id",
  validate(updateParentSubscriptionSchema),
  updateSubscriptionById,
);

// Cancel Subscription
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
