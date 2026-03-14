import Joi from "joi";

import { UserRole, VALIDATION_MESSAGES } from "@shared/constants";

export const verifyPasswordHashSchema = Joi.object({
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
  password_hash: Joi.string().required().messages({
    "any.required": "Password hash is required",
  }),
});

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": VALIDATION_MESSAGES.ADMIN.EMAIL_INVALID,
    "any.required": VALIDATION_MESSAGES.ADMIN.EMAIL_REQUIRED,
  }),
  password: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.ADMIN.PASSWORD_REQUIRED,
  }),
});

export const createAdminSchema = Joi.object({
  username: Joi.string().min(3).max(100).required().messages({
    "string.min": VALIDATION_MESSAGES.ADMIN.USERNAME_MIN,
    "string.max": VALIDATION_MESSAGES.ADMIN.USERNAME_MAX,
    "any.required": VALIDATION_MESSAGES.ADMIN.USERNAME_REQUIRED,
  }),
  email: Joi.string().email().required().messages({
    "string.email": VALIDATION_MESSAGES.ADMIN.EMAIL_INVALID,
    "any.required": VALIDATION_MESSAGES.ADMIN.EMAIL_REQUIRED,
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .required()
    .messages({
      "string.min": VALIDATION_MESSAGES.ADMIN.PASSWORD_MIN,
      "string.pattern.base": VALIDATION_MESSAGES.ADMIN.PASSWORD_PATTERN,
      "any.required": VALIDATION_MESSAGES.ADMIN.PASSWORD_REQUIRED,
    }),
  phone_number: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.ADMIN.PHONE_PATTERN,
    }),
  admin_role: Joi.string()
    .valid(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
    .required()
    .messages({
      "any.only": VALIDATION_MESSAGES.ADMIN.ADMIN_ROLE_INVALID,
      "any.required": VALIDATION_MESSAGES.ADMIN.ADMIN_ROLE_REQUIRED,
    }),
  school_id: Joi.string().when("admin_role", {
    is: UserRole.SCHOOL_ADMIN,
    then: Joi.required().messages({
      "any.required": "school_id is required when creating a school admin",
    }),
    otherwise: Joi.forbidden().messages({
      "any.unknown": "school_id is only applicable for school_admin role",
    }),
  }),
});

export const updateAdminSchema = Joi.object({
  username: Joi.string().min(3).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.ADMIN.USERNAME_MIN,
    "string.max": VALIDATION_MESSAGES.ADMIN.USERNAME_MAX,
  }),
  email: Joi.string().email().optional().messages({
    "string.email": VALIDATION_MESSAGES.ADMIN.EMAIL_INVALID,
  }),
  phone_number: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.ADMIN.PHONE_PATTERN,
    }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": VALIDATION_MESSAGES.ADMIN.IS_ACTIVE_INVALID,
  }),
});
