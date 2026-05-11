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

const adminAddressShape = {
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
    "any.required": VALIDATION_MESSAGES.LATITUDE.REQUIRED,
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.base": VALIDATION_MESSAGES.LONGITUDE.INVALID,
    "any.required": VALIDATION_MESSAGES.LONGITUDE.REQUIRED,
  }),
};

export const adminCreateParentSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.PHONE.INVALID,
      "any.required": VALIDATION_MESSAGES.PHONE.REQUIRED,
    }),
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
  address: Joi.object(adminAddressShape).optional(),
});

export const adminUpdateParentSchema = Joi.object({
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
}).min(1);

export const adminUpsertParentAddressSchema = Joi.object(adminAddressShape);

export const adminBulkCreateParentsSchema = Joi.object({
  parents: Joi.array()
    .items(
      Joi.object({
        phone_number: Joi.string()
          .pattern(/^\+?[0-9]{10,15}$/)
          .required(),
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().optional(),
        photo_url: Joi.string().uri().optional(),
        address: Joi.object(adminAddressShape).optional(),
      }),
    )
    .min(1)
    .max(100)
    .required(),
});

export const adminBulkParentsWithStudentsSchema = Joi.object({
  records: Joi.array()
    .items(
      Joi.object({
        parent: Joi.object({
          phone_number: Joi.string()
            .pattern(/^\+?[0-9]{10,15}$/)
            .required(),
          name: Joi.string().min(2).max(100).required(),
          email: Joi.string().email().optional(),
          photo_url: Joi.string().uri().optional(),
          address: Joi.object(adminAddressShape).optional(),
        }).required(),
        students: Joi.array()
          .items(
            Joi.object({
              school_id: Joi.string().required(),
              student_name: Joi.string().min(2).max(100).required(),
              class: Joi.string().max(20).required(),
              section: Joi.string().max(10).optional(),
              roll_number: Joi.string().max(20).optional(),
              gender: Joi.string().valid("male", "female", "other").optional(),
              date_of_birth: Joi.date().optional(),
              pickup_address_id: Joi.string().allow(null).optional(),
              emergency_contact: Joi.string()
                .pattern(/^[+]?[0-9]{10,15}$/)
                .optional(),
              medical_info: Joi.string().max(500).optional(),
            }),
          )
          .min(0)
          .required(),
      }),
    )
    .min(1)
    .max(50)
    .required(),
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
