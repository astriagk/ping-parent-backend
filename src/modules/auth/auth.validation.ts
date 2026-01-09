import Joi from "joi";

import { UserRole, VALIDATION_MESSAGES } from "@shared/constants";

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
  role: Joi.string()
    .valid(UserRole.PARENT, UserRole.DRIVER)
    .optional()
    .messages({
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
  role: Joi.string()
    .valid(UserRole.PARENT, UserRole.DRIVER)
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.ROLE.INVALID,
    }),
});

// Admin user management validation
export const updateUserSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    )
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.PHONE.INVALID,
    }),
  user_type: Joi.string()
    .valid(UserRole.PARENT, UserRole.DRIVER)
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.ROLE.INVALID,
    }),
  is_active: Joi.boolean().optional(),
  fcm_token: Joi.string().optional(),
});
