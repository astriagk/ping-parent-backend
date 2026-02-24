import { validate } from "@shared/middlewares";

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
