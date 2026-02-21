# Parent App — Screen-by-Screen Development Guide

> A practical checklist for frontend developers building the Ping Parent mobile/web app for parents.
> Each section = one screen. Scenarios are numbered and map to a specific API call.

---

## Authentication Flow

---

## Screen 1 — Send OTP (Register / Login)

### Description
Entry point for all parents. Phone number input → OTP sent via SMS.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Parent enters phone number, taps "Send OTP" | `POST /auth/register/send-otp` (new user) |
| 2 | Returning parent taps "Login" → enters phone, taps "Send OTP" | `POST /auth/login/send-otp` |
| 3 | Show error if phone number is invalid | — (client-side validation) |
| 4 | Show resend OTP timer (e.g. 30s cooldown) | — |

---

## Screen 2 — Verify OTP

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Parent enters 4/6-digit OTP, taps "Verify" (new user) | `POST /auth/register/verify-otp` |
| 2 | Returning parent verifies OTP to login | `POST /auth/login/verify-otp` |
| 3 | Store JWT token on success | — |
| 4 | If new user → redirect to Profile Setup | — |
| 5 | If existing user → redirect to Home / Dashboard | — |
| 6 | Show error on wrong OTP | — |
| 7 | Resend OTP button (calls send-otp again) | `POST /auth/login/send-otp` |

---

## Screen 3 — Profile Setup (New User Onboarding)

### Description
Shown only once for new users after OTP verification.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Parent fills name, email, profile photo | `PUT /parent/profile` |
| 2 | Parent enters home address | `PUT /parent/address` |
| 3 | On save → redirect to Add Child screen | — |

---

## Main App Screens

---

## Screen 4 — Home / Dashboard

### Description
Main landing screen showing active trip status for children.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Show list of children with their current trip status | `GET /parent/trips/active` |
| 2 | Show "Driver on the way" / "In trip" / "Dropped off" status per child | From active trip response |
| 3 | Tap child card → open Live Tracking screen | — |
| 4 | Show driver name + vehicle info for active trip | From active trip response |
| 5 | Show unread notification badge in header | `GET /notifications/unread-count` |
| 6 | If no active trip → show "No active trip" empty state | — |

---

## Screen 5 — Profile

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load parent profile (name, phone, email, photo) | `GET /parent/profile` |
| 2 | Edit name / email / photo → save | `PUT /parent/profile` |
| 3 | Load address details | `GET /parent/address` |
| 4 | Edit address → save | `PUT /parent/address` |
| 5 | Logout button → clear token, redirect to Login | `POST /auth/logout` |

---

## Screen 6 — My Children (Students List)

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all children | `GET /students/my-students` |
| 2 | Load only active children | `GET /students/my-active-students` |
| 3 | Tap child → go to Child Detail screen | — |
| 4 | Tap "Add Child" button → go to Add Child screen | — |

---

## Screen 7 — Add / Edit Child

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Fill child form (name, grade, school, photo) → save (new) | `POST /students` |
| 2 | Load existing child details for editing | `GET /students/by-student-id/:student_id` |
| 3 | Update child details → save | `PUT /students/by-student-id/:student_id` |
| 4 | Delete child (confirm dialog) | `DELETE /students/by-student-id/:student_id` |

---

## Screen 8 — Child Detail

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load child profile | `GET /students/by-student-id/:student_id` |
| 2 | View child's assigned driver | From assignment — `GET /driver-student-assignments/student/:studentId` |
| 3 | View child's trip history | Via parent trips — `GET /parent/trips?studentId=<id>` |
| 4 | Tap "Edit" → go to Edit Child screen | — |
| 5 | Tap "Delete" → confirm + delete | `DELETE /students/by-student-id/:student_id` |

---

## Screen 9 — Live Tracking

### Description
Real-time map showing driver's current position during an active trip.

### Scenarios to implement

