# Razorpay Setup Guide

## 1. Account Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys** and generate a key pair
3. Add to your `.env`:
   - `RAZORPAY_KEY_ID=rzp_test_...`
   - `RAZORPAY_KEY_SECRET=...`
   - `RAZORPAY_WEBHOOK_SECRET=...` (set after step 2 below)

> For production: complete KYC, switch to Live mode, generate new keys, update env vars.

---

## 2. Webhook Setup

1. Go to **Settings → Webhooks → Add New Webhook**
2. Set URL to `https://yourdomain.com/razorpay/webhook`
3. Set a secret string and copy it to `RAZORPAY_WEBHOOK_SECRET`
4. Enable events: `payment.captured`, `payment.failed`, `refund.created`

> For local dev: use [ngrok](https://ngrok.com) to expose your local server.

---

## 3. Backend Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/razorpay/config` | Get public key for frontend |
| POST | `/razorpay/orders` | Create a Razorpay order |
| POST | `/razorpay/verify` | Verify payment signature |
| POST | `/razorpay/capture` | Capture an authorized payment |
| POST | `/razorpay/refunds` | Initiate a refund |
| GET | `/razorpay/orders/:orderId` | Fetch order details |
| GET | `/razorpay/payments/:paymentId` | Fetch payment details |
| POST | `/razorpay/webhook` | Handle Razorpay webhook events |

---

## 4. Frontend Payment Flow

1. Call `GET /razorpay/config` to get the `key_id`
2. Call `POST /razorpay/orders` with `{ amount, currency }` to create an order
3. Open Razorpay checkout with the `order_id` and `key_id`
4. On success, call `POST /razorpay/verify` with `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`

---

## 5. Test Credentials

**Card**
- Number: `4111 1111 1111 1111`
- Expiry: any future date
- CVV: any 3 digits

**UPI**
- ID: `success@razorpay`
- ID (fail): `failure@razorpay`

**Net Banking**: Select any bank → use test credentials shown on screen
