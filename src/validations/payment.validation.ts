import Joi from "joi";

import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  VALIDATION_MESSAGES,
} from "@shared/constants";

export const createPaymentSchema = Joi.object({
  // parent_id is NOT included - derived from authenticated user
  payment_type: Joi.string()
    .valid(...Object.values(PaymentType))
    .required()
    .messages({
      "any.required": VALIDATION_MESSAGES.PAYMENT.PAYMENT_TYPE_REQUIRED,
      "any.only": VALIDATION_MESSAGES.PAYMENT.PAYMENT_TYPE_INVALID,
    }),
  amount: Joi.number().positive().required().messages({
    "number.base": VALIDATION_MESSAGES.PAYMENT.AMOUNT_INVALID,
    "number.positive": VALIDATION_MESSAGES.PAYMENT.AMOUNT_MIN,
    "any.required": VALIDATION_MESSAGES.PAYMENT.AMOUNT_REQUIRED,
  }),
  currency: Joi.string().length(3).optional().messages({
    "string.length": VALIDATION_MESSAGES.PAYMENT.CURRENCY_INVALID,
  }),
  payment_method: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .required()
    .messages({
      "any.required": VALIDATION_MESSAGES.PAYMENT.PAYMENT_METHOD_REQUIRED,
      "any.only": VALIDATION_MESSAGES.PAYMENT.PAYMENT_METHOD_INVALID,
    }),
  payment_status: Joi.string()
    .valid(...Object.values(PaymentStatus))
    .required()
    .messages({
      "any.required": VALIDATION_MESSAGES.PAYMENT.PAYMENT_STATUS_REQUIRED,
      "any.only": VALIDATION_MESSAGES.PAYMENT.PAYMENT_STATUS_INVALID,
    }),
  transaction_id: Joi.string().max(100).optional().messages({
    "string.max": VALIDATION_MESSAGES.PAYMENT.TRANSACTION_ID_MAX,
  }),
  gateway_response: Joi.object().optional(),
  subscription_id: Joi.string().optional().messages({
    "string.base": VALIDATION_MESSAGES.PAYMENT.SUBSCRIPTION_ID_INVALID,
  }),
  payment_date: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.PAYMENT.PAYMENT_DATE_INVALID,
  }),
});

export const updatePaymentSchema = Joi.object({
  payment_status: Joi.string()
    .valid(...Object.values(PaymentStatus))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.PAYMENT.PAYMENT_STATUS_INVALID,
    }),
  transaction_id: Joi.string().max(100).optional().messages({
    "string.max": VALIDATION_MESSAGES.PAYMENT.TRANSACTION_ID_MAX,
  }),
  gateway_response: Joi.object().optional(),
});
