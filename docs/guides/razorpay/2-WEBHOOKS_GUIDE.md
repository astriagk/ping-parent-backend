# Razorpay Webhooks - Complete Guide

## Table of Contents

1. [Overview](#overview)
2. [Why Use Webhooks?](#why-use-webhooks)
3. [Webhook Events](#webhook-events)
4. [Setup Instructions](#setup-instructions)
5. [Implementation Guide](#implementation-guide)
6. [Security](#security)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Testing Webhooks](#testing-webhooks)

---

## Overview

Webhooks are **HTTP callbacks** that Razorpay uses to notify your application about payment events in real-time. When something happens with a payment (success, failure, refund, etc.), Razorpay sends a POST request to your specified endpoint.

### How It Works

```
┌─────────────┐         Payment          ┌──────────────┐
│   Parent    │  ──────────────────────► │   Razorpay   │
│  (Frontend) │  Opens Checkout Form     │  Payment GW  │
└─────────────┘                          └──────────────┘
                                              │
                                    Payment Completed
                                              │
                                              ▼
                                    ┌──────────────┐
                                    │   Webhook    │
                                    │   Event      │
                                    │   Triggered  │
                                    └──────────────┘
                                              │
                          POST /api/razorpay/webhook
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │   Your Server    │
                                    │   Processes      │
                                    │   Payment        │
                                    └──────────────────┘
```

### Key Components

| Component       | Description                                               |
| --------------- | --------------------------------------------------------- |
| **Event**       | Something that happens (payment captured, refund created) |
| **Webhook URL** | Your server endpoint that receives notifications          |
| **Signature**   | Security token to verify webhook came from Razorpay       |
| **Payload**     | Data sent by Razorpay (payment details, amount, etc.)     |

---

## Why Use Webhooks?

### Problem Without Webhooks

```
1. Customer completes payment in Razorpay checkout
2. Frontend receives success response
3. Frontend calls /api/razorpay/verify endpoint
4. Backend updates payment status in database

❌ What if frontend crashes between step 2 and 3?
   → Payment is recorded by Razorpay but NOT in your database
   → Parent doesn't get subscription access
   → Lost revenue and unhappy customer
```

### Solution With Webhooks

```
1. Customer completes payment in Razorpay checkout
2. Razorpay immediately sends webhook to your server
3. Your server automatically records payment as COMPLETED
4. Frontend ALSO calls /verify endpoint (double confirmation)
5. Payment is guaranteed to be recorded

✅ Even if frontend crashes, payment is already recorded on server
✅ Real-time notifications
✅ Automatic workflows
✅ Better reliability
```

### Benefits Summary

| Benefit               | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| **Reliability**       | Payment recorded even if frontend fails                      |
| **Real-time Updates** | Instant notifications (no polling needed)                    |
| **Automation**        | Trigger workflows automatically (emails, SMS, notifications) |
| **Audit Trail**       | Complete record of all payment events                        |
| **Compliance**        | Documented payment lifecycle for audits                      |
| **User Experience**   | Faster subscription activation                               |

### When to Use Webhooks

#### Use Webhooks If ✅

- You need guaranteed payment recording
- You want real-time notifications
- You send automatic emails/SMSs on payment
- You need audit trails
- Production environment

#### Skip Webhooks If ❌

- Testing only
- Frontend always calls verify
- Simple payment flows

---

## Webhook Events

Razorpay sends webhooks for various payment-related events:

### Payment Events

#### `payment.authorized`

**When:** Payment is authorized but not yet captured
**Use Case:** For 2-step payment flows (authorize first, capture later)

```typescript
{
  "event": "payment.authorized",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1A2B3C4D5E6F",
        "status": "authorized",
        "amount": 50000,  // In paise
        "currency": "INR"
      }
    }
  }
}
```

**Action:** Wait for payment.captured or capture manually

---

#### `payment.captured`

**When:** Payment is successfully captured/charged
**Use Case:** Activate subscription, grant access

```typescript
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1A2B3C4D5E6F",
        "status": "captured",
        "amount": 50000,
        "currency": "INR",
        "method": "card"
      }
    }
  }
}
```

**Action:** Activate subscription, send confirmation email, update database

---

#### `payment.failed`

**When:** Payment fails due to insufficient funds, declined card, etc.
**Use Case:** Notify user, log failure, trigger retry

```typescript
{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1A2B3C4D5E6F",
        "status": "failed",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Payment failed"
      }
    }
  }
}
```

**Action:** Notify user, log failure, suggest retry

---

### Refund Events

#### `refund.created`

**When:** Refund is initiated successfully
**Use Case:** Update refund status, notify parent

```typescript
{
  "event": "refund.created",
  "payload": {
    "refund": {
      "entity": {
        "id": "rfnd_1A2B3C4D5E6F",
        "payment_id": "pay_1A2B3C4D5E6F",
        "amount": 50000,
        "status": "processed"
      }
    }
  }
}
```

**Action:** Update refund status, send notification email

---

#### `refund.failed`

**When:** Refund fails (e.g., card expired)
**Use Case:** Alert admin, log for manual review

```typescript
{
  "event": "refund.failed",
  "payload": {
    "refund": {
      "entity": {
        "id": "rfnd_1A2B3C4D5E6F",
        "payment_id": "pay_1A2B3C4D5E6F",
        "error_code": "GATEWAY_ERROR",
        "error_description": "Refund failed"
      }
    }
  }
}
```

**Action:** Alert admin, escalate for manual review

---

## Setup Instructions

### Step 1: Create Webhook in Razorpay Dashboard

1. **Login to Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com
   - Login with your credentials

2. **Navigate to Webhooks**
   - Click: **Settings** (left sidebar)
   - Select: **Webhooks**
   - Direct link: https://dashboard.razorpay.com/app/webhooks

3. **Create New Webhook**
   - Click **+ Add New Webhook** button
   - Enter your webhook URL: `https://yourdomain.com/api/razorpay/webhook`

   **For different environments:**

   ```
   Development: http://localhost:3000/api/razorpay/webhook
   Staging:     https://staging.yourdomain.com/api/razorpay/webhook
   Production:  https://yourdomain.com/api/razorpay/webhook
   ```

4. **Select Events to Monitor**
   Check these events:
   - ✅ payment.authorized
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ refund.created
   - ✅ refund.failed

5. **Create Webhook**
   - Click **Create** button
   - Razorpay will show the **Webhook Secret**
   - Copy this secret immediately

### Step 2: Add Webhook Secret to Environment Files

Copy the webhook secret from previous step and add to both environment files:

**Development (.env.dev):**

```env
RAZORPAY_WEBHOOK_SECRET=whsec_your_test_webhook_secret
```

**Production (.env.production):**

```env
RAZORPAY_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### Step 3: Implement Webhook Handler

Webhook handler code is already available at:

```
src/modules/billing/razorpay/razorpay.webhook.example.ts
```

To activate it:

1. **Add Route** to `src/modules/billing/razorpay/razorpay.routes.ts`:

```typescript
import { handleRazorpayWebhook } from "./razorpay.webhook.controller";

// Add this route
router.post("/webhook", handleRazorpayWebhook);
```

2. **Implement Webhook Controller** at `src/modules/billing/razorpay/razorpay.webhook.controller.ts`:

```typescript
import { Request, Response } from "express";

import { HTTP_STATUS } from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import { verifyWebhookSignature } from "./razorpay.service";
import { RazorpayWebhookEvent } from "./razorpay.type";

export const handleRazorpayWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    // 1. Extract webhook data
    const body = req.body;
    const signature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Webhook secret not configured",
      );
    }

    // 2. Verify webhook signature (CRITICAL for security)
    const isValid = verifyWebhookSignature(
      JSON.stringify(body),
      signature,
      webhookSecret,
    );

    if (!isValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid webhook signature");
    }

    // 3. Parse webhook event
    const event = body as RazorpayWebhookEvent;

    // 4. Handle different event types
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
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

    // 5. Always return 200 OK to acknowledge receipt
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Webhook processed successfully",
    });
  },
);

