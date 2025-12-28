import Joi from "joi";

import { VALIDATION_MESSAGES, VehicleType } from "@constants";

export const createDriverProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": VALIDATION_MESSAGES.NAME.FIRST_MIN,
    "string.max": VALIDATION_MESSAGES.NAME.MAX,
    "any.required": VALIDATION_MESSAGES.NAME.REQUIRED,
  }),
  email: Joi.string().email().optional().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
  }),
  photo_url: Joi.string().uri().optional().messages({
    "string.uri": VALIDATION_MESSAGES.PHOTO_URL.INVALID,
  }),
  vehicle_type: Joi.string()
    .valid(...Object.values(VehicleType))
    .required()
    .messages({
      "any.only": VALIDATION_MESSAGES.VEHICLE.TYPE_INVALID,
      "any.required": VALIDATION_MESSAGES.VEHICLE.TYPE_REQUIRED,
    }),
  vehicle_number: Joi.string().min(1).max(20).required().messages({
    "string.empty": VALIDATION_MESSAGES.VEHICLE.NUMBER_REQUIRED,
    "any.required": VALIDATION_MESSAGES.VEHICLE.NUMBER_REQUIRED,
    "string.max": VALIDATION_MESSAGES.VEHICLE.NUMBER_MAX,
  }),
  vehicle_capacity: Joi.number().integer().min(1).max(100).required().messages({
    "number.base": VALIDATION_MESSAGES.VEHICLE.CAPACITY_INVALID,
    "number.integer": VALIDATION_MESSAGES.VEHICLE.CAPACITY_INTEGER,
    "number.min": VALIDATION_MESSAGES.VEHICLE.CAPACITY_MIN,
    "number.max": VALIDATION_MESSAGES.VEHICLE.CAPACITY_MAX,
    "any.required": VALIDATION_MESSAGES.VEHICLE.CAPACITY_REQUIRED,
  }),
  is_available: Joi.boolean().optional(),
});

export const updateDriverProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.NAME.FIRST_MIN,
    "string.max": VALIDATION_MESSAGES.NAME.MAX,
  }),
  email: Joi.string().email().optional().messages({
    "string.email": VALIDATION_MESSAGES.EMAIL.INVALID,
  }),
  photo_url: Joi.string().uri().optional().allow("").messages({
    "string.uri": VALIDATION_MESSAGES.PHOTO_URL.INVALID,
  }),
  vehicle_type: Joi.string()
    .valid(...Object.values(VehicleType))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.VEHICLE.TYPE_INVALID,
    }),
  vehicle_number: Joi.string().min(1).max(20).optional().messages({
    "string.max": VALIDATION_MESSAGES.VEHICLE.NUMBER_MAX,
  }),
  vehicle_capacity: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": VALIDATION_MESSAGES.VEHICLE.CAPACITY_INVALID,
    "number.integer": VALIDATION_MESSAGES.VEHICLE.CAPACITY_INTEGER,
    "number.min": VALIDATION_MESSAGES.VEHICLE.CAPACITY_MIN,
    "number.max": VALIDATION_MESSAGES.VEHICLE.CAPACITY_MAX,
  }),
  is_available: Joi.boolean().optional(),
});

export const upsertDriverAddressSchema = Joi.object({
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

export const createDriverDocumentsSchema = Joi.object({
  driving_license_number: Joi.string().min(1).max(50).required().messages({
    "string.empty":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.DRIVING_LICENSE_NUMBER_REQUIRED,
    "any.required":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.DRIVING_LICENSE_NUMBER_REQUIRED,
    "string.max":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.DRIVING_LICENSE_NUMBER_MAX,
  }),
  driving_license_photo_url: Joi.string().uri().optional().messages({
    "string.uri":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.DRIVING_LICENSE_PHOTO_INVALID,
  }),
  vehicle_license_number: Joi.string().min(1).max(50).required().messages({
    "string.empty":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.VEHICLE_LICENSE_NUMBER_REQUIRED,
    "any.required":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.VEHICLE_LICENSE_NUMBER_REQUIRED,
    "string.max":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.VEHICLE_LICENSE_NUMBER_MAX,
  }),
  vehicle_license_photo_url: Joi.string().uri().optional().messages({
    "string.uri":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.VEHICLE_LICENSE_PHOTO_INVALID,
  }),
  insurance_number: Joi.string().min(1).max(50).optional().messages({
    "string.max": VALIDATION_MESSAGES.DRIVER_DOCUMENTS.INSURANCE_NUMBER_MAX,
  }),
  insurance_photo_url: Joi.string().uri().optional().messages({
    "string.uri": VALIDATION_MESSAGES.DRIVER_DOCUMENTS.INSURANCE_PHOTO_INVALID,
  }),
});

export const updateDriverDocumentsSchema = Joi.object({
  driving_license_number: Joi.string().min(1).max(50).optional().messages({
    "string.max":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.DRIVING_LICENSE_NUMBER_MAX,
  }),
  driving_license_photo_url: Joi.string().uri().optional().allow("").messages({
    "string.uri":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.DRIVING_LICENSE_PHOTO_INVALID,
  }),
  vehicle_license_number: Joi.string().min(1).max(50).optional().messages({
    "string.max":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.VEHICLE_LICENSE_NUMBER_MAX,
  }),
  vehicle_license_photo_url: Joi.string().uri().optional().allow("").messages({
    "string.uri":
      VALIDATION_MESSAGES.DRIVER_DOCUMENTS.VEHICLE_LICENSE_PHOTO_INVALID,
  }),
  insurance_number: Joi.string().min(1).max(50).optional().messages({
    "string.max": VALIDATION_MESSAGES.DRIVER_DOCUMENTS.INSURANCE_NUMBER_MAX,
  }),
  insurance_photo_url: Joi.string().uri().optional().allow("").messages({
    "string.uri": VALIDATION_MESSAGES.DRIVER_DOCUMENTS.INSURANCE_PHOTO_INVALID,
  }),
});
