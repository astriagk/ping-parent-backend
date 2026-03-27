import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

export const redeemSubscriptionCodeValidation = Joi.object({
  subscription_code: Joi.string().required().messages({
    "string.empty": VALIDATION_MESSAGES.REDEMPTION.SUBSCRIPTION_CODE_EMPTY,
  }),
});

export const cancelSubscriptionValidation = Joi.object({
  subscription_id: Joi.string().required().messages({
    "string.empty": VALIDATION_MESSAGES.REDEMPTION.SUBSCRIPTION_ID_EMPTY,
  }),
});
