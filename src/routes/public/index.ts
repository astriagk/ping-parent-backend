import { Router } from "express";

import razorpayRouter from "./razorpay.routes";
import redemptionsRouter from "./redemptions.routes";
import reviewsRouter from "./reviews.routes";
import subscriptionPlansRouter from "./subscription-plans.routes";

const router = Router();

/**
 * PUBLIC GATEWAY — No auth required
 * Subscription plan listing, Razorpay config/webhooks, driver reviews, available codes
 */
router.use("/", subscriptionPlansRouter);
router.use("/", razorpayRouter);
router.use("/", reviewsRouter);
router.use("/", redemptionsRouter);

export default router;
