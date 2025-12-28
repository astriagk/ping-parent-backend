import Joi from "joi";

import { VALIDATION_MESSAGES } from "@constants";

export const sendOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    )
    .required()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.PHONE.INVALID,
      "any.required": VALIDATION_MESSAGES.PHONE.REQUIRED,
    }),
  role: Joi.string().valid("parent", "driver").optional().messages({
    "any.only": VALIDATION_MESSAGES.ROLE.INVALID,
  }),
});

export const verifyOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    )
    .required()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.PHONE.INVALID,
      "any.required": VALIDATION_MESSAGES.PHONE.REQUIRED,
    }),
  otp: Joi.string().length(6).required().messages({
    "string.length": VALIDATION_MESSAGES.OTP.LENGTH,
    "any.required": VALIDATION_MESSAGES.OTP.REQUIRED,
  }),
  role: Joi.string().valid("parent", "driver").optional().messages({
    "any.only": VALIDATION_MESSAGES.ROLE.INVALID,
  }),
});
