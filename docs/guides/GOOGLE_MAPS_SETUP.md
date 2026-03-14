# Google Maps API Setup Guide

**Version**: 1.0.0  
**Last Updated**: March 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Create Google Cloud Project](#create-google-cloud-project)
3. [Enable Required APIs](#enable-required-apis)
4. [Create API Key](#create-api-key)
5. [Restrict API Key (Production)](#restrict-api-key-production)
6. [Configure Backend](#configure-backend)
7. [Verify Setup](#verify-setup)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Ping Parent uses **Google Maps Directions API** for:

- Route optimization with waypoint sequencing
- Distance and duration calculations
- Traffic-aware routing

This guide walks you through obtaining and configuring a Google Maps API key for your backend.

---

## Create Google Cloud Project

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### Step 2: Create a New Project

1. Click the **project dropdown** at the top-left (next to "Google Cloud")
2. Click **NEW PROJECT**
3. Enter a project name (e.g., `Ping Parent` or `Ping Parent Backend`)
4. Leave the organization blank (unless using a corporate Google account)
5. Click **CREATE**

The project will take a few moments to initialize. Once ready, you'll see it selected in the dropdown.

**Alternative:** Use the [Quick Setup Link](https://console.cloud.google.com/projectcreate)

---

## Enable Required APIs

### Step 1: Navigate to APIs & Services

1. In the Google Cloud Console, click the **menu icon** (☰) in the top-left
2. Go to **APIs & Services** → **Library**

### Step 2: Enable Directions API

1. Search for `Directions API`
2. Click on the result
3. Click **ENABLE**
4. Wait for confirmation (page will show "API enabled")

### Step 3: Enable Optional APIs (Recommended)

For additional functionality, also enable:

#### Distance Matrix API (for distance calculations)

- Search: `Distance Matrix API`
- Click **ENABLE**

#### Maps Static API (for static map images)

- Search: `Maps Static API`
- Click **ENABLE**

**Note:** Your backend specifically uses the **Directions API**. The others are optional but useful for extended features.

---

## Create API Key

### Step 1: Navigate to Credentials

1. Go to **APIs & Services** → **Credentials** (in the left sidebar)

### Step 2: Create API Key

1. Click **+ CREATE CREDENTIALS** at the top
2. Select **API Key** from the dropdown
3. A dialog box will appear with your new API key
4. Copy the key to your clipboard
5. Click **CLOSE**

The key will now appear in the **API keys** section in a table.

**Example key format:**

```
AIzaSyDvBLAzn0yGc6E4pqJ8n9k0v1a2b3c4d5e6f
```

---

## Restrict API Key (Production)

### Why Restrict?

Unrestricted API keys are vulnerable to:

- Quota theft
- Unauthorized API calls
- Billing overages

### Step 1: Open Your API Key

1. In **APIs & Services** → **Credentials**
2. Under **API keys**, click on your key name
3. A detailed view will open

### Step 2: Set API Restrictions

1. Scroll to **API restrictions**
2. Select **Restrict key**
3. Check the APIs enabled earlier:
   - ✅ Directions API
   - ✅ Distance Matrix API (if enabled)
   - ✅ Maps Static API (if enabled)
4. Save the changes

### Step 3: Set Application Restrictions

**For Backend (Development & Production):**

1. Scroll to **Application restrictions**
2. Select **IP addresses (IPv4)**
3. Enter your backend server's IP address(es):
   - **Development:** Your local machine IP or dev server IP
   - **Production:** Your production server's public IP
4. Click **DONE**
5. Save the key

**Obtaining Your IP:**

```bash
# Windows PowerShell
Resolve-DnsName -Name whoami.cloudflarestat.com | Select-Object IP4Address

# Or visit
https://whatismyipaddress.com/
```

**For Android/iOS Apps (Optional):**

If you also have mobile apps:

1. Select **Android apps** or **iOS apps**
2. Add your app's package name and certificate fingerprint
3. Save the key

### Step 4: Save

Click **SAVE** at the bottom of the page.

---

## Configure Backend

### Step 1: Add to Environment File

Open your environment configuration file:

**For Development:**

```bash
# environment/.env.dev
GOOGLE_MAPS_API_KEY=AIzaSyDvBLAzn0yGc6E4pqJ8n9k0v1a2b3c4d5e6f
```

**For Production:**

```bash
# environment/.env.prod
GOOGLE_MAPS_API_KEY=AIzaSyDvBLAzn0yGc6E4pqJ8n9k0v1a2b3c4d5e6f
```

Replace `AIzaSyDvBLAzn0yGc6E4pqJ8n9k0v1a2b3c4d5e6f` with your actual API key.

### Step 2: Verify File Permissions

Ensure the environment file is in `.gitignore`:

```bash
# .gitignore
environment/.env.dev
environment/.env.prod
```

**Never commit API keys to version control.**

### Step 3: Restart Backend

Reload the backend to pick up the new environment variable:

```bash
npm run dev
```

Or if running in production:

```bash
npm run build
npm start:prod
```

---

## Verify Setup

### Step 1: Check Backend Logs

Start the development server and look for startup logs:

```bash
npm run dev
```

Expected output:

```
[INFO] Server started on port 5000
[INFO] MongoDB connected
[INFO] Google Maps API initialized
```

### Step 2: Test Directions Endpoint

Make a test request to verify the API works:

```bash
curl -X POST http://localhost:5000/api/trips/directions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "start_latitude": 28.7041,
    "start_longitude": 77.1025,
    "waypoints": [
      {"latitude": 28.7128, "longitude": 77.1059}
    ]
  }'
```

Expected response (successful):

```json
{
  "success": true,
  "data": {
    "sequence": [0],
    "totalDistance": 1234,
    "totalDuration": 456,
    "coordinates": [
      [77.1025, 28.7041],
      [77.1059, 28.7128]
    ]
  }
}
```

### Step 3: Check Google Cloud Console

Verify API usage in the Google Cloud Console:

1. Go to **APIs & Services** → **Dashboard**
2. Look for **Directions API** in the list
3. You should see recent request activity (may take a few minutes to appear)

---

## Troubleshooting

### Issue: "GOOGLE_MAPS_API_KEY not configured"

**Solution:**

1. Check that `environment/.env.dev` (or `.env.prod`) contains `GOOGLE_MAPS_API_KEY`
2. Verify the key is not empty or malformed
3. Restart the backend: `npm run dev`

### Issue: "REQUEST_DENIED" or "INVALID_REQUEST" Error

**Possible causes:**

1. **API not enabled** → Go to APIs & Services → Library and enable Directions API
2. **Wrong API key** → Copy-paste carefully from the Credentials page
3. **API key restricted to different IPs** → If you restricted to specific IPs, ensure your server's IP is in the allowlist
4. **Quota exceeded** → Check your API usage and quotas in the Google Cloud Console

**Solution:**

- Check [API quotas](https://console.cloud.google.com/apis/dashboard)
- Review **Directions API** requests for errors
- Click on the API to see detailed error logs

### Issue: HTTP 403 "Forbidden" Error

**Error message:** `Request failed with status code 403`

**Possible causes:**

1. **Directions API not enabled** → The API is not enabled on your project
2. **Billing not enabled** → Google Cloud requires a billing account for most APIs
3. **API key restricted to specific IPs** → Your server's IP is not in the allowlist
4. **API key restricted to wrong app type** → If you set application restrictions, they may not match your backend
5. **API key has no permissions** → API was restricted but Directions API was not selected

**Solution (Complete Checklist):**

1. **Enable Billing** (Required):
   - Go to [Google Cloud Console Billing](https://console.cloud.google.com/billing)
   - Click **Manage billing accounts**
   - Ensure you have an active billing account with a payment method on file
   - Link it to your project if not already linked

2. **Verify Directions API is Enabled:**
   - Go to **APIs & Services** → **Library**
   - Search for `Directions API`
   - Click on it
   - Verify the **ENABLE** button is greyed out (meaning it's enabled)
   - If not enabled, click **ENABLE**

3. **Check API Key Restrictions:**
   - Go to **APIs & Services** → **Credentials**
   - Click on your API key
   - Scroll to **API restrictions**
   - Verify **Directions API** is checked (not restricted from this API)
   - If you see "Restrict key", click it and select **Directions API**

4. **Check Application Restrictions:**
   - In the same API key page, scroll to **Application restrictions**
   - If set to **IP addresses**, verify your backend server's IP is listed
   - If set to **Android apps** or **iOS apps**, change it to **None** for backend testing
   - For production backend, restrict to **IP addresses** and enter your server IP

5. **Restart Backend:**

   ```bash
   npm run dev
   ```

6. **Test Again** with the route calculation to verify the 403 is resolved

**Quick Fix for Development:**

If you need to test quickly:

1. Go to your API key in **Credentials**
2. Under **Application restrictions**, select **None** temporarily
3. Restart the backend
4. Test the route calculation
5. Once working, restrict the key properly for production

### Issue: "OVER_QUERY_LIMIT" Error

**Cause:** Your API has exceeded its quota for the billing period.

**Solution:**

1. Check your [Billing](https://console.cloud.google.com/billing) account
2. Verify you have a payment method on file
3. Enable billing if not already enabled
4. Increase quotas if needed in **APIs & Services** → **Quotas**

### Issue: "ZERO_RESULTS"

**Cause:** The route calculation returned no valid route (likely an invalid coordinate or geographic issue).

**Solution:**

1. Verify your start and waypoint coordinates are valid (lat between -90 to 90, lon between -180 to 180)
2. Ensure waypoints are reachable by road
3. Check the route doesn't exceed 25 waypoints (Directions API limit)

### Issue: Slow Response Times

**Cause:** Traffic model or excessive waypoints.

**Solution:**

1. Reduce the number of waypoints (keep under 25)
2. Use `traffic_model: "best_guess"` instead of `"pessimistic"` if not needed
3. Set a `departure_time` to avoid real-time traffic queries

---

## Best Practices

### 1. Use Environment Variables

- Never hardcode API keys
- Always load from `environment/.env.*`

### 2. Rotate Keys Periodically

- Every 6-12 months, generate a new key
- Update your backend config
- Delete the old key from the Google Cloud Console

### 3. Monitor Quotas

- Regularly check [API quotas](https://console.cloud.google.com/apis/dashboard)
- Set up billing alerts in Google Cloud Console

### 4. Restrict in Production

- Always use IP restrictions for production keys
- Use separate keys for dev and production

### 5. Cache Results

- Cache route calculations when possible
- Reduce redundant API calls

---

## Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Directions API Documentation](https://developers.google.com/maps/documentation/directions/overview)
- [API Quotas Documentation](https://cloud.google.com/docs/quota)
- [Google Cloud Pricing](https://cloud.google.com/maps-platform/pricing)

---

## Support

For issues with:

- **Google Cloud setup** → [Google Cloud Support](https://cloud.google.com/support)
- **Backend integration** → Check backend logs or contact the development team
- **API documentation** → [Google Maps API Reference](https://developers.google.com/maps/documentation)
