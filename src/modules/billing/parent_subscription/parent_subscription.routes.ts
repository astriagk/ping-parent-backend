import { validate } from "@shared/middlewares";

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
