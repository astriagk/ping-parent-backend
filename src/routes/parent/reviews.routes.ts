import { Router } from "express";

import { reviewHandlers } from "@modules/reviews/rating_review.routes";

const router = Router();

// --- Reviews ---
router.post(
  "/reviews",
  reviewHandlers.parent.validateCreate,
  reviewHandlers.parent.create,
);
router.get("/reviews", reviewHandlers.parent.getMyReviews);
router.get("/reviews/:id", reviewHandlers.parent.getById);
router.put(
  "/reviews/:id",
  reviewHandlers.parent.validateUpdate,
  reviewHandlers.parent.update,
);
router.delete("/reviews/:id", reviewHandlers.parent.delete);

export default router;
