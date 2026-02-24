import { Router } from "express";

import { validate, verifyParentToken } from "@shared/middlewares";

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

const router = Router();

// 01. Submit Rating/Review (Parent)
router.post(
  "/",
  validate(createRatingReviewSchema),
  verifyParentToken,
  submitRatingReview,
);

// 02. Get My Reviews (Parent)
router.get("/my-reviews", verifyParentToken, getMyRatingReviews);

// 03. Get Driver Reviews (Public)
router.get("/driver/:driverId", getDriverRatingReviews);

// 04. Get Driver Rating (Public)
router.get("/driver/:driverId/rating", getDriverRating);

// Additional Parent Routes
// Get Rating Review by ID
router.get("/:id", verifyParentToken, getRatingReview);

// Update Rating Review
router.put(
  "/:id",
  validate(updateRatingReviewSchema),
  verifyParentToken,
  updateRatingReviewById,
);

// Delete Rating Review
router.delete("/:id", verifyParentToken, deleteRatingReviewById);

export default router;

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
