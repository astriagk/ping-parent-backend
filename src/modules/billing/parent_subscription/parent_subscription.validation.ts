import Joi from "joi";

import { SubscriptionStatus, VALIDATION_MESSAGES } from "@shared/constants";

export const createParentSubscriptionSchema = Joi.object({
  // parent_id is NOT included - derived from authenticated user
  // start_date, end_date are auto-calculated in service
  plan_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.PLAN_ID_REQUIRED,
  }),
  auto_renew: Joi.boolean().optional().messages({
    "boolean.base": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.AUTO_RENEW_INVALID,
  }),
  student_ids: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "student_ids must be an array of student ID strings",
  }),
});

export const upgradeParentSubscriptionSchema = Joi.object({
  plan_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.PARENT_SUBSCRIPTION.PLAN_ID_REQUIRED,
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
