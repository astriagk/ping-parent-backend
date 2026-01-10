import Joi from "joi";

import { PlanType, VALIDATION_MESSAGES } from "@shared/constants";

// Update subscription plan schema (admin only)
export const updateSubscriptionPlanSchema = Joi.object({
  plan_name: Joi.string().min(3).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_NAME_MIN,
    "string.max": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_NAME_MAX,
  }),
  plan_type: Joi.string()
    .valid(...Object.values(PlanType))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_TYPE_INVALID,
    }),
  price: Joi.number().min(0).optional().messages({
    "number.base": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICE_INVALID,
    "number.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICE_MIN,
  }),
  features: Joi.object().optional(),
});
