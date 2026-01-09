import { Router } from "express";

import {
  activateSubscriptionPlan,
  deactivateSubscriptionPlan,
  getAllSubscriptionPlans,
  getSubscriptionPlan,
  updateSubscriptionPlan,
} from "@modules/billing/subscription-plan/subscription_plan.controller";
import { updateSubscriptionPlanSchema } from "@modules/billing/subscription-plan/subscription_plan.validation";
import { validate, verifyAdminToken } from "@shared/middlewares";

const router = Router();

// 01. Get All Subscription Plans (Public)
router.get("/", getAllSubscriptionPlans);

// Additional Routes
// Get Subscription Plan by ID (Public)
router.get("/:id", getSubscriptionPlan);

// Admin routes - require admin authentication
router.put(
  "/:id",
  validate(updateSubscriptionPlanSchema),
  verifyAdminToken,
  updateSubscriptionPlan,
);
router.patch("/:id/activate", verifyAdminToken, activateSubscriptionPlan);
router.patch("/:id/deactivate", verifyAdminToken, deactivateSubscriptionPlan);

export default router;
