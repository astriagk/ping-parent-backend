# Razorpay Endpoints Flow Guide

## Table of Contents

1. [Overview](#overview)
2. [All Endpoints Summary](#all-endpoints-summary)
3. [Complete Payment Flow](#complete-payment-flow)
4. [Webhook vs Regular Flow](#webhook-vs-regular-flow)
5. [Endpoint Details by Category](#endpoint-details-by-category)
6. [When to Use Each Endpoint](#when-to-use-each-endpoint)
7. [Flow Diagrams](#flow-diagrams)
8. [Quick Reference](#quick-reference)

---

## Overview

Your Razorpay integration has **8 endpoints** divided into three categories:

| Category          | Count | Purpose                       |
| ----------------- | ----- | ----------------------------- |
| **Configuration** | 1     | Get Razorpay setup info       |
| **Payment Flow**  | 4     | Create & verify payments      |
| **Management**    | 2     | Get order/payment details     |
| **Webhook**       | 1     | Receive payment notifications |

---

## All Endpoints Summary

### Quick Reference Table

| #   | Endpoint                        | Method | Auth | Category   | Purpose                          |
| --- | ------------------------------- | ------ | ---- | ---------- | -------------------------------- |
| 1   | `/razorpay/config`              | GET    | ❌   | Config     | Get Razorpay Key ID for frontend |
| 2   | `/razorpay/orders`              | POST   | ✅   | Payment    | Create new Razorpay order        |
| 3   | `/razorpay/verify`              | POST   | ✅   | Payment    | Verify payment after checkout    |
| 4   | `/razorpay/capture`             | POST   | ✅   | Payment    | Capture authorized payment       |
| 5   | `/razorpay/refunds`             | POST   | ✅   | Payment    | Refund payment (full/partial)    |
| 6   | `/razorpay/orders/:orderId`     | GET    | ✅   | Management | Get order details                |
| 7   | `/razorpay/payments/:paymentId` | GET    | ✅   | Management | Get payment details              |
| 8   | `/razorpay/webhook`             | POST   | ❌   | Webhook    | Receive Razorpay notifications   |

**Key:**

- ✅ Auth = Requires JWT token (parent authentication)
- ❌ Auth = No authentication needed

---

## Complete Payment Flow

### The Standard Payment Journey (Step-by-Step)

```
START: Parent wants to subscribe
   │
   ├─ STEP 1: Frontend loads
   │  └─ Call: GET /razorpay/config
   │     Who: Frontend
   │     Why: Get Razorpay Key ID
   │     Auth: No
   │     Returns: { keyId: "rzp_test_..." }
   │
   ├─ STEP 2: Parent clicks "Subscribe"
   │  └─ Call: POST /razorpay/orders
   │     Who: Frontend
   │     What: Create order on backend
   │     Auth: Yes (JWT token)
   │     Body: { amount, subscription_id, description }
   │     Returns: { id: "order_...", amount, status }
   │
   ├─ STEP 3: Razorpay Checkout Opens
   │  └─ Frontend opens Razorpay checkout modal
   │     Key ID: From Step 1
   │     Order ID: From Step 2
   │     Parent enters card details
   │     Razorpay processes payment
   │
   ├─ STEP 4: Payment Successful
   │  └─ Razorpay returns:
   │     - razorpay_order_id
   │     - razorpay_payment_id
   │     - razorpay_signature
   │
   ├─ STEP 5: Frontend Verifies Payment
   │  └─ Call: POST /razorpay/verify
   │     Who: Frontend
   │     Why: Verify payment on backend
   │     Auth: Yes (JWT token)
   │     Body: {
   │       razorpay_order_id,
   │       razorpay_payment_id,
   │       razorpay_signature,
   │       payment_id (your internal ID)
   │     }
   │     Returns: { success: true, data: {...} }
   │
   ├─ STEP 6: Backend Processes Payment (Webhook)
   │  └─ Call: POST /razorpay/webhook (automatic)
   │     Who: Razorpay server
   │     Why: Send payment notification
   │     Auth: No (but signature verified)
   │     Happens: In parallel or after Step 5
   │     Purpose: Update DB, send confirmation
   │
   └─ END: Payment Complete ✅
      Parent redirected to dashboard
      Subscription activated
      Confirmation email sent
```

---

## Webhook vs Regular Flow

### What's the Difference?

#### **Regular Flow (Frontend-Driven)**

```
Frontend                          Backend                    Razorpay
   │                                 │                          │
   ├─ GET /config ─────────────────►│                          │
   │                                 │                          │
   ├─ User enters card details      │                          │
   │                                 │                          │
   ├─ POST /orders ─────────────────►│ Creates order            │
   │                                 ├─────────────────────────►│
   │◄─────────────────────────────────────────────────────────────(returns order)
   │                                 │                          │
   ├─ Opens checkout                 │                          │
   │ User completes payment ─────────────────────────────────────►│
   │                                 │                          │
   │◄─────────────────────────────────────────(returns success)─┤
   │                                 │                          │
   ├─ POST /verify ─────────────────►│ Verifies & updates DB   │
   │◄─────────────────────────────────────────────────────────────(returns verified)
   │
   └─ Show success message
```

#### **Webhook Flow (Razorpay-Driven)**

```
Razorpay                          Backend
   │                                 │
   ├─ Payment completed              │
   │                                 │
   ├─ POST /webhook ─────────────────►│
   │                                 ├─ Verifies signature
   │                                 ├─ Updates DB
   │                                 ├─ Sends email
   │◄────────────────────────────────┤ (returns 200 OK)
   │
   (Backend processed payment automatically)
```

### Which One Is More Important?

**Both! They work together:**

| Aspect               | Regular Flow                      | Webhook                   |
| -------------------- | --------------------------------- | ------------------------- |
| **Initiated by**     | Frontend (user)                   | Razorpay server           |
| **Purpose**          | Verify payment from user's device | Confirm payment on server |
| **Reliability**      | Can fail if browser closes        | Always happens            |
| **When to use**      | Always implement                  | Strongly recommended      |
| **What if it fails** | User sees error, can retry        | Webhook retries 4 times   |
| **Security**         | Signature verified twice          | Signature verified        |

**Best Practice:** Implement both for maximum reliability

---

## Endpoint Details by Category

### Category 1: Configuration Endpoints

#### 1️⃣ GET `/razorpay/config`

**Purpose:** Get Razorpay Key ID for frontend

**Who calls it:** Frontend (at page load)

**Authentication:** ❌ No

**Request:**

```bash
GET /api/razorpay/config
```

**Response:**

```json
{
  "success": true,
  "data": {
    "config": {
      "isConfigured": true,
      "keyId": "rzp_test_K1a2b3c4d5e6f"
    }
  },
  "message": "Razorpay configuration fetched successfully"
}
```

**When to use:**

- ✅ When payment page loads
- ✅ Before opening checkout
- ✅ To verify Razorpay is configured

**Error cases:**

- Missing RAZORPAY_KEY_ID in .env → Returns error

---

### Category 2: Payment Flow Endpoints

#### 2️⃣ POST `/razorpay/orders`

**Purpose:** Create a new Razorpay order

**Who calls it:** Frontend (after parent clicks "Subscribe")

**Authentication:** ✅ Yes (JWT token)

**Request:**

```bash
POST /api/razorpay/orders
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 500,           // Amount in RUPEES (not paise)
  "currency": "INR",       // Optional, defaults to INR
  "subscription_id": "sub_123",  // Your subscription ID
  "description": "Monthly subscription"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "order_S7K2nbev4lReNy",
    "entity": "order",
    "amount": 50000, // Amount in PAISE
    "amount_paid": 0,
    "amount_due": 50000,
    "currency": "INR",
    "receipt": "order_507f_l3fh4m",
    "status": "created",
    "notes": {
      "subscription_id": "sub_123",
      "description": "Monthly subscription",
      "user_id": "507f1f77bcf86cd799439011"
    }
  },
  "message": "Order created successfully"
}
```

**When to use:**

- ✅ Before opening Razorpay checkout
- ✅ Every time a new subscription is purchased
- ✅ Every time a parent wants to pay

**Error cases:**

- Missing authentication → 401 Unauthorized
- Invalid amount → 400 Bad Request
- Amount too long in receipt → 400 Bad Request

---

#### 3️⃣ POST `/razorpay/verify`

**Purpose:** Verify payment after successful Razorpay checkout

**Who calls it:** Frontend (after checkout succeeds)

**Authentication:** ✅ Yes (JWT token)

**Request:**

```bash
POST /api/razorpay/verify
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "razorpay_order_id": "order_S7K2nbev4lReNy",
  "razorpay_payment_id": "pay_1X2Y3Z4W5V6U",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
  "payment_id": "507f1f77bcf86cd799439011"  // Your internal payment ID
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "status": "completed",
    "payment_status": "COMPLETED",
    "razorpay_payment_id": "pay_1X2Y3Z4W5V6U",
    "amount": 50000
  },
  "message": "Payment completed successfully"
}
```

**When to use:**

- ✅ After user completes payment in Razorpay checkout
- ✅ Only when checkout returns success
- ✅ To confirm payment in your database

**Error cases:**

- Invalid signature → 401 Unauthorized
- Payment not found → 404 Not Found
- Missing authentication → 401 Unauthorized

---

#### 4️⃣ POST `/razorpay/capture`

**Purpose:** Capture a previously authorized payment

**Who calls it:** Backend (admin/automated process)

**Authentication:** ✅ Yes (JWT token)

**Request:**

```bash
POST /api/razorpay/capture
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "payment_id": "pay_1X2Y3Z4W5V6U",
  "amount": 500  // Amount in RUPEES
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pay_1X2Y3Z4W5V6U",
    "status": "captured",
    "amount": 50000,
    "captured": true
  },
  "message": "Payment captured successfully"
}
```

**When to use:**

- ✅ For 2-step payments (authorize first, capture later)
- ✅ For subscription renewals
- ✅ NOT needed for standard checkout flow

**When NOT to use:**

- ❌ For regular Razorpay checkout (captures automatically)

---

#### 5️⃣ POST `/razorpay/refunds`

**Purpose:** Refund a payment (full or partial)

**Who calls it:** Backend (admin/support staff)

**Authentication:** ✅ Yes (JWT token)

**Request (Full Refund):**

```bash
POST /api/razorpay/refunds
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "payment_id": "pay_1X2Y3Z4W5V6U"
}
```

**Request (Partial Refund):**

```bash
POST /api/razorpay/refunds
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "payment_id": "pay_1X2Y3Z4W5V6U",
  "amount": 250,  // Amount in RUPEES (not paise)
  "notes": {
    "reason": "Partial cancellation"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "rfnd_1A2B3C4D5E6F",
    "entity": "refund",
    "payment_id": "pay_1X2Y3Z4W5V6U",
    "amount": 50000, // Amount in PAISE
    "status": "processed",
    "notes": {
      "reason": "Partial cancellation"
    }
  },
  "message": "Payment refunded successfully"
}
```

**When to use:**

- ✅ When parent requests cancellation
- ✅ For refunds/adjustments
- ✅ For support issues

**When NOT to use:**

- ❌ During payment flow
- ❌ For payment verification

---

### Category 3: Management Endpoints

#### 6️⃣ GET `/razorpay/orders/:orderId`

**Purpose:** Get details of a specific order

**Who calls it:** Backend (admin, reporting)

**Authentication:** ✅ Yes (JWT token)

**Request:**

```bash
GET /api/razorpay/orders/order_S7K2nbev4lReNy
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "order_S7K2nbev4lReNy",
    "entity": "order",
    "amount": 50000,
    "amount_paid": 50000,
    "amount_due": 0,
    "currency": "INR",
    "receipt": "order_507f_l3fh4m",
    "status": "paid",
    "attempts": 1,
    "notes": {
      "subscription_id": "sub_123",
      "user_id": "507f1f77bcf86cd799439011"
    },
    "created_at": 1705988400
  },
  "message": "Order details fetched successfully"
}
```

**When to use:**

- ✅ Admin dashboard (show order details)
- ✅ Transaction history
- ✅ Debugging payment issues

---

#### 7️⃣ GET `/razorpay/payments/:paymentId`

**Purpose:** Get details of a specific payment

**Who calls it:** Backend (admin, reporting)

**Authentication:** ✅ Yes (JWT token)

**Request:**

```bash
GET /api/razorpay/payments/pay_1X2Y3Z4W5V6U
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pay_1X2Y3Z4W5V6U",
    "entity": "payment",
    "amount": 50000,
    "currency": "INR",
    "status": "captured",
    "order_id": "order_S7K2nbev4lReNy",
    "invoice_id": null,
    "international": false,
    "method": "card",
    "amount_refunded": 0,
    "refund_status": null,
    "captured": true,
    "description": "Monthly subscription",
    "card_id": "card_1A2B3C4D5E6F",
    "bank": null,
    "wallet": null,
    "vpa": null,
    "email": "parent@example.com",
    "contact": "+919999999999",
    "fee": 1000,
    "tax": 0,
    "error_code": null,
    "error_description": null,
    "error_source": null,
    "error_reason": null,
    "created_at": 1705988401
  },
  "message": "Payment details fetched successfully"
}
```

**When to use:**

- ✅ Admin dashboard (show payment details)
- ✅ Transaction history
- ✅ Payment investigation

---

### Category 4: Webhook Endpoints

#### 8️⃣ POST `/razorpay/webhook`

**Purpose:** Receive payment notifications from Razorpay

**Who calls it:** Razorpay servers (automatic)

**Authentication:** ❌ No (but signature verified)

**When it's called:**

- After payment is captured
- After payment fails
- When refund is created
- When refund fails

**Request (From Razorpay):**

```json
{
  "event": "payment.captured",
  "id": "evt_1A2B3C4D5E6F",
  "created_at": 1705988400,
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1X2Y3Z4W5V6U",
        "entity": "payment",
        "amount": 50000,
        "status": "captured",
        "method": "card",
        "notes": {
          "subscription_id": "sub_123",
          "user_id": "507f1f77bcf86cd799439011"
        },
        "created_at": 1705988401
      }
    }
  }
}
```

**Response (Always return 200):**

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**When to use:**

- ✅ Automatic (Razorpay calls it)
- ✅ For real-time payment notifications
- ✅ For background processing

**Important:**

- ⚠️ Always return 200 OK (even if processing fails)
- ⚠️ Verify webhook signature
- ⚠️ Handle duplicate webhooks
- ⚠️ Process asynchronously

---

## When to Use Each Endpoint

### Frontend Perspective

**What Frontend Needs to Do:**

```
1. Page Loads
   └─ GET /razorpay/config ──► Get Key ID

2. Parent Clicks "Subscribe"
   └─ POST /razorpay/orders ──► Create order
                                (Gets order ID)

3. Frontend Opens Checkout
   └─ Use Razorpay SDK
      (Razorpay handles everything)

4. Parent Completes Payment
   └─ Razorpay returns success

5. Frontend Verifies Payment
   └─ POST /razorpay/verify ──► Confirm payment
                                (Updates DB)

6. Show Success Message
```

**Frontend Calls These Endpoints:**

- ✅ GET `/razorpay/config` (on page load)
- ✅ POST `/razorpay/orders` (before checkout)
- ✅ POST `/razorpay/verify` (after checkout)

**Frontend Does NOT Call:**

- ❌ POST `/razorpay/capture`
- ❌ POST `/razorpay/refunds`
- ❌ GET `/razorpay/orders/:id`
- ❌ GET `/razorpay/payments/:id`
- ❌ POST `/razorpay/webhook`

---

### Backend Perspective

**What Backend Needs to Do:**

```
1. Handle Frontend Requests
   ├─ GET /razorpay/config ──► Return Key ID
   ├─ POST /razorpay/orders ──► Create order
   └─ POST /razorpay/verify ──► Verify & update DB

2. Handle Webhooks (Automatic)
   └─ POST /razorpay/webhook ──► Process notifications

3. Admin Operations (Manual)
   ├─ POST /razorpay/capture ──► For 2-step payments
   ├─ POST /razorpay/refunds ──► For refunds
   ├─ GET /razorpay/orders/:id ──► View order details
   └─ GET /razorpay/payments/:id ──► View payment details
```

**Backend Calls These Endpoints:**

- ✅ POST `/razorpay/capture` (admin action)
- ✅ POST `/razorpay/refunds` (admin action)
- ✅ GET `/razorpay/orders/:id` (admin/reporting)
- ✅ GET `/razorpay/payments/:id` (admin/reporting)

**Backend Receives (Not Calls):**

- ✅ POST `/razorpay/webhook` (Razorpay calls this)

---

### Razorpay Perspective

**What Razorpay Does:**

```
1. When Parent Opens Checkout
   └─ Shows payment form
   └─ Parent enters card details

2. When Payment is Processed
   ├─ Returns success/failure to frontend
   └─ Sends webhook to backend

3. Real-Time Notifications
   └─ POST /razorpay/webhook ──► Backend
                                 (Updates DB)
```

---

## Flow Diagrams

### Complete Standard Payment Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         STANDARD PAYMENT FLOW                             │
└──────────────────────────────────────────────────────────────────────────┘

FRONTEND                    YOUR SERVER                 RAZORPAY
   │                             │                          │
   │  1. Page Loads              │                          │
   ├─ GET /config ─────────────►│ Returns keyId            │
   │◄─ keyId ─────────────────────────────────────────────────────┤
   │                             │                          │
   │  2. Parent clicks Subscribe │                          │
   ├─ POST /orders ────────────►│                          │
   │                             ├─ Create order           │
   │◄─ orderId ────────────────────────────────────────────►│
   │                             │                          │
   │  3. Open Checkout           │                          │
   │  (Parent enters card)        │                          │
   ├─────────────────────────────────────────────────────────► Razorpay Checkout
   │                             │                          │
   │  4. Payment Success         │                          │
   │◄──────────────────────────────────────────────────────────── Razorpay Response
   │  (orderId, paymentId,       │                          │
   │   signature)                │                          │
   │                             │                          │
   │  5. Verify Payment          │                          │
   ├─ POST /verify ────────────►│ Verify signature         │
   │                             ├─ Update DB              │
   │                             │ Mark as COMPLETED       │
   │◄─ ✅ Success ────────────────────────────────────────────────┤
   │                             │                          │
   │  (Parallel)                 │                          │
   │                             ├◄─────POST /webhook ──── Razorpay sends webhook
   │                             │  Verify signature       │
   │                             │  Send email             │
   │                             │  Send notification      │
   │                             │  Update DB              │
   │                             │                          │
   │  6. Show Success            │                          │
   │  Redirect Dashboard         │                          │
   │                             │                          │

END: Payment Complete ✅
```

---

### Admin Refund Flow

```
ADMIN DASHBOARD             YOUR SERVER              RAZORPAY
   │                             │                       │
   │  1. Admin clicks Refund     │                       │
   ├─ POST /refunds ───────────►│                       │
   │  { payment_id, amount }     │                       │
   │                             ├─ Call Razorpay API   │
   │                             ├──────────────────────► Refund
   │                             │◄──────── Confirm ─────┤
   │◄─ Refund Success ───────────────────────────────────┤
   │  { refund_id, status }      │                       │
   │                             │                       │
   │                             ├◄─── Webhook ──────── Razorpay sends
   │                             │   refund.created      notification
   │                             │   Update DB           │
   │                             │                       │
   │  2. Show Confirmation       │                       │
   │                             │                       │

END: Refund Complete ✅
```

---

### Webhook Flow (Automatic)

```
RAZORPAY                    YOUR SERVER
   │                             │
   │  1. Payment is captured     │
   │                             │
   ├─ POST /webhook ───────────►│
   │  { event, payload }         │
   │                             ├─ Verify signature
   │                             ├─ Process event
   │                             ├─ Update DB
   │                             ├─ Send email
   │                             ├─ Send SMS
   │                             │
   │◄─ 200 OK ──────────────────┤ (always return 200)
   │                             │

NOTE: This happens REGARDLESS of whether
      frontend's POST /verify succeeded or not.
      It's automatic and guaranteed.
```

---

## Quick Reference

### Endpoint Checklist

#### For Building Payment Page:

- [ ] GET `/razorpay/config` - Load page
- [ ] POST `/razorpay/orders` - Before checkout
- [ ] POST `/razorpay/verify` - After checkout

#### For Admin Dashboard:

- [ ] POST `/razorpay/refunds` - Refund button
- [ ] GET `/razorpay/orders/:id` - Order details
- [ ] GET `/razorpay/payments/:id` - Payment details

#### For System Setup:

- [ ] POST `/razorpay/webhook` - Configure in Razorpay dashboard
- [ ] POST `/razorpay/capture` - For 2-step payments (advanced)

### Who Calls What

```
Frontend Only:
├─ GET /razorpay/config
├─ POST /razorpay/orders
└─ POST /razorpay/verify

Backend (Admin):
├─ POST /razorpay/refunds
├─ GET /razorpay/orders/:id
└─ GET /razorpay/payments/:id

Backend (Advanced):
└─ POST /razorpay/capture (2-step payments)

Webhook (Automatic):
└─ POST /razorpay/webhook (Razorpay calls this)
```

### Start to End

```
START: Parent wants to subscribe
  │
  ├─ Frontend calls GET /config
  │  Backend returns: keyId
  │
  ├─ Frontend calls POST /orders
  │  Backend returns: orderId
  │
  ├─ Frontend opens Razorpay checkout
  │  Parent completes payment
  │
  ├─ Razorpay returns: orderId, paymentId, signature
  │
  ├─ Frontend calls POST /verify
  │  Backend verifies & updates DB
  │
  ├─ Razorpay sends webhook (parallel)
  │  Backend receives notification
  │  Backend sends confirmation email
  │
  └─ END: Payment Complete ✅
     Parent sees confirmation
     Subscription activated
```

---

## Common Scenarios

### Scenario 1: Simple Payment (Most Common)

```
Parent subscribes → GET config → POST orders → Checkout →
POST verify → Success → Dashboard
```

**Endpoints Used:**

1. GET `/razorpay/config`
2. POST `/razorpay/orders`
3. POST `/razorpay/verify`

---

### Scenario 2: Admin Refunds Payment

```
Admin clicks Refund → POST /refunds → Backend calls Razorpay →
Webhook notification → Email sent
```

**Endpoints Used:**

1. POST `/razorpay/refunds`
2. POST `/razorpay/webhook` (automatic)

---

### Scenario 3: Check Payment Status

```
Admin checks dashboard → GET /payments/:id → Show details
```

**Endpoints Used:**

1. GET `/razorpay/payments/:id`

---

### Scenario 4: 2-Step Payment (Authorize First, Capture Later)

```
POST /orders → Checkout (authorize only) → Later: POST /capture
```

**Endpoints Used:**

1. POST `/razorpay/orders`
2. POST `/razorpay/capture`

---

## Important Notes

### ⚠️ Critical Points

1. **Webhook is NOT optional**
   - Should be implemented for production
   - Provides fallback if frontend fails

2. **Verify endpoint is essential**
   - MUST verify signature for security
   - MUST verify on every payment

3. **Always return 200 for webhook**
   - Even if processing fails
   - Razorpay retries on 4xx/5xx

4. **Amount conversion:**
   - Frontend sends: Rupees (500)
   - Backend converts: Paise (50000)
   - Razorpay expects: Paise

5. **JWT tokens required**
   - All except `/config` and `/webhook`
   - Token expires, refresh if needed

---

## Testing Each Endpoint

### Test GET /config

```bash
curl http://localhost:3000/api/razorpay/config
```

### Test POST /orders

```bash
curl -X POST http://localhost:3000/api/razorpay/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "subscription_id": "sub_123"
  }'
```

### Test POST /verify

```bash
curl -X POST http://localhost:3000/api/razorpay/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_...",
    "razorpay_payment_id": "pay_...",
    "razorpay_signature": "signature",
    "payment_id": "your_payment_id"
  }'
```

---

## Summary Table

| Endpoint          | When             | Who | Auth | Purpose         |
| ----------------- | ---------------- | --- | ---- | --------------- |
| GET /config       | Page load        | FE  | ❌   | Get Key ID      |
| POST /orders      | Subscribe button | FE  | ✅   | Create order    |
| POST /verify      | After checkout   | FE  | ✅   | Verify payment  |
| POST /capture     | Advanced only    | BE  | ✅   | Capture auth    |
| POST /refunds     | Admin action     | BE  | ✅   | Refund payment  |
| GET /orders/:id   | Admin view       | BE  | ✅   | Order details   |
| GET /payments/:id | Admin view       | BE  | ✅   | Payment details |
| POST /webhook     | Auto trigger     | RZP | ❌   | Notify backend  |

---

**Last Updated:** January 23, 2026
**Version:** 1.0
**Status:** Complete Endpoint Flow Guide
