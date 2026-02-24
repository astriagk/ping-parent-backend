import { Router } from "express";

import { validate, verifyParentToken } from "@shared/middlewares";

import {
  cancelSubscription,
  checkStatus,
  getActiveSubscription,
  getAvailableCodes,
  getDetails,
  getParentSubscriptions,
  redeemCode,
} from "./redemption.controller";
import {
  cancelSubscriptionValidation,
  redeemSubscriptionCodeValidation,
} from "./redemption.validation";

const router = Router();

// 01: Redeem subscription code (parent)
router.post(
  "/redeem",
  validate(redeemSubscriptionCodeValidation),
  verifyParentToken,
  redeemCode,
);

// 02: Get active subscription (parent)
router.get("/active", verifyParentToken, getActiveSubscription);

// 03: Get all parent subscriptions (parent)
router.get("/", verifyParentToken, getParentSubscriptions);

// 04: Get subscription details (parent)
router.get("/:subscriptionId", verifyParentToken, getDetails);

// 05: Cancel subscription (parent)
router.post(
  "/cancel",
  validate(cancelSubscriptionValidation),
  verifyParentToken,
  cancelSubscription,
);

// 06: Check subscription status (parent)
router.get("/status/check", verifyParentToken, checkStatus);

// 07: Get available redemption codes
router.get("/available/codes", getAvailableCodes);

export default router;

/**
 * Handler group for redemption module.
 * Import in src/routes/parent.routes.ts, public.routes.ts — NO auth middleware here.
 */
export const redemptionHandlers = {
  // Parent-specific
  parent: {
    validateRedeem: validate(redeemSubscriptionCodeValidation),
    redeem: redeemCode,
    getActive: getActiveSubscription,
    getAll: getParentSubscriptions,
    getById: getDetails,
    validateCancel: validate(cancelSubscriptionValidation),
    cancel: cancelSubscription,
    checkStatus: checkStatus,
  },

  // Public (no auth)
  public: {
    getAvailableCodes: getAvailableCodes,
  },
};
