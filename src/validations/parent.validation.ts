import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

export const updateParentProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.NAME.FIRST_MIN,
    "string.max": VALIDATION_MESSAGES.NAME.MAX,
  }),
  email: Joi.string().email().optional().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
  }),
  photo_url: Joi.string().uri().optional().messages({
    "string.uri": VALIDATION_MESSAGES.PHOTO_URL.INVALID,
  }),
});

export const updateAddressSchema = Joi.object({
  address_line1: Joi.string().min(1).max(200).required().messages({
    "string.empty": VALIDATION_MESSAGES.ADDRESS.LINE1_REQUIRED,
    "any.required": VALIDATION_MESSAGES.ADDRESS.LINE1_REQUIRED,
    "string.max": VALIDATION_MESSAGES.ADDRESS.LINE1_MAX,
  }),
  address_line2: Joi.string().max(200).optional().allow("").messages({
    "string.max": VALIDATION_MESSAGES.ADDRESS.LINE2_MAX,
  }),
  city: Joi.string().min(2).max(100).required().messages({
    "string.empty": VALIDATION_MESSAGES.ADDRESS.CITY_REQUIRED,
    "any.required": VALIDATION_MESSAGES.ADDRESS.CITY_REQUIRED,
    "string.max": VALIDATION_MESSAGES.ADDRESS.CITY_MAX,
  }),
  state: Joi.string().min(2).max(100).required().messages({
    "string.empty": VALIDATION_MESSAGES.ADDRESS.STATE_REQUIRED,
    "any.required": VALIDATION_MESSAGES.ADDRESS.STATE_REQUIRED,
    "string.max": VALIDATION_MESSAGES.ADDRESS.STATE_MAX,
  }),
  pincode: Joi.string()
    .pattern(/^[0-9]{5,10}$/)
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.ADDRESS.PINCODE_PATTERN,
    }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.base": VALIDATION_MESSAGES.LATITUDE.INVALID,
    "number.min": VALIDATION_MESSAGES.LATITUDE.RANGE,
    "number.max": VALIDATION_MESSAGES.LATITUDE.RANGE,
    "any.required": VALIDATION_MESSAGES.LATITUDE.REQUIRED,
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.base": VALIDATION_MESSAGES.LONGITUDE.INVALID,
    "number.min": VALIDATION_MESSAGES.LONGITUDE.RANGE,
    "number.max": VALIDATION_MESSAGES.LONGITUDE.RANGE,
    "any.required": VALIDATION_MESSAGES.LONGITUDE.REQUIRED,
  }),
  is_primary: Joi.boolean().optional(),
});
