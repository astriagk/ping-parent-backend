import crypto from "crypto";

import { HTTP_STATUS } from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { razorpayInstance } from "./razorpay.config";
import {
  CapturePaymentRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  RazorpayOrder,
  RazorpayPaymentVerification,
  RefundRequest,
  RefundResponse,
} from "./razorpay.type";

/**
 * Create a new Razorpay order
 */
export const createRazorpayOrder = async (
  data: CreateOrderRequest,
): Promise<CreateOrderResponse> => {
  try {
    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.",
      );
    }

    const order = await razorpayInstance.orders.create({
      amount: data.amount, // Amount in paise
      currency: data.currency || "INR",
      receipt: data.receipt,
      notes: data.notes || {},
    });

    return order as CreateOrderResponse;
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.description || JSON.stringify(error);
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Failed to create Razorpay order: ${errorMessage}`,
    );
  }
};

/**
 * Fetch Razorpay order details
 */
export const fetchRazorpayOrder = async (
  orderId: string,
): Promise<RazorpayOrder> => {
  try {
    const order = await razorpayInstance.orders.fetch(orderId);
    return order as RazorpayOrder;
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.description || JSON.stringify(error);
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      `Failed to fetch Razorpay order: ${errorMessage}`,
    );
  }
};

/**
 * Verify Razorpay payment signature
 * This is crucial for security - verifies that the payment came from Razorpay
 */
export const verifyRazorpaySignature = (
  data: RazorpayPaymentVerification,
): boolean => {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    // Create the signature
    const body = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    // Compare with the signature from Razorpay
    return signature === data.razorpay_signature;
  } catch (error: any) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `Failed to verify signature: ${error.message}`,
    );
  }
};

/**
 * Capture Razorpay payment (for authorized payments)
 */
export const captureRazorpayPayment = async (
  data: CapturePaymentRequest,
): Promise<any> => {
  try {
    const payment = await razorpayInstance.payments.capture(
      data.payment_id,
      data.amount,
      "INR",
    );
    return payment;
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.description || JSON.stringify(error);
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Failed to capture payment: ${errorMessage}`,
    );
  }
};

/**
 * Fetch Razorpay payment details
 */
export const fetchRazorpayPayment = async (paymentId: string): Promise<any> => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.description || JSON.stringify(error);
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      `Failed to fetch payment: ${errorMessage}`,
    );
  }
};

/**
 * Refund Razorpay payment (full or partial)
 */
export const refundRazorpayPayment = async (
  data: RefundRequest,
): Promise<RefundResponse> => {
  try {
    const refundRequest: any = {
      notes: data.notes || {},
    };

    if (data.amount) {
      refundRequest.amount = data.amount;
    }

    const refund = await razorpayInstance.payments.refund(
      data.payment_id,
      refundRequest,
    );

    return refund as RefundResponse;
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.description || JSON.stringify(error);
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Failed to refund payment: ${errorMessage}`,
    );
  }
};

/**
 * Fetch refund details
 */
export const fetchRefund = async (
  refundId: string,
): Promise<RefundResponse> => {
  try {
    const refund = await razorpayInstance.refunds.fetch(refundId);
    return refund as RefundResponse;
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.description || JSON.stringify(error);
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      `Failed to fetch refund: ${errorMessage}`,
    );
  }
};

/**
 * Verify webhook signature
 * Used to verify that webhook events come from Razorpay
 */
export const verifyWebhookSignature = (
  body: string,
  signature: string,
  webhookSecret: string,
): boolean => {
  try {
    const hash = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    return hash === signature;
  } catch (error: any) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `Failed to verify webhook signature: ${error.message}`,
    );
  }
};
