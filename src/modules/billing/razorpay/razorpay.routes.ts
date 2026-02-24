import { Router } from "express";

import { validate } from "@shared/middlewares";

import {
  capturePayment,
  createOrder,
  getOrderDetails,
  getPaymentDetails,
  getRazorpayConfig,
  refundPayment,
  verifyAndCompletePayment,
} from "./razorpay.controller";
import {
  captureRazorpayPaymentSchema,
  createRazorpayOrderSchema,
  refundRazorpayPaymentSchema,
  verifyRazorpayPaymentSchema,
} from "./razorpay.validation";

const router = Router();

/**
 * Razorpay Payment Routes
 * All routes except getRazorpayConfig require parent authentication
 */

// 01. Get Razorpay configuration (public - needed for frontend)
router.get("/config", getRazorpayConfig);

// 02. Create a new Razorpay order
// Request body: { amount, currency?, subscription_id?, description? }
router.post("/orders", validate(createRazorpayOrderSchema), createOrder);

// 03. Verify and complete payment after Razorpay checkout
// Request body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id }
router.post(
  "/verify",
  validate(verifyRazorpayPaymentSchema),
  verifyAndCompletePayment,
);

// 04. Capture a previously authorized payment
// Request body: { payment_id, amount }
router.post("/capture", validate(captureRazorpayPaymentSchema), capturePayment);

// 05. Refund a payment (full or partial)
// Request body: { payment_id, amount?, notes? }
router.post("/refunds", validate(refundRazorpayPaymentSchema), refundPayment);

// 06. Get order details from Razorpay
router.get("/orders/:orderId", getOrderDetails);

// 07. Get payment details from Razorpay
router.get("/payments/:paymentId", getPaymentDetails);

export default router;

/**
 * Handler group for razorpay module.
 * Import in src/routes/public.routes.ts — NO auth middleware here.
 */
export const razorpayHandlers = {
  // Public (no auth — Razorpay callbacks and config)
  public: {
    getConfig: getRazorpayConfig,
    validateCreateOrder: validate(createRazorpayOrderSchema),
    createOrder: createOrder,
    validateVerify: validate(verifyRazorpayPaymentSchema),
    verify: verifyAndCompletePayment,
    validateCapture: validate(captureRazorpayPaymentSchema),
    capture: capturePayment,
    validateRefund: validate(refundRazorpayPaymentSchema),
    refund: refundPayment,
    getOrder: getOrderDetails,
    getPayment: getPaymentDetails,
  },
};
