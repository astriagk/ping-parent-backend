# Razorpay Integration Documentation

Welcome to the Ping Parent Razorpay integration documentation. This folder contains comprehensive guides for setting up and using Razorpay payment processing.

## 📚 Documentation Files

### 1. **[ACCOUNT_SETUP.md](1-ACCOUNT_SETUP.md)** - Getting Started

**Read this first if you're new to Razorpay.**

This guide covers:

- Creating a Razorpay account
- KYC verification process
- Getting and managing API keys
- Configuring your development environment
- Testing with test credentials
- Key rotation and security best practices
- Troubleshooting setup issues

**Time to Complete:** ~30 minutes

**Best For:**

- New developers setting up for the first time
- Understanding Razorpay account structure
- Learning about API keys and security

---

### 2. **[WEBHOOKS_GUIDE.md](2-WEBHOOKS_GUIDE.md)** - Real-Time Notifications

**Read this after account setup or to understand webhooks.**

This guide covers:

- Why webhooks are important
- Different webhook events (payment, refund)
- Setting up webhooks in Razorpay dashboard
- Implementing webhook handlers
- Security (signature verification)
- Best practices for reliable webhook processing
- Testing and troubleshooting

**Time to Complete:** ~45 minutes

**Best For:**

- Understanding payment confirmation workflows
- Implementing real-time payment updates
- Learning webhook security

---

## 🚀 Quick Setup Checklist

Follow this checklist to get Razorpay up and running:

- [ ] Read [1-ACCOUNT_SETUP.md](1-ACCOUNT_SETUP.md)
- [ ] Create Razorpay account
- [ ] Complete KYC verification
- [ ] Get API keys (Key ID and Key Secret)
- [ ] Add keys to `.env.dev` and `.env.production`
- [ ] Test with test credentials in sandbox
- [ ] Read [2-WEBHOOKS_GUIDE.md](2-WEBHOOKS_GUIDE.md)
- [ ] Create webhook in Razorpay dashboard
- [ ] Add webhook secret to environment files
- [ ] Implement webhook handler
- [ ] Test webhook with Ngrok or Postman

---

## 🔧 Core Implementation Files

The Razorpay integration is located at:

```
src/modules/billing/razorpay/
├── razorpay.config.ts          # Initialize Razorpay client
├── razorpay.type.ts            # TypeScript interfaces
├── razorpay.validation.ts       # Request validation schemas
├── razorpay.service.ts          # Business logic
├── razorpay.controller.ts       # HTTP handlers
├── razorpay.routes.ts           # Express routes
├── razorpay.webhook.example.ts  # Webhook implementation example
└── index.ts                     # Module exports
```

---

## 📝 Environment Configuration

Add these variables to your `.env` files:

```env
# Development (.env.dev)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret_here
RAZORPAY_WEBHOOK_SECRET=whsec_test_xxxxxxxxxx

# Production (.env.production)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret_here
RAZORPAY_WEBHOOK_SECRET=whsec_live_xxxxxxxxxx
```

