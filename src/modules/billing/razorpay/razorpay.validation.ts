import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

/**
 * Schema for creating a Razorpay order
 */
export const createRazorpayOrderSchema = Joi.object({
  amount: Joi.number().positive().integer().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  currency: Joi.string().length(3).default("INR").messages({
    "string.length": "Currency code must be 3 characters",
  }),
  subscription_id: Joi.string().optional().messages({
    "string.base": "Subscription ID must be a string",
  }),
  description: Joi.string().max(100).optional().messages({
    "string.max": "Description must be max 100 characters",
  }),
});

/**
 * Schema for verifying Razorpay payment
 */
export const verifyRazorpayPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required().messages({
    "any.required": "Order ID is required",
  }),
  razorpay_payment_id: Joi.string().required().messages({
    "any.required": "Payment ID is required",
  }),
  razorpay_signature: Joi.string().required().messages({
    "any.required": "Signature is required",
  }),
});

/**
 * Schema for capturing Razorpay payment
 */
export const captureRazorpayPaymentSchema = Joi.object({
  payment_id: Joi.string().required().messages({
    "any.required": "Payment ID is required",
  }),
  amount: Joi.number().positive().integer().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
});

/**
 * Schema for refunding Razorpay payment
 */
export const refundRazorpayPaymentSchema = Joi.object({
  payment_id: Joi.string().required().messages({
    "any.required": "Payment ID is required",
  }),
  amount: Joi.number().positive().integer().optional().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
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
