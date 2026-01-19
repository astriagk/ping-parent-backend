import Joi from "joi";

import {
  PlanBadgeType,
  PlanType,
  PricingModel,
  VALIDATION_MESSAGES,
} from "@shared/constants";

// Kids limit schema
const kidsSchema = Joi.object({
  min: Joi.number().integer().min(1).required().messages({
    "number.base": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.KIDS_MIN_INVALID,
    "number.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.KIDS_MIN_INVALID,
    "any.required": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.KIDS_MIN_REQUIRED,
  }),
  max: Joi.number().integer().min(1).required().messages({
    "number.base": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.KIDS_MAX_INVALID,
    "number.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.KIDS_MAX_INVALID,
    "any.required": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.KIDS_MAX_REQUIRED,
  }),
}).custom((value, helpers) => {
  if (value.min > value.max) {
    return helpers.error("custom.kidsMinMax");
  }
  return value;
});

// Feature item schema - { key: string, label: string, enabled: boolean }
const featureItemSchema = Joi.object({
  key: Joi.string().required(),
  label: Joi.string().required(),
  enabled: Joi.boolean().required(),
});

// Features schema - array of feature items
const featuresSchema = Joi.array().items(featureItemSchema).messages({
  "array.base": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.FEATURES_INVALID,
});

// Badge schema - { text: string, type: PlanBadgeType }
const badgeSchema = Joi.object({
  text: Joi.string().required(),
  type: Joi.string()
    .valid(...Object.values(PlanBadgeType))
    .required(),
});

// Create subscription plan schema (admin only)
export const createSubscriptionPlanSchema = Joi.object({
  plan_name: Joi.string().min(3).max(100).required().messages({
    "string.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_NAME_MIN,
    "string.max": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_NAME_MAX,
    "any.required": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_NAME_REQUIRED,
  }),
  plan_type: Joi.string()
    .valid(...Object.values(PlanType))
    .required()
    .messages({
      "any.only": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_TYPE_INVALID,
      "any.required": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_TYPE_REQUIRED,
    }),
  price: Joi.number().min(0).required().messages({
    "number.base": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICE_INVALID,
    "number.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICE_MIN,
    "any.required": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICE_REQUIRED,
  }),
  currency: Joi.string().length(3).uppercase().required().messages({
    "string.length": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.CURRENCY_INVALID,
    "any.required": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.CURRENCY_REQUIRED,
  }),
  kids: kidsSchema.required().messages({
    "any.required": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.KIDS_REQUIRED,
  }),
  pricing_model: Joi.string()
    .valid(...Object.values(PricingModel))
    .required()
    .messages({
      "any.only": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICING_MODEL_INVALID,
      "any.required":
        VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICING_MODEL_REQUIRED,
    }),
  per_kid_price: Joi.when("pricing_model", {
    is: PricingModel.FLAT,
    then: Joi.number().allow(null).optional(),
    otherwise: Joi.number().min(0).required().messages({
      "number.base":
        VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PER_KID_PRICE_INVALID,
      "number.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PER_KID_PRICE_MIN,
      "any.required":
        VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PER_KID_PRICE_REQUIRED_FOR_MODEL,
    }),
  }),
  features: featuresSchema.required().messages({
    "any.required": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.FEATURES_INVALID,
  }),
  badge: badgeSchema.allow(null).optional(),
  priority: Joi.number().integer().min(0).default(0),
  is_active: Joi.boolean().optional(),
});

// Update subscription plan schema (admin only)
export const updateSubscriptionPlanSchema = Joi.object({
  plan_name: Joi.string().min(3).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_NAME_MIN,
    "string.max": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_NAME_MAX,
  }),
  plan_type: Joi.string()
    .valid(...Object.values(PlanType))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PLAN_TYPE_INVALID,
    }),
  price: Joi.number().min(0).optional().messages({
    "number.base": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICE_INVALID,
    "number.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICE_MIN,
  }),
  currency: Joi.string().length(3).uppercase().optional().messages({
    "string.length": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.CURRENCY_INVALID,
  }),
  kids: kidsSchema.optional(),
  pricing_model: Joi.string()
    .valid(...Object.values(PricingModel))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PRICING_MODEL_INVALID,
    }),
  per_kid_price: Joi.number().min(0).allow(null).optional().messages({
    "number.base": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PER_KID_PRICE_INVALID,
    "number.min": VALIDATION_MESSAGES.SUBSCRIPTION_PLAN.PER_KID_PRICE_MIN,
  }),
  features: featuresSchema.optional(),
  badge: badgeSchema.allow(null).optional(),
  priority: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
});