See [1-ACCOUNT_SETUP.md](1-ACCOUNT_SETUP.md#step-3-configuring-your-application) for detailed setup.

---

## 🌐 API Endpoints

| Method | Endpoint                            | Purpose                       |
| ------ | ----------------------------------- | ----------------------------- |
| GET    | `/api/razorpay/config`              | Get Razorpay public config    |
| POST   | `/api/razorpay/orders`              | Create payment order          |
| POST   | `/api/razorpay/verify`              | Verify and complete payment   |
| POST   | `/api/razorpay/capture`             | Capture authorized payment    |
| POST   | `/api/razorpay/refunds`             | Refund completed payment      |
| GET    | `/api/razorpay/orders/:orderId`     | Get order details             |
| GET    | `/api/razorpay/payments/:paymentId` | Get payment details           |
| POST   | `/api/razorpay/webhook`             | Receive payment notifications |

---

## 🔐 Security Checklist

- [ ] **Signature Verification** - Always verify webhook signatures
- [ ] **Environment Variables** - Store secrets in `.env` files, never in code
- [ ] **HTTPS Only** - Use HTTPS for all Razorpay endpoints
- [ ] **API Key Rotation** - Rotate keys every 90 days
- [ ] **Webhook Secret** - Keep webhook secret private
- [ ] **CORS** - Don't expose API keys to frontend
- [ ] **Rate Limiting** - Protect payment endpoints from abuse
- [ ] **Audit Logging** - Log all payment transactions
- [ ] **Error Messages** - Don't expose sensitive data in error responses
- [ ] **Test Mode** - Use test credentials in development

See [2-WEBHOOKS_GUIDE.md](2-WEBHOOKS_GUIDE.md#security) for detailed security guidance.

---

## 🧪 Testing

### Test Credentials (Sandbox)

**Test Payment Methods:**

- Visa: `4111111111111111` (Success)
- Visa: `4000000000000002` (Failure)
- Mastercard: `5555555555554444` (Success)
- UPI: `success@razorpay` (Success)

See [1-ACCOUNT_SETUP.md](1-ACCOUNT_SETUP.md#step-5-test-credentials) for more test credentials.

### Testing Webhooks

```bash
# Using Ngrok (tunnel to localhost)
ngrok http 3000

# Add to Razorpay dashboard:
# https://abc123.ngrok.io/api/razorpay/webhook
```

See [2-WEBHOOKS_GUIDE.md](2-WEBHOOKS_GUIDE.md#testing-webhooks) for detailed webhook testing guide.

---

## 📞 Support & Resources

- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **API Docs:** https://razorpay.com/docs/
- **Webhook Docs:** https://razorpay.com/docs/webhooks/
- **Support:** https://razorpay.com/support/
- **Community:** https://community.razorpay.com

---

## 🔄 Common Workflows

### Creating and Completing a Payment

```
1. Frontend calls /api/razorpay/orders (creates order)
2. Frontend opens Razorpay checkout
3. User completes payment in checkout
4. Frontend receives payment ID
5. Frontend calls /api/razorpay/verify (verify signature)
6. Backend receives webhook /api/razorpay/webhook (updates DB)
7. Subscription activated
```

### Refunding a Payment

```
1. Admin initiates refund in dashboard or API
2. Call /api/razorpay/refunds with payment ID
3. Backend receives refund.created webhook
4. Refund status updated in database
5. Parent notified of refund
```

---

## 📌 Tips & Best Practices

- ✅ **Always verify webhook signatures** - Critical for security
- ✅ **Return 200 OK for all webhooks** - Acknowledges receipt
- ✅ **Process webhooks asynchronously** - Don't block response
- ✅ **Log all transactions** - Helps with debugging
- ✅ **Use transactions for DB updates** - Prevents data inconsistency
- ✅ **Monitor webhook delivery** - Check Razorpay dashboard
- ✅ **Test thoroughly** - Use test credentials before live

---

## ❓ Frequently Asked Questions

**Q: Do I need webhooks?**
A: Highly recommended for production. See [2-WEBHOOKS_GUIDE.md](2-WEBHOOKS_GUIDE.md#why-use-webhooks).

**Q: What if webhook fails?**
A: Razorpay retries automatically. Always return 200 OK. See [2-WEBHOOKS_GUIDE.md](2-WEBHOOKS_GUIDE.md#troubleshooting).

**Q: How do I rotate API keys?**
A: See [1-ACCOUNT_SETUP.md](1-ACCOUNT_SETUP.md#key-rotation-schedule).

**Q: Is it safe to store webhook secret in `.env`?**
A: Yes, if `.env` files are gitignored and properly secured. Never commit to git.

---

## 🎯 Next Steps

1. **Start Here:** [1-ACCOUNT_SETUP.md](1-ACCOUNT_SETUP.md)
2. **Then Learn:** [2-WEBHOOKS_GUIDE.md](2-WEBHOOKS_GUIDE.md)
3. **Implement:** Check code in `src/modules/billing/razorpay/`
4. **Test:** Use test credentials and Ngrok
5. **Deploy:** Move to production when ready

---

**Last Updated:** January 23, 2026  
**Status:** Complete Documentation  
**Version:** 1.0
