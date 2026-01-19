import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

// Schema for marking notification as read
export const markAsReadSchema = Joi.object({
  is_read: Joi.boolean().required().messages({
    "any.required": "is_read field is required",
    "boolean.base": "is_read must be a boolean value",
  }),
});
