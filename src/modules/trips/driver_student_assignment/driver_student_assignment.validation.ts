import Joi from "joi";

import { AssignmentStatus, VALIDATION_MESSAGES } from "@shared/constants";

export const createDriverStudentAssignmentSchema = Joi.object({
  // driver_id is derived from authenticated user (for drivers)
  // OR accepted from parent request (for parents requesting assignment)
  student_id: Joi.string().required().messages({
    "any.required":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.STUDENT_ID_REQUIRED,
  }),
  driver_id: Joi.string().required().messages({
    "any.required":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_ID_REQUIRED,
  }),
  monthly_fee: Joi.number().min(0).optional().messages({
    "number.base":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.MONTHLY_FEE_INVALID,
    "number.min": VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.MONTHLY_FEE_MIN,
  }),
  assignment_status: Joi.string()
    .valid(...Object.values(AssignmentStatus))
    .optional()
    .messages({
      "any.only":
        VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.ASSIGNMENT_STATUS_INVALID,
    }),
  assigned_date: Joi.date().required().optional().messages({
    "any.required":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.ASSIGNED_DATE_REQUIRED,
    "date.base":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.ASSIGNED_DATE_INVALID,
  }),
  start_date: Joi.date().optional().messages({
    "date.base":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.START_DATE_INVALID,
  }),
  end_date: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.END_DATE_INVALID,
  }),
});

export const updateDriverStudentAssignmentSchema = Joi.object({
  monthly_fee: Joi.number().min(0).optional().messages({
    "number.base":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.MONTHLY_FEE_INVALID,
    "number.min": VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.MONTHLY_FEE_MIN,
  }),
  assignment_status: Joi.string()
    .valid(...Object.values(AssignmentStatus))
    .optional()
    .messages({
      "any.only":
        VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.ASSIGNMENT_STATUS_INVALID,
    }),
  start_date: Joi.date().optional().messages({
    "date.base":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.START_DATE_INVALID,
  }),
  end_date: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.END_DATE_INVALID,
  }),
});

// Schema for parent requesting assignment by driver ID
export const requestAssignmentByDriverIdSchema = Joi.object({
  driver_id: Joi.string().required().messages({
    "any.required":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_ID_REQUIRED,
  }),
  student_id: Joi.string().required().messages({
    "any.required":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.STUDENT_ID_REQUIRED,
  }),
});

// Schema for reassigning a driver to an existing assignment
export const reassignDriverSchema = Joi.object({
  driver_id: Joi.string().required().messages({
    "any.required":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_ID_REQUIRED,
  }),
  monthly_fee: Joi.number().min(0).optional().messages({
    "number.base":
      VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.MONTHLY_FEE_INVALID,
    "number.min": VALIDATION_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.MONTHLY_FEE_MIN,
  }),
});
