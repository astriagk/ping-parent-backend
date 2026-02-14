# Razorpay Account Setup & API Keys

## Table of Contents

0. [Development vs Production](#development-vs-production)
1. [Creating Your Account](#creating-your-account)
2. [Website/App Configuration](#websiteapp-configuration)
3. [Getting API Keys](#getting-api-keys)
4. [Configuring Your Application](#configuring-your-application)
5. [Testing the Setup](#testing-the-setup)
6. [Test Credentials](#test-credentials)
7. [Key Management](#key-management)
8. [Additional Configuration](#additional-configuration)

---

## Development vs Production

### Quick Overview

Your Razorpay setup differs significantly between development and production environments:

| Aspect             | Development                | Production                 |
| ------------------ | -------------------------- | -------------------------- |
| **Keys**           | `rzp_test_...` (Test Keys) | `rzp_live_...` (Live Keys) |
| **Real Charges**   | ❌ No (Test mode only)     | ✅ Yes (Real money)        |
| **KYC Required**   | ❌ Not needed              | ✅ Required (mandatory)    |
| **Account Setup**  | ⚡ Quick (5 mins)          | 📋 Complete (2-3 days)     |
| **Team Access**    | 👥 All developers          | 🔒 Only authorized person  |
| **Payment Method** | Test cards only            | Real customer cards        |
| **Approval**       | Immediate                  | 1-2 hours after KYC        |
| **Payouts**        | Not available              | Available                  |

### Development Environment

**When:** During development, testing, and staging  
**Keys:** Test Keys (`rzp_test_...`)

**Setup:**

- Use ONE shared Razorpay account for your team
- No KYC verification needed
- No bank account required
- All developers use the same test keys

**Benefits:**

- ✅ Quick setup (5 minutes)
- ✅ No real charges
- ✅ Use test cards for payment testing
- ✅ Easy to reset/reset transactions
- ✅ No compliance documents needed
- ✅ All developers can access same dashboard

**Process:**

```
1. Create Razorpay account (personal or company email)
2. Copy test keys immediately
3. Add to .env.dev file
4. Share account access with team (Dashboard → Settings → Team → Add Member)
5. Start testing with test cards
```

**Example .env.dev:**

```env
RAZORPAY_KEY_ID=rzp_test_K1a2b3c4d5e6f7g8h
RAZORPAY_KEY_SECRET=GxdR5o6u7v8w9x0y1z2a3
```

### Production Environment

**When:** Go-live, real payments, actual users  
**Keys:** Live Keys (`rzp_live_...`)

**Setup:**

- ONE designated person manages production account
- Complete KYC verification (documents required)
- Bank account for payouts mandatory
- Live keys stored securely (secrets management)

**Prerequisites:**

1. **Create Account**
   - One person creates the account
   - Usually: CEO, Finance Manager, or Tech Lead

2. **Complete KYC (Know Your Customer)**
   - Upload PAN Card
   - Upload GST Certificate (if applicable)
   - Upload Business Proof (Aadhar/Passport)
   - Upload Address Proof
   - **Timeline:** 1-24 hours for review, then 1-2 hours for approval

3. **Add Bank Account**
   - For receiving payouts
   - For settlement of payments

4. **Get Live Keys**
   - Available only after KYC approved
   - Format: `rzp_live_...`

**Benefits:**

- ✅ Real payments accepted
- ✅ Funds settle to bank account
- ✅ Full compliance
- ✅ Webhook support
- ✅ Advanced features enabled
- ✅ Razorpay support

**Process:**

```
1. ONE person creates account with business details
2. Upload KYC documents (1-24 hours)
3. Wait for approval (1-2 hours after docs reviewed)
4. Add bank account for payouts
5. Receive live keys
6. Store securely in production environment
7. Add to .env.production with encryption
8. Only authorized person has access
```

**Example .env.production:**

```env
RAZORPAY_KEY_ID=rzp_live_K1a2b3c4d5e6f7g8h
RAZORPAY_KEY_SECRET=GxdR5o6u7v8w9x0y1z2a3
```

### Timeline Comparison

**Development Setup:**

```
Day 1: Create account → Copy keys → Configure app → Start testing
⏱️ Total: 15 minutes
```

**Production Setup:**

```
Day 1: Person creates account, uploads documents
Day 2: Razorpay reviews (1-24 hours)
Day 3: KYC approved (1-2 hours) → Add bank → Get live keys → Configure
⏱️ Total: 2-3 days
```

### Security Implications

**Development (Less Critical):**

- Test keys have no real value
- Can be shared safely with team
- Leaking doesn't cause financial damage
- Can be regenerated without impact

**Production (CRITICAL):**

- Live keys = Access to real money
- ⚠️ Never commit to git
- ⚠️ Never share via email/chat
- ⚠️ Only authorized person should have access
- ⚠️ Rotate keys every 3 months
- ⚠️ Immediately regenerate if compromised

### Recommendations

**For Development:**

```
✅ Create shared account for team
✅ Use test keys in .env.dev
✅ Share dashboard access with developers
✅ Document test card numbers
✅ Reset test data regularly
```

**For Production:**

```
✅ Designate ONE account owner
✅ Complete KYC early (don't wait until launch)
✅ Use secrets management (AWS Secrets Manager, etc.)
✅ Only authorized person has access
✅ Rotate keys quarterly
✅ Monitor all transactions
✅ Set up webhooks for real-time updates
```

### Which Section to Read

- **If you're a developer:** Focus on the **Development** part above, then read "Creating Your Account" for test setup
- **If you're managing production:** Focus on **Production** part, then read entire guide
- **Both:** Read entire guide for complete understanding

---

## Creating Your Account

### Step 1: Sign Up for Razorpay

1. **Visit Razorpay Website**
   - Go to: https://razorpay.com
   - Click **Sign Up** button (top right)

2. **Choose Business Account**
   - Select **Business Account** option
   - Fill in the registration form:
     - Business Name
     - Email Address
     - Phone Number
     - Password

3. **Verify Your Email**
   - Check your email inbox for verification link
   - Click the link in the email
   - You'll be redirected to the dashboard

### Step 2: Complete Your Business Profile

1. **Login to Dashboard**
   - Go to: https://dashboard.razorpay.com
   - Enter your login credentials

2. **Fill Business Information**
   - Navigate to: **Settings** → **Business Profile**
   - Add required details:
     - Business legal name
     - Business type/category
     - Business address
     - Website URL
     - Contact person details

3. **Add Bank Account**
   - Go to: **Settings** → **Bank Accounts**
   - Add your bank account for payouts
   - Bank account details needed:
     - Account holder name
     - Account number
     - IFSC code
     - Account type (Savings/Current)

### Step 3: Complete KYC Verification

**KYC (Know Your Customer) is required for live payments**

1. **Upload Documents**
   - Navigate to: **Settings** → **Compliance** or **KYC**
   - Upload required documents:
     - **PAN Card** (Permanent Account Number)
     - **GST Certificate** (if applicable)
     - **Business Proof** (Aadhar, Passport, etc.)
     - **Address Proof**

2. **Verification Timeline**
   - Documents review: 1-24 hours
   - KYC approval: 1-2 hours
   - Once approved, you can use LIVE keys

3. **Check Verification Status**
   - Dashboard shows KYC status
   - Email notification once verified
   - You'll see option to enable "Live Mode"

---

## Website/App Configuration

### Step 4: Add Your Website/App Details

After account creation, Razorpay asks you to configure your website/app. **This is required before API keys appear.**

1. **Switch to Test Mode**
   - You'll see a toggle at the top of the dashboard
   - Select **Test Mode** (not Live)
   - This is where test keys are available

2. **Add Website URL**
   - Go to: **Settings** → **Website & App**
   - Enter your website/app URL:
     ```
     Development: http://localhost:3000
     Production:  https://yourdomain.com
     ```

3. **Add Return/Success URL** (for redirects after payment)
   - This is where user goes after payment completes
   - For backend, use your verify endpoint:
     ```
     http://localhost:3000/api/razorpay/verify
     OR
     https://yourdomain.com/api/razorpay/verify
     ```

4. **Add Webhook URL** (optional but recommended)
   - This is where Razorpay sends payment notifications
   - For backend:
     ```
     http://localhost:3000/api/razorpay/webhook
     OR
     https://yourdomain.com/api/razorpay/webhook
     ```

5. **Configure Business Settings**
   - **Business Type:** Select your category (e.g., Education)
   - **Business Model:** Select B2B or B2C
     - For Ping Parent (parents paying for subscriptions) = **B2C**

6. **Save Configuration**
   - Click **Save** or **Update**
   - Dashboard confirms settings saved

### After Configuration

✅ **API keys should now be visible** in:

- **Settings** → **API Keys**
- Direct link: https://dashboard.razorpay.com/app/settings/api-keys

If keys still don't appear:

1. Refresh the dashboard page (Ctrl + R or Cmd + R)
2. Logout and login again
3. Check if you're in **Test Mode** (toggle at top)
4. Wait 5-10 minutes (sometimes takes a moment to generate)
5. Contact Razorpay support if still missing

---

## Getting API Keys

### Understanding API Keys

Razorpay provides two types of API keys:

| Key Type                 | Format              | Purpose               | Where to Use       |
| ------------------------ | ------------------- | --------------------- | ------------------ |
| **Key ID** (Public)      | `rzp_test_K1234...` | Identify your account | Frontend & Backend |
| **Key Secret** (Private) | `GxdR5o6u7v8w9...`  | Authenticate requests | Backend ONLY       |

**Test vs Live:**

- **Test Keys** (`rzp_test_...`) - For development, no real charges
- **Live Keys** (`rzp_live_...`) - For production, real charges

### How to Get Your Keys

1. **Login to Razorpay Dashboard**
   - Go to: https://dashboard.razorpay.com
   - Login with your credentials

2. **Navigate to API Keys**
   - Click: **Settings** (left sidebar)
   - Select: **API Keys**
   - Direct link: https://dashboard.razorpay.com/app/settings/api-keys

3. **Copy Your Keys**
   - You'll see two sections:
     - **Key ID** - Click copy icon
     - **Key Secret** - Click copy icon
4. **Save Them Safely**
   - ⚠️ **NEVER share Key Secret**
   - ⚠️ **NEVER commit to git**
   - Store in `.env` files only

### Key ID Example

```
rzp_test_K1a2b3c4d5e6f7g8h
    ↑     ↑
   Mode  Key

Test = rzp_test_
Live = rzp_live_
```

### Key Secret Example

```
gZa1b2C3d4E5f6G7h8I9j0K
(Keep this private!)
```

---

## Configuring Your Application

### Add Keys to Environment Files

#### Development Environment (.env.dev)

Create or update `environment/.env.dev`:

```env
PORT=3000
MONGO_URI=mongodb+srv://your_db_connection
DB_NAME=ping-parent-dev
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=7d
NODE_ENV=dev

# Razorpay Payment Gateway Configuration (Development/Testing)
# Get keys from: https://dashboard.razorpay.com/app/settings/api-keys
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET

# Optional: Razorpay Webhook Secret (if implementing webhooks)
# Get from: https://dashboard.razorpay.com/app/webhooks
# RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Production Environment (.env.production)

Create or update `environment/.env.production`:

```env
PORT=3000
MONGO_URI=mongodb+srv://your_prod_db_connection
DB_NAME=ping-parent-prod
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=7d
NODE_ENV=production

# Razorpay Payment Gateway Configuration (Production)
# ⚠️ Use LIVE keys, not test keys!
# Get keys from: https://dashboard.razorpay.com/app/settings/api-keys
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET

# Optional: Razorpay Webhook Secret (if implementing webhooks)
# Get from: https://dashboard.razorpay.com/app/webhooks
# RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step-by-Step Configuration

1. **Copy Key ID**
   - Login to Dashboard → Settings → API Keys
   - Click copy icon next to **Key ID**
   - Paste after `RAZORPAY_KEY_ID=`

2. **Copy Key Secret**
   - In same page, click copy icon next to **Key Secret**
   - ⚠️ Keep it private!
   - Paste after `RAZORPAY_KEY_SECRET=`

3. **Verify Configuration**

   ```bash
   # Start your server
   npm run dev

   # Should start without errors about missing Razorpay credentials
   ```

4. **Test the Configuration**

   ```bash
   # Test endpoint
   curl http://localhost:3000/api/razorpay/config

   # Response should show:
   # {
   #   "success": true,
   #   "data": {
   #     "keyId": "rzp_test_K1234567890abc"
   #   }
   # }
   ```

---

## Testing the Setup

### Manual Testing

#### Test 1: Check Configuration Endpoint

```bash
curl http://localhost:3000/api/razorpay/config
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "keyId": "rzp_test_K1a2b3c4d5e6f7g8h"
  },
  "message": "Razorpay configuration fetched successfully"
}
```

#### Test 2: Create Test Order

```bash
curl -X POST http://localhost:3000/api/razorpay/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 100,
    "currency": "INR"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "order_1A2B3C4D5E6F",
    "entity": "order",
    "amount": 10000,
    "currency": "INR",
    "status": "created"
  }
}
```

### Postman Testing

1. **Import Collection**
   - Import `docs/api/postman/Razorpay_Payment_API.postman_collection.json`
   - Or create new collection with endpoints

2. **Set Variables**
   - `base_url` = `http://localhost:3000/api`
   - `parent_jwt_token` = Your JWT token
   - `razorpay_key` = Your test Key ID

3. **Run Requests**
   - Start with `/razorpay/config`
   - Then test `/razorpay/orders`

---

## Test Credentials

### Test Credit Cards

Use these card numbers for testing. **No real charges will be made.**

#### Success Cases

| Card Type            | Number              | Expiry Date | CVV  | Result     |
| -------------------- | ------------------- | ----------- | ---- | ---------- |
| **Visa**             | 4111 1111 1111 1111 | 12/25       | 123  | ✅ Success |
| **Mastercard**       | 5555 5555 5555 4444 | 12/25       | 123  | ✅ Success |
| **American Express** | 3782 822463 10005   | 12/25       | 1234 | ✅ Success |

#### Failure Cases

| Card Type               | Number              | Expiry Date | CVV | Result       |
| ----------------------- | ------------------- | ----------- | --- | ------------ |
| **Visa (Declined)**     | 4000 0000 0000 0002 | 12/25       | 123 | ❌ Failed    |
| **Visa (Soft Decline)** | 4000 0000 0000 9995 | 12/25       | 123 | ⚠️ Try Again |

#### How to Use Test Cards

1. Open Razorpay Checkout on your frontend
2. Enter test card number
3. Enter any future expiry date
4. Enter any 3-4 digit CVV
5. Click Pay
6. Complete OTP (if prompted): **123456**

### Test UPI IDs

For testing UPI payments:

| UPI ID                 | Behavior                          |
| ---------------------- | --------------------------------- |
| `success@razorpay`     | ✅ Payment succeeds automatically |
| `failure@razorpay`     | ❌ Payment fails automatically    |
| `failure@razorpay.otp` | Requires OTP entry (use 123456)   |

#### How to Use Test UPI

1. Select **UPI** payment method in checkout
2. Enter test UPI ID
3. Click Submit
4. Payment succeeds/fails based on UPI ID

### Test Amounts

- Any amount can be used with test keys
- Amount in rupees (e.g., 100 = ₹100)
- No actual charges are deducted

---

## Key Management

### Best Practices

#### DO's ✅

1. **Store Keys Safely**
   - Keep in `.env` files
   - Use secret management services for production
   - Example: AWS Secrets Manager, HashiCorp Vault, Azure Key Vault

2. **Use Separate Keys**
   - Different keys for test and production
   - Different keys for different environments (dev, staging, prod)

3. **Rotate Keys Regularly**
   - Change keys every 3 months
   - Immediately after team member leaves
   - After any suspected compromise

4. **Monitor Key Usage**
   - Check Dashboard → Transactions regularly
   - Set up alerts for unusual activity
   - Review API logs

5. **Audit Trail**
   - Log all key regenerations
   - Document who has access to keys
   - Track key changes

#### DON'Ts ❌

1. **Never Expose Keys**
   - ❌ Don't commit `.env` files to git
   - ❌ Don't share via email or chat
   - ❌ Don't hardcode in source code
   - ❌ Don't put in comments or logs

2. **Don't Mix Environments**
   - ❌ Don't use test keys in production
   - ❌ Don't use live keys in development
   - ❌ Don't share production keys in development

3. **Don't Ignore Security**
   - ❌ Don't skip key rotation
   - ❌ Don't ignore suspicious transactions
   - ❌ Don't use weak passwords for dashboard

### If Your Key is Compromised

⚠️ **Immediate Action Required!**

1. **Regenerate Keys Immediately**
   - Go to: Dashboard → Settings → API Keys
   - Click **Regenerate** button
   - This invalidates the old key
   - You have 5 minutes to update your application

2. **Update All Environments**

   ```
   - Update .env.dev
   - Update .env.production
   - Update server environment variables
   - Update CI/CD secrets
   - Update all running instances
   ```

3. **Check for Fraud**
   - Go to: Dashboard → Transactions
   - Look for suspicious payments
   - Check refund history
   - Check webhook logs

4. **Contact Razorpay Support**
   - If you notice fraud
   - Provide transaction details
   - Razorpay can reverse fraudulent charges

5. **Audit Access**
   - Who had access to the key?
   - How was it compromised?
   - Can you improve security?

### Rotation Schedule

**Recommended Timeline:**

```
Development Keys
├─ Initial Setup: Every 6 months
├─ Team Changes: Immediately when team member leaves
└─ After Incidents: Immediately after any issue

Production Keys
├─ Initial Setup: Every 3 months
├─ Quarterly: First day of Q1, Q2, Q3, Q4
├─ Team Changes: Immediately when team member leaves
└─ After Incidents: Immediately after any incident
```

---

## Additional Configuration

### Enable Payment Methods

1. **Login to Dashboard**
   - Go to: https://dashboard.razorpay.com
   - Click: **Settings**

2. **Go to Payment Methods**
   - Select: **Payment Methods**
   - Or direct link: https://dashboard.razorpay.com/app/payment-methods

3. **Enable Desired Methods**
   - ✅ Cards (Visa, Mastercard, Amex)
   - ✅ UPI (India)
   - ✅ Net Banking
   - ✅ Wallets (PayTM, PhonePe, etc.)
   - ✅ EMI (Installments)

4. **Save Configuration**
   - Click Save/Update
   - Changes apply immediately

### Configure Business Settings

1. **Business Information**
   - Dashboard → Settings → Business Profile
   - Update logo, business name, description

2. **Notification Settings**
   - Dashboard → Settings → Notifications
   - Enable email notifications for payments
   - Set up SMS alerts (if available)

3. **Webhook Configuration**
   - See: `2-WEBHOOKS_GUIDE.md` for complete guide
   - Dashboard → Webhooks

### Monitor Transactions

1. **View All Transactions**
   - Dashboard → Transactions
   - Filter by date, amount, status

2. **Check Payment Details**
   - Click on any payment
   - View full details including:
     - Customer info
     - Payment method
     - Amount
     - Status
     - Fees

3. **Generate Reports**
   - Dashboard → Reports
   - Download transaction reports
   - Use for accounting/compliance

---

## Troubleshooting

### Common Issues

#### "Invalid API Key" Error

**Problem:** Getting error when trying to create order

**Solutions:**

1. Verify key is copied correctly (no extra spaces)
2. Check you're using the right environment:
   - Development: `rzp_test_...`
   - Production: `rzp_live_...`
3. Restart your server: `npm run dev`
4. Regenerate keys if still failing

#### "Key Secret Missing" Error

**Problem:** Server won't start, says RAZORPAY_KEY_SECRET is undefined

**Solutions:**

1. Check `.env.dev` or `.env.production` has `RAZORPAY_KEY_SECRET=`
2. Make sure `.env` file exists in `environment/` folder
3. Check file is saved (not just opened)
4. Restart server: `npm run dev`

#### Test Card Not Working

**Problem:** Test card declined even though it should work

**Solutions:**

1. Use correct test card number (copy from table above)
2. Use any future expiry date (e.g., 12/25)
3. Use any 3-4 digit CVV
4. Wait 30 seconds between payment attempts
5. Try different test card number

#### Can't Find Keys in Dashboard

**Problem:** Can't locate API Keys section

**Solutions:**

1. Make sure you're logged in
2. Go to: https://dashboard.razorpay.com/app/settings/api-keys
3. On left sidebar: Settings → API Keys
4. If still not visible, your account may not be verified
   - Complete KYC first (see Step 3 above)

---

## Quick Links

| Resource          | Link                                                 |
| ----------------- | ---------------------------------------------------- |
| **Sign Up**       | https://razorpay.com                                 |
| **Dashboard**     | https://dashboard.razorpay.com                       |
| **API Keys**      | https://dashboard.razorpay.com/app/settings/api-keys |
| **Webhooks**      | https://dashboard.razorpay.com/app/webhooks          |
| **Transactions**  | https://dashboard.razorpay.com/app/transactions      |
| **Documentation** | https://razorpay.com/docs/                           |
| **Support**       | https://razorpay.com/support/                        |

---

## Next Steps

1. ✅ Create Razorpay account
2. ✅ Complete KYC verification
3. ✅ Get API keys
4. ✅ Configure your application
5. ✅ Test with test credentials
6. 📖 Read `2-WEBHOOKS_GUIDE.md` for webhook setup (optional)
7. 🚀 Deploy to production with live keys

---

**Last Updated:** January 23, 2026
**Version:** 1.0
**Status:** Complete Setup Guide
