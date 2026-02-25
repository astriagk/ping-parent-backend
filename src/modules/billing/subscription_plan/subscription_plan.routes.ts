import { validate } from "@shared/middlewares";

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

/**
 * Handler group for subscription_plan module.
 * Import in src/routes/public.routes.ts, admin.routes.ts — NO auth middleware here.
 */
export const subscriptionPlanHandlers = {
  // Public (no auth)
  public: {
    getAll: getAllSubscriptionPlans,
    getById: getSubscriptionPlan,
  },

  // Admin-specific
  admin: {
    validateCreate: validate(createSubscriptionPlanSchema),
    create: createSubscriptionPlan,
    validateUpdate: validate(updateSubscriptionPlanSchema),
    update: updateSubscriptionPlan,
    activate: activateSubscriptionPlan,
    deactivate: deactivateSubscriptionPlan,
  },
};
