import { Router } from "express";

import { validate, verifyAdminToken } from "@shared/middlewares";

import {
  activateSubscriptionPlan,
  createSubscriptionPlan,
  deactivateSubscriptionPlan,
  getAllSubscriptionPlans,
  getSubscriptionPlan,
  updateSubscriptionPlan,
} from "./subscription_plan.controller";
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
} from "./subscription_plan.validation";

const router = Router();

// 01. Get All Subscription Plans (Public)
router.get("/", getAllSubscriptionPlans);

// 02. Create Subscription Plan (Admin)
router.post(
  "/",
  validate(createSubscriptionPlanSchema),
  verifyAdminToken,
  createSubscriptionPlan,
);

// 03. Get Subscription Plan by ID (Public)
router.get("/:id", getSubscriptionPlan);

// 04. Update Subscription Plan (Admin)
router.put(
  "/:id",
  validate(updateSubscriptionPlanSchema),
  verifyAdminToken,
  updateSubscriptionPlan,
);

// 05. Activate Subscription Plan (Admin)
router.patch("/:id/activate", verifyAdminToken, activateSubscriptionPlan);

// 06. Deactivate Subscription Plan (Admin)
router.patch("/:id/deactivate", verifyAdminToken, deactivateSubscriptionPlan);

export default router;
