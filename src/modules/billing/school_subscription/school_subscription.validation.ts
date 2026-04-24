import Joi from "joi";

import {
  SchoolSubscriptionStatus,
  VALIDATION_MESSAGES,
} from "@shared/constants";

export const createSchoolSubscriptionValidation = Joi.object({
  school_id: Joi.string().required().messages({
    "string.empty": VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.SCHOOL_ID_EMPTY,
  }),
  plan_id: Joi.string().required().messages({
    "string.empty": VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.PLAN_ID_EMPTY,
  }),
  start_date: Joi.date().required().messages({
    "date.base": VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.START_DATE_BASE,
  }),
  end_date: Joi.date().greater(Joi.ref("start_date")).required().messages({
    "date.base": VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.END_DATE_BASE,
    "date.greater": VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.END_DATE_GREATER,
  }),
  auto_renew: Joi.boolean().optional(),
  max_drivers: Joi.number().integer().min(1).optional(),
  max_students: Joi.number().integer().min(1).optional(),
  billing_contact: Joi.string().optional(),
});

export const updateSchoolSubscriptionValidation = Joi.object({
  plan_id: Joi.string().optional(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),
  auto_renew: Joi.boolean().optional(),
  max_drivers: Joi.number().integer().min(1).optional(),
  max_students: Joi.number().integer().min(1).optional(),
  billing_contact: Joi.string().optional(),
  subscription_status: Joi.string()
    .valid(...Object.values(SchoolSubscriptionStatus))
    .optional(),
});

export const renewSchoolSubscriptionValidation = Joi.object({
  newEndDate: Joi.date().greater(new Date()).required().messages({
    "date.base": VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.NEW_END_DATE_BASE,
    "date.greater":
      VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.NEW_END_DATE_GREATER,
  }),
});

export const cancelSchoolSubscriptionValidation = Joi.object({
  subscription_id: Joi.string().required().messages({
    "string.empty":
      VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.SUBSCRIPTION_ID_EMPTY,
  }),
});

export const generateStudentCodesSchema = Joi.object({
  student_ids: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.STUDENT_IDS_MIN,
    "any.required":
      VALIDATION_MESSAGES.SCHOOL_SUBSCRIPTION.STUDENT_IDS_REQUIRED,
  }),
});