// Event handlers
async function handlePaymentCaptured(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity;
  if (!payment) return;

  console.log(`✅ Payment captured: ${payment.id}`);

  // TODO: Update your database
  // TODO: Send confirmation email
  // TODO: Activate subscription
  // TODO: Log for audit
}

async function handlePaymentFailed(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity;
  if (!payment) return;

  console.error(`❌ Payment failed: ${payment.id}`);

  // TODO: Notify user
  // TODO: Log failure
  // TODO: Alert admin if needed
}

async function handleRefundCreated(event: RazorpayWebhookEvent) {
  const refund = event.payload.refund?.entity;
  if (!refund) return;

  console.log(`✅ Refund created: ${refund.id}`);

  // TODO: Update refund status
  // TODO: Send notification
  // TODO: Log for audit
}

async function handleRefundFailed(event: RazorpayWebhookEvent) {
  const refund = event.payload.refund?.entity;
  if (!refund) return;

  console.error(`❌ Refund failed: ${refund.id}`);

  // TODO: Alert admin
  // TODO: Log for manual review
}
```

---

## Implementation Guide

### Real-World Example: Payment Captured

Complete implementation of handling payment.captured event:

```typescript
async function handlePaymentCaptured(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity;
  const notes = payment?.notes || {};
  const parentId = notes.parent_id as string;
  const paymentId = notes.payment_id as string;
  const subscriptionId = notes.subscription_id as string;

  console.log(`Processing payment.captured: ${payment.id}`);

  try {
    // Step 1: Update payment record
    await paymentRepository.updateById(paymentId, {
      $set: {
        payment_status: PaymentStatus.COMPLETED,
        transaction_id: payment.id,
        gateway_response: {
          razorpay_payment_id: payment.id,
          method: payment.method,
          amount: payment.amount,
          status: payment.status,
          created_at: payment.created_at,
        },
        updated_at: new Date(),
      },
    });

    // Step 2: Activate subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

    await subscriptionRepository.updateById(subscriptionId, {
      $set: {
        status: "active",
        activated_at: new Date(),
        expires_at: endDate,
      },
    });

    // Step 3: Send confirmation email
    await emailService.sendSubscriptionConfirmation({
      parentId,
      amount: payment.amount / 100, // Convert paise to rupees
      expiresAt: endDate,
    });

    // Step 4: Send in-app notification
    await notificationService.create({
      user_id: parentId,
      type: "payment_success",
      title: "Payment Successful",
      message: `Your subscription has been activated for ₹${payment.amount / 100}`,
    });

    // Step 5: Log for audit
    await auditLogService.create({
      action: "PAYMENT_CAPTURED",
      user_id: parentId,
      details: {
        payment_id: payment.id,
        amount: payment.amount / 100,
        subscription_id: subscriptionId,
      },
    });

    console.log(`✅ Payment processed successfully: ${payment.id}`);
  } catch (error) {
    console.error(`❌ Error processing payment: ${payment.id}`, error);
    // Alert admin
    await alertAdmin("Webhook processing failed", error);
    throw error; // Re-throw to alert Razorpay of processing error
  }
}
```

---

## Security

### 1. Signature Verification (CRITICAL)

**Always verify the webhook signature before processing:**

```typescript
const isValid = verifyWebhookSignature(
  JSON.stringify(body),
  signature,
  webhookSecret!,
);

