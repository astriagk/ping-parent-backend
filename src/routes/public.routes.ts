import { Router } from "express";

import { razorpayHandlers } from "@modules/billing/razorpay/razorpay.routes";
import { redemptionHandlers } from "@modules/billing/redemption/redemption.routes";
import { subscriptionPlanHandlers } from "@modules/billing/subscription_plan/subscription_plan.routes";
import { reviewHandlers } from "@modules/reviews/rating_review.routes";

const router = Router();

/**
 * PUBLIC GATEWAY — No auth required
 * Subscription plan listing, Razorpay config/webhooks, driver reviews, available codes
 */

// --- Subscription Plans ---
router.get("/subscription-plans", subscriptionPlanHandlers.public.getAll);
router.get("/subscription-plans/:id", subscriptionPlanHandlers.public.getById);

// --- Razorpay ---
router.get("/razorpay/config", razorpayHandlers.public.getConfig);
router.post(
  "/razorpay/orders",
  razorpayHandlers.public.validateCreateOrder,
  razorpayHandlers.public.createOrder,
);
router.post(
  "/razorpay/verify",
  razorpayHandlers.public.validateVerify,
  razorpayHandlers.public.verify,
);
router.post(
  "/razorpay/capture",
  razorpayHandlers.public.validateCapture,
  razorpayHandlers.public.capture,
);
router.post(
  "/razorpay/refunds",
  razorpayHandlers.public.validateRefund,
  razorpayHandlers.public.refund,
);
router.get("/razorpay/orders/:orderId", razorpayHandlers.public.getOrder);
router.get("/razorpay/payments/:paymentId", razorpayHandlers.public.getPayment);

// --- Reviews (public read) ---
router.get("/reviews/driver/:driverId", reviewHandlers.public.getDriverReviews);
router.get(
  "/reviews/driver/:driverId/rating",
  reviewHandlers.public.getDriverRating,
);

// --- Redemption codes (available codes) ---
router.get(
  "/redemptions/available/codes",
  redemptionHandlers.public.getAvailableCodes,
);

export default router;
