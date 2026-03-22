import Joi from "joi";

import { TripType, VALIDATION_MESSAGES } from "@shared/constants";

// Schema for generating QR code and OTP
export const generateQrOtpSchema = Joi.object({
  student_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DAILY_QR_OTP.STUDENT_ID_REQUIRED,
  }),
  trip_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DAILY_QR_OTP.TRIP_ID_REQUIRED,
  }),
  trip_type: Joi.string()
    .valid(...Object.values(TripType))
    .required()
    .messages({
      "any.required": VALIDATION_MESSAGES.DAILY_QR_OTP.TRIP_TYPE_REQUIRED,
      "any.only": VALIDATION_MESSAGES.DAILY_QR_OTP.TRIP_TYPE_INVALID,
    }),
});

// Schema for verifying QR code or OTP (returns list of students)
// Either qr_code OR otp_code must be provided, parent_id required for optimized lookup
export const verifyQrOtpSchema = Joi.object({
  parent_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DAILY_QR_OTP.PARENT_ID_REQUIRED,
  }),
  trip_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DAILY_QR_OTP.TRIP_ID_REQUIRED,
  }),
  qr_code: Joi.string().optional().messages({
    "string.max": VALIDATION_MESSAGES.DAILY_QR_OTP.QR_CODE_MAX,
  }),
  otp_code: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.DAILY_QR_OTP.OTP_PATTERN,
    }),
})
  .or("qr_code", "otp_code")
  .messages({
    "object.missing": VALIDATION_MESSAGES.DAILY_QR_OTP.QR_CODE_OR_OTP_REQUIRED,
  });

// Schema for verifying and recording attendance (marks which students are present/absent)
export const verifyAndRecordAttendanceSchema = Joi.object({
  parent_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DAILY_QR_OTP.PARENT_ID_REQUIRED,
  }),
  trip_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.DAILY_QR_OTP.TRIP_ID_REQUIRED,
  }),
  qr_code: Joi.string().optional().messages({
    "string.max": VALIDATION_MESSAGES.DAILY_QR_OTP.QR_CODE_MAX,
  }),
  otp_code: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.DAILY_QR_OTP.OTP_PATTERN,
    }),
  verified_student_ids: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "verified_student_ids must be an array of student IDs",
  }),
  absent_student_ids: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "absent_student_ids must be an array of student IDs",
  }),
})
  .or("qr_code", "otp_code")
  .messages({
    "object.missing": VALIDATION_MESSAGES.DAILY_QR_OTP.QR_CODE_OR_OTP_REQUIRED,
  });
