import { validate } from "@shared/middlewares";

import {
  deleteRatingReviewById,
  getDriverRating,
  getDriverRatingReviews,
  getMyRatingReviews,
  getRatingReview,
  submitRatingReview,
  updateRatingReviewById,
} from "./rating_review.controller";
import {
  createRatingReviewSchema,
  updateRatingReviewSchema,
} from "./rating_review.validation";

/**
 * Handler group for rating_review module.
 * Import in src/routes/parent.routes.ts, public.routes.ts — NO auth middleware here.
 */
export const reviewHandlers = {
  // Parent-specific
  parent: {
    validateCreate: validate(createRatingReviewSchema),
    create: submitRatingReview,
    getMyReviews: getMyRatingReviews,
    getById: getRatingReview,
    validateUpdate: validate(updateRatingReviewSchema),
    update: updateRatingReviewById,
    delete: deleteRatingReviewById,
  },

  // Public (no auth)
  public: {
    getDriverReviews: getDriverRatingReviews,
    getDriverRating: getDriverRating,
  },
};
