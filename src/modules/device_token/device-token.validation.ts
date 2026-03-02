import Joi from "joi";

import { DeviceType } from "@shared/constants/enums";

export const registerTokenSchema = Joi.object({
  fcm_token: Joi.string().required().messages({
    "any.required": "FCM token is required",
    "string.empty": "FCM token cannot be empty",
  }),
  device_type: Joi.string()
    .valid(DeviceType.ANDROID, DeviceType.IOS, DeviceType.WEB)
    .required()
    .messages({
      "any.required": "Device type is required",
      "any.only": "Device type must be android, ios, or web",
    }),
  device_id: Joi.string().required().messages({
    "any.required": "Device ID is required",
    "string.empty": "Device ID cannot be empty",
  }),
});

export const removeTokenSchema = Joi.object({
  fcm_token: Joi.string().required().messages({
    "any.required": "FCM token is required",
    "string.empty": "FCM token cannot be empty",
  }),
});
