import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

// Schema for marking notification as read
export const markAsReadSchema = Joi.object({
  is_read: Joi.boolean().required().messages({
    "any.required": VALIDATION_MESSAGES.NOTIFICATION.IS_READ_REQUIRED,
    "boolean.base": VALIDATION_MESSAGES.NOTIFICATION.IS_READ_BASE,
  }),
});
