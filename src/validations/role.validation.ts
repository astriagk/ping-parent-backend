import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

export const createRoleSchema = Joi.object({
  role_name: Joi.string().min(2).max(50).required().messages({
    "string.min": VALIDATION_MESSAGES.ROLE_MANAGEMENT.ROLE_NAME_MIN,
    "string.max": VALIDATION_MESSAGES.ROLE_MANAGEMENT.ROLE_NAME_MAX,
    "any.required": VALIDATION_MESSAGES.ROLE_MANAGEMENT.ROLE_NAME_REQUIRED,
  }),
  description: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.ROLE_MANAGEMENT.DESCRIPTION_MAX,
  }),
});

export const updateRoleSchema = Joi.object({
  role_name: Joi.string().min(2).max(50).optional().messages({
    "string.min": VALIDATION_MESSAGES.ROLE_MANAGEMENT.ROLE_NAME_MIN,
    "string.max": VALIDATION_MESSAGES.ROLE_MANAGEMENT.ROLE_NAME_MAX,
  }),
  description: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.ROLE_MANAGEMENT.DESCRIPTION_MAX,
  }),
});
