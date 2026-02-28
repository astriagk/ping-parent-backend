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
