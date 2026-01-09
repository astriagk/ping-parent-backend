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

// Schema for verifying QR code or OTP
// Either qr_code OR otp_code must be provided
export const verifyQrOtpSchema = Joi.object({
  qr_code: Joi.string().optional().messages({
    "string.max": VALIDATION_MESSAGES.DAILY_QR_OTP.QR_CODE_MAX,
  }),
  otp_code: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .optional()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.DAILY_QR_OTP.OTP_PATTERN,
    }),
})
  .or("qr_code", "otp_code")
  .messages({
    "object.missing": VALIDATION_MESSAGES.DAILY_QR_OTP.QR_CODE_OR_OTP_REQUIRED,
  });
