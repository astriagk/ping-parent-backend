/**
 * Razorpay Webhook Handler (Optional)
 *
 * This file shows how to implement webhook handling for Razorpay events.
 * Webhooks allow Razorpay to notify you of payment status changes in real-time.
 *
 * To use this:
 * 1. Configure webhooks in Razorpay Dashboard
 * 2. Create an endpoint and add this handler
 * 3. Verify webhook signature before processing
 */
import crypto from "crypto";
import { Request, Response } from "express";

import { HTTP_STATUS } from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import { completePayment, refundPayment } from "../payment/payment.service";
import { verifyWebhookSignature } from "./razorpay.service";
import { RazorpayWebhookEvent } from "./razorpay.type";

/**
 * Handle Razorpay Webhook Events
 *
 * Supported events:
 * - payment.authorized: Payment was authorized
 * - payment.failed: Payment failed
 * - payment.captured: Payment was captured
 * - refund.created: Refund was initiated
 * - refund.failed: Refund failed
 */
export const handleRazorpayWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body;
    const signature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Webhook secret not configured",
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      JSON.stringify(body),
      signature,
      webhookSecret,
    );

    if (!isValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid webhook signature");
    }

    // Process webhook event
    const event = body as RazorpayWebhookEvent;

    switch (event.event) {
      case "payment.authorized":
        await handlePaymentAuthorized(event);
        break;

      case "payment.failed":
        await handlePaymentFailed(event);
        break;

      case "payment.captured":
        await handlePaymentCaptured(event);
        break;

      case "refund.created":
        await handleRefundCreated(event);
        break;

      case "refund.failed":
        await handleRefundFailed(event);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    // Always return 200 to acknowledge receipt
    return res.json({
      success: true,
      message: "Webhook processed successfully",
    });
  },
);

/**
 * Handle payment.authorized event
 * Triggered when payment is authorized but not yet captured
 */
async function handlePaymentAuthorized(event: RazorpayWebhookEvent) {
  if (!event.payload.payment?.entity) return;

  const payment = event.payload.payment.entity;
  const notes = payment.notes || {};

  console.log(`Payment authorized: ${payment.id}`);

  // You can log this or update your database
  // For now, no action needed as payment.captured will handle completion
}

/**
 * Handle payment.failed event
 * Triggered when payment fails
 */
async function handlePaymentFailed(event: RazorpayWebhookEvent) {
  if (!event.payload.payment?.entity) return;

  const payment = event.payload.payment.entity;
  const notes = payment.notes || {};

  console.error(`Payment failed: ${payment.id}`);
  console.error(`Error: ${payment.error_description}`);

  // Update your payment record with failed status
  // This allows you to trigger notifications, retry logic, etc.
}

/**
 * Handle payment.captured event
 * Triggered when payment is successfully captured
 */
async function handlePaymentCaptured(event: RazorpayWebhookEvent) {
  if (!event.payload.payment?.entity) return;

  const payment = event.payload.payment.entity;
  const notes = payment.notes || {};
  const paymentId = notes.payment_id as string;

  console.log(`Payment captured: ${payment.id}`);

  if (paymentId) {
    // Update our internal payment record
    await completePayment(paymentId, payment.id, {
      razorpay_payment_id: payment.id,
      method: payment.method,
      status: "captured",
      amount: payment.amount / 100, // Convert from paise to rupees
      captured_at: new Date(),
    });
  }
}

/**
 * Handle refund.created event
 * Triggered when refund is initiated
 */
async function handleRefundCreated(event: RazorpayWebhookEvent) {
  const paymentId = event.payload.payment?.entity?.id;

  console.log(`Refund created for payment: ${paymentId}`);

  // You could add additional logic here, like:
  // - Sending notification to user about refund
  // - Updating inventory if payment was for goods
  // - Logging for compliance
}

/**
 * Handle refund.failed event
 * Triggered when refund fails
 */
async function handleRefundFailed(event: RazorpayWebhookEvent) {
  const paymentId = event.payload.payment?.entity?.id;

  console.error(`Refund failed for payment: ${paymentId}`);

  // Alert admin or log for manual review
  // Add retry logic or escalation if needed
}

/**
 * Route setup for webhook (add this to razorpay.routes.ts if implementing):
 *
 * // Webhook endpoint (no authentication needed - Razorpay uses signature verification)
 * router.post("/webhook", express.raw({type: 'application/json'}), handleRazorpayWebhook);
 *
 * Note: Make sure your express app is configured to parse raw JSON for webhooks
 */
