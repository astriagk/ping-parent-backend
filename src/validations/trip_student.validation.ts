import Joi from "joi";

import { AttendanceStatus, PickupStatus } from "@shared/constants";
import { VALIDATION_MESSAGES } from "@shared/constants";

/**
 * Schema for marking attendance (driver marks student present/absent)
 * NOTE: sequence_order and estimated_arrival_time are excluded - these are system-calculated
 */
export const markAttendanceSchema = Joi.object({
  attendance_status: Joi.string()
    .valid(...Object.values(AttendanceStatus))
    .required()
    .messages({
      "any.only": VALIDATION_MESSAGES.TRIP_STUDENT.ATTENDANCE_STATUS_INVALID,
      "any.required":
        VALIDATION_MESSAGES.TRIP_STUDENT.ATTENDANCE_STATUS_INVALID,
    }),
  notes: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.TRIP_STUDENT.NOTES_MAX,
  }),
});

/**
 * Schema for recording pickup (driver picks up student)
 */
export const recordPickupSchema = Joi.object({
  pickup_latitude: Joi.number().min(-90).max(90).optional().messages({
    "number.base": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LATITUDE_INVALID,
    "number.min": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LATITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LATITUDE_RANGE,
  }),
  pickup_longitude: Joi.number().min(-180).max(180).optional().messages({
    "number.base": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LONGITUDE_INVALID,
    "number.min": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LONGITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LONGITUDE_RANGE,
  }),
  pickup_qr_code: Joi.string().max(100).optional().messages({
    "string.max": VALIDATION_MESSAGES.TRIP_STUDENT.QR_CODE_MAX,
  }),
  pickup_otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .optional()
    .messages({
      "string.length": VALIDATION_MESSAGES.TRIP_STUDENT.OTP_LENGTH,
      "string.pattern.base": VALIDATION_MESSAGES.TRIP_STUDENT.OTP_PATTERN,
    }),
  notes: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.TRIP_STUDENT.NOTES_MAX,
  }),
});

/**
 * Schema for recording drop (driver drops off student)
 */
export const recordDropSchema = Joi.object({
  drop_latitude: Joi.number().min(-90).max(90).optional().messages({
    "number.base": VALIDATION_MESSAGES.TRIP_STUDENT.DROP_LATITUDE_INVALID,
    "number.min": VALIDATION_MESSAGES.TRIP_STUDENT.DROP_LATITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRIP_STUDENT.DROP_LATITUDE_RANGE,
  }),
  drop_longitude: Joi.number().min(-180).max(180).optional().messages({
    "number.base": VALIDATION_MESSAGES.TRIP_STUDENT.DROP_LONGITUDE_INVALID,
    "number.min": VALIDATION_MESSAGES.TRIP_STUDENT.DROP_LONGITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRIP_STUDENT.DROP_LONGITUDE_RANGE,
  }),
  drop_qr_code: Joi.string().max(100).optional().messages({
    "string.max": VALIDATION_MESSAGES.TRIP_STUDENT.QR_CODE_MAX,
  }),
  drop_otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .optional()
    .messages({
      "string.length": VALIDATION_MESSAGES.TRIP_STUDENT.OTP_LENGTH,
      "string.pattern.base": VALIDATION_MESSAGES.TRIP_STUDENT.OTP_PATTERN,
    }),
  notes: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.TRIP_STUDENT.NOTES_MAX,
  }),
});

/**
 * Schema for updating trip student record (general update)
 */
export const updateTripStudentSchema = Joi.object({
  attendance_status: Joi.string()
    .valid(...Object.values(AttendanceStatus))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.TRIP_STUDENT.ATTENDANCE_STATUS_INVALID,
    }),
  pickup_status: Joi.string()
    .valid(...Object.values(PickupStatus))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_STATUS_INVALID,
    }),
  notes: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.TRIP_STUDENT.NOTES_MAX,
  }),
});
