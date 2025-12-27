import Joi from "joi";

import { VALIDATION_MESSAGES } from "@constants";

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
    "any.required": VALIDATION_MESSAGES.EMAIL.REQUIRED,
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.min": VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH,
      "string.pattern.base": VALIDATION_MESSAGES.PASSWORD.PATTERN,
      "any.required": VALIDATION_MESSAGES.PASSWORD.REQUIRED,
    }),
  role: Joi.string().valid("parent", "driver").required().messages({
    "any.only": VALIDATION_MESSAGES.ROLE.INVALID,
    "any.required": VALIDATION_MESSAGES.ROLE.REQUIRED,
  }),
  phoneNumber: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
    "any.required": VALIDATION_MESSAGES.EMAIL.REQUIRED,
  }),
  password: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.PASSWORD.REQUIRED,
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
    "any.required": VALIDATION_MESSAGES.EMAIL.REQUIRED,
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.TOKEN.RESET_REQUIRED,
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.min": VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH,
      "string.pattern.base": VALIDATION_MESSAGES.PASSWORD.PATTERN,
      "any.required": VALIDATION_MESSAGES.PASSWORD.NEW_REQUIRED,
    }),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.TOKEN.VERIFICATION_REQUIRED,
  }),
});

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
