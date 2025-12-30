import { Router } from "express";

import {
  deleteRatingReviewById,
  getDriverRating,
  getDriverRatingReviews,
  getMyRatingReviews,
  getRatingReview,
  submitRatingReview,
  updateRatingReviewById,
} from "@controllers/rating_review.controller";
import { validate, verifyParentToken } from "@middlewares";
import {
  createRatingReviewSchema,
  updateRatingReviewSchema,
} from "@validations/rating_review.validation";

const router = Router();

// Parent routes - require parent authentication
router.post(
  "/",
  validate(createRatingReviewSchema),
  verifyParentToken,
  submitRatingReview,
);
router.get("/my-reviews", verifyParentToken, getMyRatingReviews);
router.get("/:id", verifyParentToken, getRatingReview);
router.put(
  "/:id",
  validate(updateRatingReviewSchema),
  verifyParentToken,
  updateRatingReviewById,
);
router.delete("/:id", verifyParentToken, deleteRatingReviewById);

// Public routes - get driver ratings/reviews
router.get("/driver/:driverId", getDriverRatingReviews);
router.get("/driver/:driverId/rating", getDriverRating);

export default router;