if (!isValid) {
  // Reject the webhook - it might be from a hacker
  return res.status(401).json({ error: "Invalid signature" });
}
```

**How it works:**

1. Razorpay signs the webhook with your secret key
2. You recreate the signature using the same secret
3. If signatures match → webhook is from Razorpay ✅
4. If they don't match → webhook is fake ❌

### 2. Always Return 200 OK

**Return 200 even if processing fails:**

```typescript
try {
  // Process webhook...
  return res.status(200).json({ success: true });
} catch (error) {
  console.error("Webhook processing error:", error);
  // Return 200 to prevent Razorpay from retrying forever
  return res.status(200).json({
    success: false,
    error: "Processing failed",
    webhook_id: req.body.id,
  });
}
```

⚠️ **Important:** Razorpay retries 4xx and 5xx responses. Return 200 to acknowledge receipt.

### 3. Idempotency

**Handle duplicate webhooks safely:**

```typescript
const processedWebhooks = new Set<string>();

export const handleRazorpayWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const webhookId = req.body.id;

    // Skip if already processed
    if (processedWebhooks.has(webhookId)) {
      return res.status(200).json({
        success: true,
        message: "Already processed",
      });
    }

    // Process webhook...

    // Mark as processed
    processedWebhooks.add(webhookId);

    return res.status(200).json({ success: true });
  },
);
```

### 4. Validate Event Data

```typescript
async function handlePaymentCaptured(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity;

  // Validate required fields
  if (!payment?.id || !payment?.amount || !payment?.notes?.parent_id) {
    console.error("Invalid webhook data:", event);
    return; // Skip processing
  }

  // Continue with processing...
}
```

---

## Best Practices

### 1. Process Asynchronously

**Don't process everything in the request:**

```typescript
// ❌ Wrong - Might timeout
export const handleRazorpayWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    // Long-running operations here
    await sendEmails();
    await updateDatabase();
    await notifyUsers();
  },
);

