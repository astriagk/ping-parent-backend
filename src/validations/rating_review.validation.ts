import Joi from "joi";

import { VALIDATION_MESSAGES } from "@constants";

// NOTE: parent_id is NOT included - it's derived from authenticated user
export const createRatingReviewSchema = Joi.object({
  driver_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.RATING_REVIEW.DRIVER_ID_REQUIRED,
  }),
  trip_id: Joi.string().optional().messages({
    "string.base": VALIDATION_MESSAGES.RATING_REVIEW.TRIP_ID_INVALID,
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "any.required": VALIDATION_MESSAGES.RATING_REVIEW.RATING_REQUIRED,
    "number.base": VALIDATION_MESSAGES.RATING_REVIEW.RATING_INVALID,
    "number.min": VALIDATION_MESSAGES.RATING_REVIEW.RATING_MIN,
    "number.max": VALIDATION_MESSAGES.RATING_REVIEW.RATING_MAX,
    "number.integer": VALIDATION_MESSAGES.RATING_REVIEW.RATING_INTEGER,
  }),
  review_text: Joi.string().max(1000).optional().messages({
    "string.max": VALIDATION_MESSAGES.RATING_REVIEW.REVIEW_TEXT_MAX,
  }),
});

export const updateRatingReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    "number.base": VALIDATION_MESSAGES.RATING_REVIEW.RATING_INVALID,
    "number.min": VALIDATION_MESSAGES.RATING_REVIEW.RATING_MIN,
    "number.max": VALIDATION_MESSAGES.RATING_REVIEW.RATING_MAX,
    "number.integer": VALIDATION_MESSAGES.RATING_REVIEW.RATING_INTEGER,
  }),
  review_text: Joi.string().max(1000).optional().messages({
    "string.max": VALIDATION_MESSAGES.RATING_REVIEW.REVIEW_TEXT_MAX,
  }),
});
