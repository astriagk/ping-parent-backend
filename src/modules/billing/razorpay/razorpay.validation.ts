import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

/**
 * Schema for creating a Razorpay order
 */
export const createRazorpayOrderSchema = Joi.object({
  amount: Joi.number().positive().integer().required().messages({
    "number.base": VALIDATION_MESSAGES.RAZORPAY.AMOUNT_BASE,
    "number.positive": VALIDATION_MESSAGES.RAZORPAY.AMOUNT_POSITIVE,
    "any.required": VALIDATION_MESSAGES.RAZORPAY.AMOUNT_REQUIRED,
  }),
  currency: Joi.string().length(3).default("INR").messages({
    "string.length": VALIDATION_MESSAGES.RAZORPAY.CURRENCY_LENGTH,
  }),
  subscription_id: Joi.string().optional().messages({
    "string.base": VALIDATION_MESSAGES.RAZORPAY.SUBSCRIPTION_ID_BASE,
  }),
  description: Joi.string().max(100).optional().messages({
    "string.max": VALIDATION_MESSAGES.RAZORPAY.DESCRIPTION_MAX,
  }),
});

/**
 * Schema for verifying Razorpay payment
 */
export const verifyRazorpayPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.RAZORPAY.ORDER_ID_REQUIRED,
  }),
  razorpay_payment_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.RAZORPAY.PAYMENT_ID_REQUIRED,
  }),
  razorpay_signature: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.RAZORPAY.SIGNATURE_REQUIRED,
  }),
});

/**
 * Schema for capturing Razorpay payment
 */
export const captureRazorpayPaymentSchema = Joi.object({
  payment_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.RAZORPAY.PAYMENT_ID_REQUIRED,
  }),
  amount: Joi.number().positive().integer().required().messages({
    "number.base": VALIDATION_MESSAGES.RAZORPAY.AMOUNT_BASE,
    "number.positive": VALIDATION_MESSAGES.RAZORPAY.AMOUNT_POSITIVE,
    "any.required": VALIDATION_MESSAGES.RAZORPAY.AMOUNT_REQUIRED,
  }),
});

/**
 * Schema for refunding Razorpay payment
 */
export const refundRazorpayPaymentSchema = Joi.object({
  payment_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.RAZORPAY.PAYMENT_ID_REQUIRED,
  }),
  amount: Joi.number().positive().integer().optional().messages({
    "number.base": VALIDATION_MESSAGES.RAZORPAY.AMOUNT_BASE,
    "number.positive": VALIDATION_MESSAGES.RAZORPAY.AMOUNT_POSITIVE,
  }),
  notes: Joi.object().optional().messages({
    "object.base": "Notes must be an object",
  }),
});

/**
 * Schema for webhook signature verification
 */
export const webhookSignatureSchema = Joi.object({
  razorpay_webhook_id: Joi.string().optional().messages({
    "string.base": "Webhook ID must be a string",
  }),
});
