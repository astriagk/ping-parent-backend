import Joi from "joi";

import { DeviceType, VALIDATION_MESSAGES } from "@shared/constants";

export const registerTokenSchema = Joi.object({
  fcm_token: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DEVICE_TOKEN.FCM_TOKEN_REQUIRED,
    "string.empty": VALIDATION_MESSAGES.DEVICE_TOKEN.FCM_TOKEN_EMPTY,
  }),
  device_type: Joi.string()
    .valid(DeviceType.ANDROID, DeviceType.IOS, DeviceType.WEB)
    .required()
    .messages({
      "any.required": VALIDATION_MESSAGES.DEVICE_TOKEN.DEVICE_TYPE_REQUIRED,
      "any.only": VALIDATION_MESSAGES.DEVICE_TOKEN.DEVICE_TYPE_INVALID,
    }),
  device_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DEVICE_TOKEN.DEVICE_ID_REQUIRED,
    "string.empty": VALIDATION_MESSAGES.DEVICE_TOKEN.DEVICE_ID_EMPTY,
  }),
});

export const removeTokenSchema = Joi.object({
  fcm_token: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DEVICE_TOKEN.FCM_TOKEN_REQUIRED,
    "string.empty": VALIDATION_MESSAGES.DEVICE_TOKEN.FCM_TOKEN_EMPTY,
  }),
});
