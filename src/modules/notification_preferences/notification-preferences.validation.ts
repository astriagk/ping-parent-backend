import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

export const updatePreferencesSchema = Joi.object({
  push_enabled: Joi.boolean().required().messages({
    "any.required":
      VALIDATION_MESSAGES.NOTIFICATION_PREFERENCES.PUSH_ENABLED_REQUIRED,
    "boolean.base":
      VALIDATION_MESSAGES.NOTIFICATION_PREFERENCES.PUSH_ENABLED_BASE,
  }),
});
