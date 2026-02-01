import Joi from "joi";

export const registerSchoolAdminValidation = Joi.object({
  school_id: Joi.string().required().messages({
    "string.empty": "school_id is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.empty": "password is required",
  }),
  phone_number: Joi.string().optional(),
  name: Joi.string().required().messages({
    "string.empty": "name is required",
  }),
});

export const loginSchoolAdminValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "password is required",
  }),
});

export const updateSchoolAdminValidation = Joi.object({
  email: Joi.string().email().optional(),
  phone_number: Joi.string().optional(),
  name: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
});

export const changePasswordValidation = Joi.object({
  current_password: Joi.string().required().messages({
    "string.empty": "current_password is required",
  }),
  new_password: Joi.string().min(6).required().messages({
    "string.min": "New password must be at least 6 characters",
    "string.empty": "new_password is required",
  }),
});