| # | Scenario | API / Socket |
|---|----------|-----|
| 1 | Load initial driver position on map | `GET /tracking/:tripId/current-position` |
| 2 | Load route geometry + waypoints on map | `GET /tracking/:tripId/details` |
| 3 | Subscribe to real-time position updates | Socket.IO — `trip:position_update` |
| 4 | Show driver marker moving on map as updates arrive | Socket.IO |
| 5 | Show ETA / distance remaining (if available in response) | From tracking details |
| 6 | Show list of students with pickup/drop status | From trip details |
| 7 | Unsubscribe from socket on screen leave | — |

---

## Screen 10 — Trip History

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all trips for parent's children | `GET /parent/trips` |
| 2 | Filter trips by date range | query params |
| 3 | Show trip status (completed / cancelled) | From response |
| 4 | Tap trip row → go to Trip Detail screen | — |

---

## Screen 11 — Trip Detail

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load trip info (driver, date, type: pickup/drop, status) | From trip list response |
| 2 | Show students in the trip with their attendance status | From trip detail |
| 3 | Show route on map (static, post-trip) | `GET /tracking/:tripId/details` |
| 4 | Show tracking history playback | `GET /tracking/:tripId/tracking` |
| 5 | Show timeline of trip events | From tracking details |
| 6 | Show "Rate this driver" button if trip is completed and not yet rated | — |

---

## Screen 12 — QR / OTP Code

### Description
Parent shows this code to the driver at pickup/drop point for verification.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Generate QR/OTP for a specific child's trip | `GET /daily-qr-otp/parent/student/:studentId/trip/:tripId` |
| 2 | Generate a single OTP for all children in the same trip | `GET /daily-qr-otp/parent/trip/:tripId` |
| 3 | Display QR code as scannable image | From response (QR image URL or data) |
| 4 | Display OTP as large readable text (alternative to QR) | From response |
| 5 | Show expiry countdown on the OTP | From response (expires_at field) |
| 6 | Auto-refresh QR/OTP when it expires | Re-call the generate endpoint |

---

## Screen 13 — Driver Assignment

### Description
Parent can request a driver to be assigned to their child, and view current assignments.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load available drivers list | `GET /driver-student-assignments/all-drivers` |
| 2 | Select a driver + child → submit assignment request | `POST /driver-student-assignments` |
| 3 | View current assignment for a child | `GET /driver-student-assignments/student/:studentId` |
| 4 | View assignment details | `GET /driver-student-assignments/:id` |
| 5 | Update assignment | `PUT /driver-student-assignments/:id` |
| 6 | Cancel / delete assignment (confirm dialog) | `DELETE /driver-student-assignments/:id` |
| 7 | Show assignment status (pending / approved / rejected) | From assignment response |

---

## Screen 14 — Subscription Plans (Browse)

### Description
View all available plans before subscribing.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all active subscription plans | `GET /subscription-plans` |
| 2 | Display plan cards with badge, price, features, type | From plans response |
| 3 | Tap plan → show plan detail / pricing breakdown | `GET /subscription-plans/:id` |
| 4 | Show recommended plan based on number of children | `GET /parent-subscriptions/recommendations` |
| 5 | Tap "Subscribe" on a plan → go to Payment screen | — |

---

## Screen 15 — My Subscription

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load active subscription details | `GET /parent-subscriptions/my-active-subscription` |
| 2 | Load full subscription details (schools, drivers, payments) | `GET /parent-subscriptions/my-subscription-details` |
| 3 | Load all past/current subscriptions | `GET /parent-subscriptions/my-subscriptions` |
| 4 | Show subscription status (active / expired / cancelled) | From response |
| 5 | Show expiry date with alert if near expiry | From response |
| 6 | **Upgrade subscription** button → select new plan → pay | `POST /parent-subscriptions/upgrade` |
| 7 | **Cancel subscription** (confirm dialog) | `POST /parent-subscriptions/:id/cancel` |
| 8 | If no subscription → show "Browse Plans" CTA | — |

---

## Screen 16 — Redeem School Code

### Description
Parent enters a code provided by the school to activate a school-sponsored subscription.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Check active redemption status | `GET /redemptions/status/check` |
| 2 | Enter redemption code → tap "Redeem" | `POST /redemptions/redeem` |
| 3 | Show success with subscription details | From response |
| 4 | Show error if code is invalid / already used | From error response |
| 5 | View active redemption subscription | `GET /redemptions/active` |
| 6 | View all redemption subscriptions | `GET /redemptions` |
| 7 | View redemption detail by subscription ID | `GET /redemptions/:subscriptionId` |
| 8 | Cancel redemption subscription | `POST /redemptions/cancel` |

