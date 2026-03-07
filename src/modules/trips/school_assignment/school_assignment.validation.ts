import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

export const createSchoolAssignmentSchema = Joi.object({
  driver_id: Joi.string().required().messages({
    "any.required":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_ID_REQUIRED,
  }),
  student_ids: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .required()
    .messages({
      "any.required":
        VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.STUDENT_ID_REQUIRED,
      "array.min":
        VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.STUDENT_ID_REQUIRED,
    }),
  monthly_fee: Joi.number().min(0).optional().messages({
    "number.base":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.MONTHLY_FEE_INVALID,
    "number.min": VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.MONTHLY_FEE_MIN,
  }),
  start_date: Joi.date().optional().messages({
    "date.base":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.START_DATE_INVALID,
  }),
});

export const rejectSchoolAssignmentSchema = Joi.object({
  rejection_reason: Joi.string().max(500).optional().messages({
    "string.max": "Rejection reason cannot exceed 500 characters",
  }),
});
