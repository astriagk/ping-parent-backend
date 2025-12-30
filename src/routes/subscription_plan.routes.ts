import { Router } from "express";

import {
  activateSubscriptionPlan,
  deactivateSubscriptionPlan,
  getAllSubscriptionPlans,
  getSubscriptionPlan,
  updateSubscriptionPlan,
} from "@controllers/subscription_plan.controller";
import { validate, verifyAdminToken } from "@middlewares";
import { updateSubscriptionPlanSchema } from "@validations/subscription_plan.validation";

const router = Router();

// Public routes - no authentication required for viewing subscription plans
router.get("/", getAllSubscriptionPlans);
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