---

## Screen 17 — Payment / Checkout

### Description
Razorpay payment flow for subscribing to a plan.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Create a Razorpay order before opening the payment sheet | `POST /razorpay/orders` |
| 2 | Open Razorpay payment sheet with the order details | Razorpay SDK (uses order from step 1) |
| 3 | On payment success → verify + complete | `POST /razorpay/verify` |
| 4 | On payment capture | `POST /razorpay/capture` |
| 5 | Subscribe the parent to the chosen plan after successful payment | `POST /parent-subscriptions` |
| 6 | Show success screen with subscription summary | — |
| 7 | Show failure screen with retry option | — |
| 8 | Fetch Razorpay config (key_id) for SDK initialization | `GET /razorpay/config` |

---

## Screen 18 — Payment History

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all payments | `GET /payments/my-payments` |
| 2 | Load pending payments | `GET /payments/my-payments/pending` |
| 3 | Load completed payments | `GET /payments/my-payments/completed` |
| 4 | Tap payment row → view payment detail | `GET /payments/:id` |
| 5 | View Razorpay order details for a payment | `GET /razorpay/orders/:orderId` |
| 6 | View Razorpay payment details | `GET /razorpay/payments/:paymentId` |
| 7 | Request refund (if eligible) | `POST /payments/:id/refund` |

---

## Screen 19 — Rate Driver

### Description
Shown after a completed trip. Parent rates and reviews the driver.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Submit star rating + review text for a driver | `POST /ratings-reviews` |
| 2 | Load parent's existing reviews | `GET /ratings-reviews/my-reviews` |
| 3 | View a specific review | `GET /ratings-reviews/:id` |
| 4 | Edit an existing review | `PUT /ratings-reviews/:id` |
| 5 | Delete a review (confirm dialog) | `DELETE /ratings-reviews/:id` |
| 6 | View driver's average rating (read-only display) | `GET /ratings-reviews/driver/:driverId/rating` |

---

## Screen 20 — Notifications

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all notifications (paginated) | `GET /notifications` |
| 2 | Load only unread notifications | `GET /notifications/unread` |
| 3 | Show unread count badge | `GET /notifications/unread-count` |
| 4 | Tap notification → mark as read + navigate to relevant screen | `PUT /notifications/:id/mark-as-read` |
| 5 | "Mark all as read" button | `PUT /notifications/mark-all-as-read` |
| 6 | Show empty state if no notifications | — |

---

## Cross-Cutting Scenarios

| # | Scenario | Notes |
|---|----------|-------|
| 1 | Redirect to OTP Login on 401 response | Global axios/fetch interceptor |
| 2 | Store JWT securely (AsyncStorage / SecureStore) | On login success |
| 3 | Attach JWT as `Authorization: Bearer <token>` on all requests | Axios request interceptor |
| 4 | Show loading skeleton while data loads | All list/detail screens |
| 5 | Show empty state when list returns 0 results | All list screens |
| 6 | Show confirm dialog before destructive actions (delete, cancel) | Delete child, cancel subscription |
| 7 | Show toast on success / error | All write operations |
| 8 | Handle Socket.IO connect/disconnect lifecycle | Live Tracking screen |
| 9 | Deep link from push notification → correct screen | Notifications |

---

## Screen Flow Summary

```
Send OTP
  └── Verify OTP
        ├── New User → Profile Setup → Add Child → Home
        └── Existing User → Home

Home
  ├── Live Tracking (active trip)
  ├── My Children
  │     ├── Add/Edit Child
  │     └── Child Detail → Trip History
  ├── QR / OTP Code (during active trip)
  ├── Driver Assignment
  ├── Subscriptions
  │     ├── Browse Plans → Checkout → My Subscription
  │     └── Redeem School Code
  ├── Payment History
  ├── Rate Driver (post-trip)
  ├── Notifications
  └── Profile
```
