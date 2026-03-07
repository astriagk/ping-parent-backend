import Joi from "joi";

export const updatePreferencesSchema = Joi.object({
  push_enabled: Joi.boolean().required().messages({
    "any.required": "Push enabled preference is required",
    "boolean.base": "Push enabled must be a boolean",
  }),
});
