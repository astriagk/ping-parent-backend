import { Router } from "express";

import { reviewHandlers } from "@modules/reviews/rating_review.routes";

const router = Router();

// --- Reviews (public read) ---
router.get("/reviews/driver/:driverId", reviewHandlers.public.getDriverReviews);
router.get(
  "/reviews/driver/:driverId/rating",
  reviewHandlers.public.getDriverRating,
);

export default router;
