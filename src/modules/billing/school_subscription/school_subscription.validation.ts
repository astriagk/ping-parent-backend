import Joi from "joi";

export const createSchoolSubscriptionValidation = Joi.object({
  school_id: Joi.string().required().messages({
    "string.empty": "school_id is required",
  }),
  plan_id: Joi.string().required().messages({
    "string.empty": "plan_id is required",
  }),
  start_date: Joi.date().required().messages({
    "date.base": "start_date must be a valid date",
  }),
  end_date: Joi.date().greater(Joi.ref("start_date")).required().messages({
    "date.base": "end_date must be a valid date",
    "date.greater": "end_date must be greater than start_date",
  }),
  auto_renew: Joi.boolean().optional(),
  max_drivers: Joi.number().integer().min(1).optional(),
  max_students: Joi.number().integer().min(1).optional(),
  billing_contact: Joi.string().optional(),
});

export const updateSchoolSubscriptionValidation = Joi.object({
  plan_id: Joi.string().optional(),
  end_date: Joi.date().optional(),
  auto_renew: Joi.boolean().optional(),
  max_drivers: Joi.number().integer().min(1).optional(),
  max_students: Joi.number().integer().min(1).optional(),
  billing_contact: Joi.string().optional(),
  subscription_status: Joi.string()
    .valid("active", "expired", "cancelled", "pending")
    .optional(),
});

export const renewSchoolSubscriptionValidation = Joi.object({
  newEndDate: Joi.date().greater(new Date()).required().messages({
    "date.base": "newEndDate must be a valid date",
    "date.greater": "newEndDate must be in the future",
  }),
});

export const cancelSchoolSubscriptionValidation = Joi.object({
  subscription_id: Joi.string().required().messages({
    "string.empty": "subscription_id is required",
  }),
});

export const generateStudentCodesSchema = Joi.object({
  student_ids: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "At least one student_id is required",
    "any.required": "student_ids is required",
  }),
});
