import { Router } from "express";

import {
  deleteRatingReviewById,
  getDriverRating,
  getDriverRatingReviews,
  getMyRatingReviews,
  getRatingReview,
  submitRatingReview,
  updateRatingReviewById,
} from "@modules/reviews/rating_review.controller";
import {
  createRatingReviewSchema,
  updateRatingReviewSchema,
} from "@modules/reviews/rating_review.validation";
import { validate, verifyParentToken } from "@shared/middlewares";

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
