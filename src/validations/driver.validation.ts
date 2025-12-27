import Joi from "joi";

import { VALIDATION_MESSAGES } from "@constants";

export const createDriverProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": VALIDATION_MESSAGES.NAME.FIRST_MIN,
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
  }),
  photo_url: Joi.string().uri().optional().messages({
    "string.uri": "Photo URL must be a valid URL",
  }),
  vehicle_type: Joi.string().valid("van", "auto", "bus").required().messages({
    "any.only": "Vehicle type must be van, auto, or bus",
    "any.required": "Vehicle type is required",
  }),
  vehicle_number: Joi.string().min(1).max(20).required().messages({
    "string.empty": "Vehicle number is required",
    "any.required": "Vehicle number is required",
    "string.max": "Vehicle number cannot exceed 20 characters",
  }),
  vehicle_capacity: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": "Vehicle capacity must be a number",
    "number.integer": "Vehicle capacity must be an integer",
    "number.min": "Vehicle capacity must be at least 1",
    "number.max": "Vehicle capacity cannot exceed 100",
    "any.required": "Vehicle capacity is required",
  }),
  is_available: Joi.boolean().optional(),
});

export const updateDriverProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.NAME.FIRST_MIN,
    "string.max": "Name cannot exceed 100 characters",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
  }),
  photo_url: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Photo URL must be a valid URL",
  }),
  vehicle_type: Joi.string().valid("van", "auto", "bus").optional().messages({
    "any.only": "Vehicle type must be van, auto, or bus",
  }),
  vehicle_number: Joi.string().min(1).max(20).optional().messages({
    "string.max": "Vehicle number cannot exceed 20 characters",
  }),
  vehicle_capacity: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Vehicle capacity must be a number",
    "number.integer": "Vehicle capacity must be an integer",
    "number.min": "Vehicle capacity must be at least 1",
    "number.max": "Vehicle capacity cannot exceed 100",
  }),
  is_available: Joi.boolean().optional(),
});

export const upsertDriverAddressSchema = Joi.object({
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

export const createDriverDocumentsSchema = Joi.object({
  driving_license_number: Joi.string().min(1).max(50).required().messages({
    "string.empty": "Driving license number is required",
    "any.required": "Driving license number is required",
    "string.max": "Driving license number cannot exceed 50 characters",
  }),
  driving_license_photo_url: Joi.string().uri().optional().messages({
    "string.uri": "Driving license photo URL must be a valid URL",
  }),
  vehicle_license_number: Joi.string().min(1).max(50).required().messages({
    "string.empty": "Vehicle license number is required",
    "any.required": "Vehicle license number is required",
    "string.max": "Vehicle license number cannot exceed 50 characters",
  }),
  vehicle_license_photo_url: Joi.string().uri().optional().messages({
    "string.uri": "Vehicle license photo URL must be a valid URL",
  }),
  insurance_number: Joi.string().min(1).max(50).optional().messages({
    "string.max": "Insurance number cannot exceed 50 characters",
  }),
  insurance_photo_url: Joi.string().uri().optional().messages({
    "string.uri": "Insurance photo URL must be a valid URL",
  }),
});

export const updateDriverDocumentsSchema = Joi.object({
  driving_license_number: Joi.string().min(1).max(50).optional().messages({
    "string.max": "Driving license number cannot exceed 50 characters",
  }),
  driving_license_photo_url: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Driving license photo URL must be a valid URL",
  }),
  vehicle_license_number: Joi.string().min(1).max(50).optional().messages({
    "string.max": "Vehicle license number cannot exceed 50 characters",
  }),
  vehicle_license_photo_url: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Vehicle license photo URL must be a valid URL",
  }),
  insurance_number: Joi.string().min(1).max(50).optional().messages({
    "string.max": "Insurance number cannot exceed 50 characters",
  }),
  insurance_photo_url: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Insurance photo URL must be a valid URL",
  }),
});
