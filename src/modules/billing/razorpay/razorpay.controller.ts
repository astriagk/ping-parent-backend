import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import { completePayment } from "../payment/payment.service";
import { validateRazorpayConfig } from "./razorpay.config";
import {
  captureRazorpayPayment,
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  refundRazorpayPayment,
  verifyRazorpaySignature,
} from "./razorpay.service";

/**
 * Get Razorpay configuration (for frontend)
 * Returns the Razorpay Key ID needed for client-side integration
 */
export const getRazorpayConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const config = validateRazorpayConfig();

    return res.json({
      success: true,
      data: {
        config,
      },
      message: "Razorpay configuration fetched successfully",
    });
  },
);

/**
 * Create a new Razorpay order
 * Step 1 of payment flow
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { amount, currency, subscription_id, description } = req.body;

  // Create Razorpay order
  // Receipt format: order_{timestamp in base36}
  // Example: order_l3fh4m (total ~15 chars, well under 40 char limit)
  const receipt =
    `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`.substring(
      0,
      40,
    );

  const order = await createRazorpayOrder({
    amount: Math.round(amount * 100), // Convert rupees to paise
    currency: currency || "INR",
    receipt,
    notes: {
      subscription_id,
      description,
    },
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: order,
    message: SUCCESS_MESSAGES.PAYMENT.CREATED_SUCCESSFULLY,
  });
});

/**
 * Verify and complete Razorpay payment
 * Step 2 of payment flow - called after successful payment on frontend
 */
export const verifyAndCompletePayment = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_id, // Our internal payment ID
    } = req.body;

    // Verify signature
    const isSignatureValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isSignatureValid) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid payment signature. Payment verification failed.",
      );
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await fetchRazorpayPayment(razorpay_payment_id);

    if (!razorpayPayment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "Payment not found in Razorpay",
      );
    }

    // // Update our payment record
    // const updatedPayment = await completePayment(
    //   payment_id,
    //   razorpay_payment_id,
    //   {
    //     razorpay_order_id,
    //     razorpay_payment_id,
    //     method: razorpayPayment.method,
    //     amount: razorpayPayment.amount,
    //     currency: razorpayPayment.currency,
    //     status: razorpayPayment.status,
    //     created_at: razorpayPayment.created_at,
    //   },
    // );

    return res.json({
      success: true,
      data: razorpayPayment,
      message: SUCCESS_MESSAGES.PAYMENT.COMPLETED_SUCCESSFULLY,
    });
  },
);

/**
 * Capture a Razorpay payment (for authorized payments)
 */
export const capturePayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { payment_id, amount } = req.body;

    // Capture payment on Razorpay
    const capturedPayment = await captureRazorpayPayment({
      payment_id,
      amount: Math.round(amount * 100), // Convert to paise
    });

    return res.json({
      success: true,
      data: capturedPayment,
      message: "Payment captured successfully",
    });
  },
);

/**
 * Get Razorpay order details
 */
export const getOrderDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params as Record<string, string>;

    const order = await fetchRazorpayOrder(orderId);

    return res.json({
      success: true,
      data: order,
      message: "Order details fetched successfully",
    });
  },
);

/**
 * Get Razorpay payment details
 */
export const getPaymentDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params as Record<string, string>;

    const payment = await fetchRazorpayPayment(paymentId);

    return res.json({
      success: true,
      data: payment,
      message: "Payment details fetched successfully",
    });
  },
);

/**
 * Refund a Razorpay payment (full or partial)
 */
export const refundPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { payment_id, amount, notes } = req.body;

    // Refund on Razorpay
    const refund = await refundRazorpayPayment({
      payment_id,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to paise if provided
      notes,
    });

    // Update our payment record to REFUNDED status
    // This should be handled in payment.service

    return res.json({
      success: true,
      data: refund,
      message: SUCCESS_MESSAGES.PAYMENT.REFUNDED_SUCCESSFULLY,
    });
  },
);
