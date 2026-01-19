import Joi from "joi";

import { SubscriptionStatus, VALIDATION_MESSAGES } from "@shared/constants";

export const createParentSubscriptionSchema = Joi.object({
  // parent_id is NOT included - derived from authenticated user
  plan_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.PLAN_ID_REQUIRED,
  }),
  start_date: Joi.date().required().messages({
    "date.base": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.START_DATE_INVALID,
    "any.required": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.START_DATE_REQUIRED,
  }),
  end_date: Joi.date().required().messages({
    "date.base": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.END_DATE_INVALID,
    "any.required": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.END_DATE_REQUIRED,
  }),
  auto_renew: Joi.boolean().optional().messages({
    "boolean.base": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.AUTO_RENEW_INVALID,
  }),
});

export const updateParentSubscriptionSchema = Joi.object({
  subscription_status: Joi.string()
    .valid(...Object.values(SubscriptionStatus))
    .optional()
    .messages({
      "any.only":
        VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.SUBSCRIPTION_STATUS_INVALID,
    }),
  auto_renew: Joi.boolean().optional().messages({
    "boolean.base": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.AUTO_RENEW_INVALID,
  }),
  end_date: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.END_DATE_INVALID,
  }),
});
