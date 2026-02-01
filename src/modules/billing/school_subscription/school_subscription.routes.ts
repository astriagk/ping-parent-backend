import { Router } from "express";

import { validate, verifyAdminToken } from "@shared/middlewares";

import {
  cancelSchoolSubscription,
  createSchoolSubscription,
  getActiveSchoolSubscription,
  getExpiredSubscriptions,
  getSchoolSubscriptionById,
  getSchoolSubscriptions,
  renewSchoolSubscription,
  updateSchoolSubscription,
} from "./school_subscription.controller";
import {
  cancelSchoolSubscriptionValidation,
  createSchoolSubscriptionValidation,
  renewSchoolSubscriptionValidation,
  updateSchoolSubscriptionValidation,
} from "./school_subscription.validation";

const router = Router();

// 01: Create new school subscription (admin only)
router.post(
  "/",
  validate(createSchoolSubscriptionValidation),
  verifyAdminToken,
  createSchoolSubscription,
);

// 02: Get all subscriptions for a school
router.get("/school/:schoolId", verifyAdminToken, getSchoolSubscriptions);

// 03: Get active subscription for school
router.get(
  "/school/:schoolId/active",
  verifyAdminToken,
  getActiveSchoolSubscription,
);

// 04: Get subscription by ID
router.get("/:subscriptionId", verifyAdminToken, getSchoolSubscriptionById);

// 05: Update subscription
router.patch(
  "/:subscriptionId",
  validate(updateSchoolSubscriptionValidation),
  verifyAdminToken,
  updateSchoolSubscription,
);

// 06: Renew subscription
router.post(
  "/:subscriptionId/renew",
  validate(renewSchoolSubscriptionValidation),
  verifyAdminToken,
  renewSchoolSubscription,
);

// 07: Cancel subscription
router.post(
  "/:subscriptionId/cancel",
  validate(cancelSchoolSubscriptionValidation),
  verifyAdminToken,
  cancelSchoolSubscription,
);

// 08: Get expired subscriptions
router.get("/expired/list", verifyAdminToken, getExpiredSubscriptions);

export default router;
