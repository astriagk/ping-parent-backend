import { Router } from "express";

import { razorpayHandlers } from "@modules/billing/razorpay/razorpay.routes";

const router = Router();

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

export default router;