// ✅ Better - Acknowledge immediately, process later
export const handleRazorpayWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    // Acknowledge immediately
    res.status(200).json({ success: true });

    // Process in background
    setImmediate(async () => {
      try {
        await handlePaymentCaptured(event);
      } catch (error) {
        console.error("Background processing failed:", error);
        await alertAdmin("Webhook processing failed", error);
      }
    });
  },
);
```

### 2. Log Everything

```typescript
async function handlePaymentCaptured(event: RazorpayWebhookEvent) {
  const paymentId = event.payload.payment?.entity?.id;

  console.log(`[WEBHOOK] Processing payment.captured: ${paymentId}`);

  try {
    // ... process payment
    console.log(`[WEBHOOK] ✅ Success: ${paymentId}`);
  } catch (error) {
    console.error(`[WEBHOOK] ❌ Failed: ${paymentId}`, error);
    throw error;
  }
}
```

### 3. Database Consistency

**Use transactions if possible:**

```typescript
async function handlePaymentCaptured(event: RazorpayWebhookEvent) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update payment
    await Payment.updateOne(
      { transaction_id: paymentId },
      { status: "completed" },
      { session },
    );

    // Activate subscription
    await Subscription.updateOne(
      { _id: subscriptionId },
      { status: "active" },
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### 4. Error Handling

**Graceful error handling with admin alerts:**

```typescript
try {
  switch (event.event) {
    case "payment.captured":
      await handlePaymentCaptured(event);
      break;
  }

  return res.status(200).json({ success: true });
} catch (error) {
  console.error("Webhook processing error:", error);

  // Send alert to admin
  await sendAdminAlert({
    subject: "Webhook Processing Failed",
    error: error.message,
    webhook_id: req.body.id,
    event_type: req.body.event,
  });

  // Return 200 to acknowledge (but log failure)
  return res.status(200).json({
    success: false,
    error: "Processing failed",
    webhook_id: req.body.id,
  });
}
```

---

## Troubleshooting

### Webhook Not Triggering

**Problem:** Razorpay dashboard shows webhook but no requests are received

**Solutions:**

1. Verify webhook URL is correct and accessible
   - Use: `https://yourdomain.com/api/razorpay/webhook`
   - Not: `http://localhost:3000/...` (Razorpay can't reach localhost)

2. Check firewall/security groups allow incoming POST requests

3. Test webhook in Razorpay dashboard:
   - Go to: Settings → Webhooks
   - Click on your webhook
   - Click "Test Webhook"

4. Check server logs for POST requests

5. Verify endpoint returns 200 OK

### Signature Verification Failing

**Problem:** Getting "Invalid webhook signature" error

**Solutions:**

1. Verify webhook secret is correct in `.env`
2. Check secret format (should start with `whsec_`)
3. Ensure JSON body is not modified before verification
4. Check timezone sync between servers

### Duplicate Webhooks

**Problem:** Same webhook processed multiple times

**Solutions:**

1. Implement webhook ID tracking (see Idempotency section)
2. Use database unique constraints
3. Check logs for Razorpay retries (shown in dashboard)

### Payment Not Updated After Webhook

**Problem:** Webhook processed successfully but payment not updated

**Solutions:**

1. Check if parent_id in webhook notes matches your records
2. Verify subscription_id exists in your database
3. Check database logs for errors
4. Manually test database update logic
5. Check error logs in application

---

## Testing Webhooks

### Using Ngrok (Recommended)

**For local testing:**

```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Start ngrok tunnel
ngrok http 3000

# 3. You'll get a URL like: https://abc123.ngrok.io
# 4. Add to Razorpay webhooks: https://abc123.ngrok.io/api/razorpay/webhook
```

### Using Webhook Testing Tools

- [Webhook.cool](https://webhook.cool) - Free webhook testing
- [RequestBin](https://requestbin.com) - Capture and inspect webhooks
- [Postman Webhook Monitor](https://web.postman.co)

### Test Webhook in Razorpay Dashboard

1. Go to: https://dashboard.razorpay.com/app/webhooks
2. Click on your webhook
3. Scroll down to "Webhook Payload History"
4. Click "Send Test Event" button
5. Select event type (e.g., payment.captured)
6. Click "Send"
7. Check your server logs for the webhook

### Manual Testing

```bash
# Simulate webhook from terminal
curl -X POST http://localhost:3000/api/razorpay/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test_signature" \
  -d '{
    "event": "payment.captured",
    "id": "evt_test_123456",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "status": "captured",
          "amount": 50000,
          "method": "card",
          "notes": {
            "parent_id": "parent_123",
            "payment_id": "payment_123"
          }
        }
      }
    }
  }'
```

---

## Summary

| Aspect        | Details                                   |
| ------------- | ----------------------------------------- |
| **What**      | HTTP callbacks for payment events         |
| **When**      | In real-time when payment status changes  |
| **Why**       | Guaranteed payment recording, automation  |
| **Setup**     | 5 minutes - Add URL in Razorpay dashboard |
| **Security**  | Always verify signature                   |
| **Essential** | For production environments               |
| **Optional**  | For simple test/development               |

---

## Quick Links

- [Razorpay Webhooks Docs](https://razorpay.com/docs/webhooks/)
- [Razorpay Dashboard Webhooks](https://dashboard.razorpay.com/app/webhooks)
- [Razorpay API Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

---

**Last Updated:** January 23, 2026
**Version:** 1.0
**Status:** Complete Webhook Guide
