import Joi from "joi";

import { VALIDATION_MESSAGES } from "@constants";

export const updateParentProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.NAME.FIRST_MIN,
    "string.max": "Name cannot exceed 100 characters",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
  }),
  photo_url: Joi.string().uri().optional().messages({
    "string.uri": "Photo URL must be a valid URL",
  }),
});

export const updateAddressSchema = Joi.object({
  address_line1: Joi.string().min(1).max(200).required().messages({
    "string.empty": "Address line 1 is required",
    "any.required": "Address line 1 is required",
    "string.max": "Address line 1 cannot exceed 200 characters",
  }),
  address_line2: Joi.string().max(200).optional().allow("").messages({
    "string.max": "Address line 2 cannot exceed 200 characters",
  }),
  city: Joi.string().min(2).max(100).required().messages({
    "string.empty": "City is required",
    "any.required": "City is required",
    "string.max": "City cannot exceed 100 characters",
  }),
  state: Joi.string().min(2).max(100).required().messages({
    "string.empty": "State is required",
    "any.required": "State is required",
    "string.max": "State cannot exceed 100 characters",
  }),
  pincode: Joi.string()
    .pattern(/^[0-9]{5,10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Pincode must be 5-10 digits",
    }),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.base": "Latitude must be a valid number",
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
    "any.required": "Latitude is required",
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.base": "Longitude must be a valid number",
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
    "any.required": "Longitude is required",
  }),
  is_primary: Joi.boolean().optional(),
});
