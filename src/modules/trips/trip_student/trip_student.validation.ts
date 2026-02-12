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
    .length(4)
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
    .length(4)
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

/**
 * Schema for bulk stop action - handles multiple students at one stop
 * Used when driver arrives at a stop and needs to process all siblings
 * Works for both PICKUP (morning) and DROP (evening) trips based on trip_type
 */
export const bulkStopActionSchema = Joi.object({
  student_ids: Joi.array().items(Joi.string().required()).default([]).messages({
    "array.base": VALIDATION_MESSAGES.TRIP_STUDENT.STUDENT_IDS_ARRAY,
  }),
  absent_student_ids: Joi.array()
    .items(Joi.string().required())
    .default([])
    .messages({
      "array.base": VALIDATION_MESSAGES.TRIP_STUDENT.ABSENT_STUDENT_IDS_ARRAY,
    }),
  otp_code: Joi.string()
    .length(4)
    .pattern(/^[0-9]+$/)
    .optional()
    .messages({
      "string.length": VALIDATION_MESSAGES.TRIP_STUDENT.OTP_LENGTH,
      "string.pattern.base": VALIDATION_MESSAGES.TRIP_STUDENT.OTP_PATTERN,
    }),
  qr_code: Joi.string().max(100).optional().messages({
    "string.max": VALIDATION_MESSAGES.TRIP_STUDENT.QR_CODE_MAX,
  }),
  latitude: Joi.number().min(-90).max(90).optional().messages({
    "number.base": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LATITUDE_INVALID,
    "number.min": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LATITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LATITUDE_RANGE,
  }),
  longitude: Joi.number().min(-180).max(180).optional().messages({
    "number.base": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LONGITUDE_INVALID,
    "number.min": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LONGITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRIP_STUDENT.PICKUP_LONGITUDE_RANGE,
  }),
})
  .custom((value, helpers) => {
    // At least one student must be specified
    if (
      (!value.student_ids || value.student_ids.length === 0) &&
      (!value.absent_student_ids || value.absent_student_ids.length === 0)
    ) {
      return helpers.error("custom.noStudents");
    }
    // If processing students (pickup/drop), OTP or QR code required
    if (value.student_ids?.length > 0 && !value.otp_code && !value.qr_code) {
      return helpers.error("custom.otpRequired");
    }
    return value;
  })
  .messages({
    "custom.noStudents": VALIDATION_MESSAGES.TRIP_STUDENT.NO_STUDENTS_ERROR,
    "custom.otpRequired": VALIDATION_MESSAGES.TRIP_STUDENT.OTP_OR_QR_REQUIRED,
  });

/**
 * Schema for bulk school action - handles school pickup/drop without OTP
 * - PICKUP trip at school: marks PICKED students as DROPPED (completing trip)
 * - DROP trip at school: marks students as PICKED (collecting from school)
 *   - skipped_student_ids: students not boarding (marked as NO_SHOW)
 * No OTP required since this is at school location
 */
export const bulkSchoolActionSchema = Joi.object({
  student_ids: Joi.array().items(Joi.string().required()).default([]).messages({
    "array.base": VALIDATION_MESSAGES.TRIP_STUDENT.STUDENT_IDS_ARRAY,
  }),
  skipped_student_ids: Joi.array()
    .items(Joi.string().required())
    .optional()
    .default([])
    .messages({
      "array.base": VALIDATION_MESSAGES.TRIP_STUDENT.SKIPPED_STUDENT_IDS_ARRAY,
    }),
  latitude: Joi.number().min(-90).max(90).optional().messages({
    "number.base": VALIDATION_MESSAGES.TRACKING.LATITUDE_NUMBER,
    "number.min": VALIDATION_MESSAGES.TRACKING.LATITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRACKING.LATITUDE_RANGE,
  }),
  longitude: Joi.number().min(-180).max(180).optional().messages({
    "number.base": VALIDATION_MESSAGES.TRACKING.LONGITUDE_NUMBER,
    "number.min": VALIDATION_MESSAGES.TRACKING.LONGITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRACKING.LONGITUDE_RANGE,
  }),
})
  .custom((value, helpers) => {
    // At least one student must be in student_ids or skipped_student_ids
    const totalStudents =
      (value.student_ids?.length || 0) +
      (value.skipped_student_ids?.length || 0);
    if (totalStudents === 0) {
      return helpers.error("custom.noStudents");
    }
    return value;
  })
  .messages({
    "custom.noStudents":
      VALIDATION_MESSAGES.TRIP_STUDENT.NO_STUDENTS_SCHOOL_ERROR,
  });
