import Joi from "joi";

import { Gender, VALIDATION_MESSAGES } from "@shared/constants";

export const createStudentSchema = Joi.object({
  school_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.SCHOOL_ID_REQUIRED,
  }),
  student_name: Joi.string().min(2).max(100).required().messages({
    "string.min": VALIDATION_MESSAGES.STUDENT.NAME_MIN,
    "string.max": VALIDATION_MESSAGES.STUDENT.NAME_MAX,
    "any.required": VALIDATION_MESSAGES.STUDENT.NAME_REQUIRED,
  }),
  class: Joi.string().max(20).required().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.CLASS_MAX,
    "any.required": VALIDATION_MESSAGES.STUDENT.CLASS_REQUIRED,
  }),
  section: Joi.string().max(10).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.SECTION_MAX,
  }),
  roll_number: Joi.string().max(20).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.ROLL_NUMBER_MAX,
  }),
  photo_url: Joi.string().uri().optional().messages({
    "string.uri": VALIDATION_MESSAGES.STUDENT.PHOTO_URL_INVALID,
  }),
  date_of_birth: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.STUDENT.DATE_OF_BIRTH_INVALID,
  }),
  gender: Joi.string()
    .valid(Gender.MALE, Gender.FEMALE, Gender.OTHER)
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.STUDENT.GENDER_INVALID,
    }),
  pickup_address_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.PICKUP_ADDRESS_ID_REQUIRED,
  }),
  emergency_contact: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base":
        VALIDATION_MESSAGES.STUDENT.EMERGENCY_CONTACT_PATTERN,
    }),
  medical_info: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.MEDICAL_INFO_MAX,
  }),
});

export const updateStudentSchema = Joi.object({
  student_name: Joi.string().min(2).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.STUDENT.NAME_MIN,
    "string.max": VALIDATION_MESSAGES.STUDENT.NAME_MAX,
  }),
  class: Joi.string().max(20).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.CLASS_MAX,
  }),
  section: Joi.string().max(10).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.SECTION_MAX,
  }),
  roll_number: Joi.string().max(20).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.ROLL_NUMBER_MAX,
  }),
  photo_url: Joi.string().uri().optional().messages({
    "string.uri": VALIDATION_MESSAGES.STUDENT.PHOTO_URL_INVALID,
  }),
  date_of_birth: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.STUDENT.DATE_OF_BIRTH_INVALID,
  }),
  gender: Joi.string()
    .valid(Gender.MALE, Gender.FEMALE, Gender.OTHER)
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.STUDENT.GENDER_INVALID,
    }),
  pickup_address_id: Joi.string().optional(),
  emergency_contact: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base":
        VALIDATION_MESSAGES.STUDENT.EMERGENCY_CONTACT_PATTERN,
    }),
  medical_info: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.MEDICAL_INFO_MAX,
  }),
});
