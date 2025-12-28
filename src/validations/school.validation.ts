import Joi from "joi";

import { VALIDATION_MESSAGES } from "@constants";

export const createSchoolSchema = Joi.object({
  school_name: Joi.string().min(3).max(200).required().messages({
    "string.min": VALIDATION_MESSAGES.SCHOOL.NAME_MIN,
    "string.max": VALIDATION_MESSAGES.SCHOOL.NAME_MAX,
    "any.required": VALIDATION_MESSAGES.SCHOOL.NAME_REQUIRED,
  }),
  address: Joi.string().max(255).required().messages({
    "string.max": VALIDATION_MESSAGES.SCHOOL.ADDRESS_MAX,
    "any.required": VALIDATION_MESSAGES.SCHOOL.ADDRESS_REQUIRED,
  }),
  city: Joi.string().max(100).required().messages({
    "string.max": VALIDATION_MESSAGES.SCHOOL.CITY_MAX,
    "any.required": VALIDATION_MESSAGES.SCHOOL.CITY_REQUIRED,
  }),
  state: Joi.string().max(100).required().messages({
    "string.max": VALIDATION_MESSAGES.SCHOOL.STATE_MAX,
    "any.required": VALIDATION_MESSAGES.SCHOOL.STATE_REQUIRED,
  }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.min": VALIDATION_MESSAGES.LATITUDE.RANGE,
    "number.max": VALIDATION_MESSAGES.LATITUDE.RANGE,
    "any.required": VALIDATION_MESSAGES.LATITUDE.REQUIRED,
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.min": VALIDATION_MESSAGES.LONGITUDE.RANGE,
    "number.max": VALIDATION_MESSAGES.LONGITUDE.RANGE,
    "any.required": VALIDATION_MESSAGES.LONGITUDE.REQUIRED,
  }),
  contact_number: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.SCHOOL.CONTACT_NUMBER_PATTERN,
    }),
  email: Joi.string().email().lowercase().optional().messages({
    "string.email": VALIDATION_MESSAGES.SCHOOL.EMAIL_INVALID,
  }),
});

export const updateSchoolSchema = Joi.object({
  school_name: Joi.string().min(3).max(200).optional().messages({
    "string.min": VALIDATION_MESSAGES.SCHOOL.NAME_MIN,
    "string.max": VALIDATION_MESSAGES.SCHOOL.NAME_MAX,
  }),
  address: Joi.string().max(255).optional().messages({
    "string.max": VALIDATION_MESSAGES.SCHOOL.ADDRESS_MAX,
  }),
  city: Joi.string().max(100).optional().messages({
    "string.max": VALIDATION_MESSAGES.SCHOOL.CITY_MAX,
  }),
  state: Joi.string().max(100).optional().messages({
    "string.max": VALIDATION_MESSAGES.SCHOOL.STATE_MAX,
  }),
  latitude: Joi.number().min(-90).max(90).optional().messages({
    "number.min": VALIDATION_MESSAGES.LATITUDE.RANGE,
    "number.max": VALIDATION_MESSAGES.LATITUDE.RANGE,
  }),
  longitude: Joi.number().min(-180).max(180).optional().messages({
    "number.min": VALIDATION_MESSAGES.LONGITUDE.RANGE,
    "number.max": VALIDATION_MESSAGES.LONGITUDE.RANGE,
  }),
  contact_number: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.SCHOOL.CONTACT_NUMBER_PATTERN,
    }),
  email: Joi.string().email().lowercase().optional().messages({
    "string.email": VALIDATION_MESSAGES.SCHOOL.EMAIL_INVALID,
  }),
});
