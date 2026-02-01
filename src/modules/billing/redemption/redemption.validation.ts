import Joi from "joi";

export const redeemSubscriptionCodeValidation = Joi.object({
  subscription_code: Joi.string().required().messages({
    "string.empty": "subscription_code is required",
  }),
});

export const cancelSubscriptionValidation = Joi.object({
  subscription_id: Joi.string().required().messages({
    "string.empty": "subscription_id is required",
  }),
});
