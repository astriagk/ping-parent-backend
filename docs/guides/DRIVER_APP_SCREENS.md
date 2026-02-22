# Driver App — Screen-by-Screen Development Guide

> A practical checklist for frontend developers building the Ping Parent mobile/web app for drivers.
> Each section = one screen. Scenarios are numbered and map to a specific API call.

---

## Authentication Flow

---

## Screen 1 — Send OTP (Register / Login)

### Description
Entry point for all drivers. Phone number input → OTP sent via SMS.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Driver enters phone number, taps "Send OTP" (new) | `POST /auth/register/send-otp` |
| 2 | Returning driver taps "Login" → enters phone, taps "Send OTP" | `POST /auth/login/send-otp` |
| 3 | Show error if phone number is invalid | — (client-side validation) |
| 4 | Show resend OTP timer (e.g. 30s cooldown) | — |

---

## Screen 2 — Verify OTP

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Driver enters OTP, taps "Verify" (new user) | `POST /auth/register/verify-otp` |
| 2 | Returning driver verifies OTP to login | `POST /auth/login/verify-otp` |
| 3 | Store JWT token on success | — |
| 4 | If new user → redirect to Onboarding (Profile Setup) | — |
| 5 | If existing, fully onboarded driver → redirect to Home | — |
| 6 | If existing but incomplete profile → redirect to Onboarding resume screen | — |
| 7 | Show error on wrong OTP | — |
| 8 | Resend OTP | `POST /auth/login/send-otp` |

---

## Onboarding Flow (New Driver)

---

## Screen 3 — Onboarding: Personal Info

### Description
Step 1 of driver onboarding. Basic personal details.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Check current onboarding progress/screen on load | `GET /driver/onboarding/screen` |
| 2 | Fill name, date of birth, gender, profile photo | `POST /driver/profile` (first time) |
| 3 | Save and advance to next onboarding step | `PUT /driver/onboarding/screen` (update progress) |

---

## Screen 4 — Onboarding: Address

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Fill home address (street, city, state, pincode) | `POST /driver/address` |
| 2 | Save and advance to next step | `PUT /driver/onboarding/screen` |

---

## Screen 5 — Onboarding: Vehicle & Documents

### Description
Driver uploads driving license, insurance, and vehicle details.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Fill vehicle details (type, registration number, model, year) | Part of `POST /driver/profile` or `PUT /driver/profile` |
| 2 | Upload driving license image | `POST /driver/documents` (with file upload) |
| 3 | Upload insurance document image | `POST /driver/documents` |
| 4 | Upload any other required documents | `POST /driver/documents` |
| 5 | Show upload progress indicator | — |
| 6 | Save and complete onboarding | `PUT /driver/onboarding/screen` (mark complete) |
| 7 | On completion → show "Pending Approval" screen | — |

---

## Screen 6 — Pending Approval

### Description
Shown after onboarding is complete, while admin reviews the driver's documents.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load driver profile to check approval status | `GET /driver/profile` |
| 2 | If status = `pending` → show "Under Review" message | From profile response |
| 3 | If status = `approved` → redirect to Home | — |
| 4 | If status = `rejected` → show rejection reason + edit documents option | From profile response |
| 5 | Driver updates rejected documents and resubmits | `PUT /driver/documents` |

---

## Main App Screens

---

## Screen 7 — Home / Dashboard

### Description
Main screen for an approved driver. Shows today's trips and availability toggle.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load driver profile (name, photo, approval status) | `GET /driver/profile` |
| 2 | Show active trip if one is in progress | `GET /trips/my-trips/active` |
| 3 | Show today's scheduled trips | `GET /trips/my-trips/by-date` (today's date) |
| 4 | Toggle availability (online/offline) | `PATCH /driver/availability` `{ available: true/false }` |
| 5 | Show current availability status | From profile response |
| 6 | Show unread notification badge | `GET /notifications/unread-count` |
| 7 | Tap active trip → go to Active Trip screen | — |
| 8 | Tap scheduled trip card → go to Trip Detail screen | — |

---

## Screen 8 — Profile

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load driver profile | `GET /driver/profile` |
| 2 | Edit name / photo / vehicle details → save | `PUT /driver/profile` |
| 3 | Load address | `GET /driver/address` |
| 4 | Edit address → save | `POST /driver/address` (creates or updates) |
| 5 | Toggle availability | `PATCH /driver/availability` |
| 6 | Logout → clear token, redirect to Login | `POST /auth/logout` |

---

## Screen 9 — My Documents

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all uploaded documents | `GET /driver/documents` |
| 2 | View document image (open URL from response) | From documents response |
| 3 | Upload new document | `POST /driver/documents` |
| 4 | Update / replace an existing document | `PUT /driver/documents` |
| 5 | Show document expiry dates if available | From documents response |
| 6 | Show approval status badge per document | From documents response |

---

## Screen 10 — My Trips (Trip List)

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all trips | `GET /trips/my-trips` |
| 2 | Filter trips by date | `GET /trips/my-trips/by-date?date=YYYY-MM-DD` |
| 3 | Show active trip at top | `GET /trips/my-trips/active` |
| 4 | Filter by status (active / completed / cancelled) | query params |
| 5 | Tap trip row → go to Trip Detail screen | — |
| 6 | Tap active trip → go to Active Trip screen | — |

---

## Screen 11 — Trip Detail (Pre-trip / Post-trip)

### Description
View details of a scheduled or completed trip (not actively running).

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load trip details (date, type: pickup/drop, status) | `GET /trips/:id` |
| 2 | Load students assigned to this trip | `GET /trip-students/trip/:tripId` |
| 3 | Load students with full details (name, address, photo) | `GET /trip-students/trip/:tripId/with-details` |
| 4 | Load students grouped by parent (for sibling handling) | `GET /trip-students/trip/:tripId/grouped-by-parent` |
| 5 | View completed trip summary with student + parent data | `GET /trips/:id/completed` |
| 6 | For pre-trip: tap "Start Trip" button → go to Active Trip screen | — |
| 7 | View route on map (post-trip) | `GET /tracking/:tripId/details` |

---

## Screen 12 — Create Trip

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Select trip type (pickup / drop) | — |
| 2 | Select date | — |
| 3 | System shows assigned students for that day | From assignments |
| 4 | Submit to create trip | `POST /trips` |
| 5 | On success → go to Active Trip screen or Trip Detail | — |

---

## Screen 13 — Active Trip (In-Progress)

### Description
The core screen during a live trip. Driver manages stops, marks pickups/drops, updates position.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load trip progress (for resume if app restarted mid-trip) | `GET /trips/:id/progress` |
| 2 | Load optimized route using free algorithm | `POST /tracking/calculate` |
| 3 | Load optimized route using TomTom (premium) | `POST /tracking/tomtom` |
| 4 | **Start trip** → update status to active | `PATCH /trips/:id/status` `{ status: "started" }` |
| 5 | Show map with route and all student stop markers | From route calculation response |
| 6 | Update driver GPS position every few seconds | `PATCH /tracking/:tripId/position` `{ lat, lng }` |
| 7 | Arrive at a student stop → load students for that stop | `GET /trip-students/trip/:tripId/with-details` |
| 8 | Mark student as **present** (attending today) | `PUT /trip-students/trip/:tripId/student/:studentId/attendance` |
| 9 | Mark student as **absent** | `PUT /trip-students/trip/:tripId/student/:studentId/attendance` `{ present: false }` |
| 10 | **Pickup student** at home (verify OTP/QR first) | `PUT /trip-students/trip/:tripId/student/:studentId/pickup` |
| 11 | **Bulk pickup** at parent's location (requires OTP scan) | `POST /trip-students/trip/:tripId/pickup-point` |
| 12 | **Drop student** at home | `PUT /trip-students/trip/:tripId/student/:studentId/drop` |
| 13 | **Bulk drop** at parent's location (requires OTP scan) | `POST /trip-students/trip/:tripId/pickup-point` |
| 14 | **Bulk pickup/drop at school** (no OTP needed) | `POST /trip-students/trip/:tripId/school-point` |
| 15 | Recalculate route from current position (e.g. after diversion) | `POST /tracking/:tripId/recalculate` |
| 16 | **Complete trip** → update status to completed | `PATCH /trips/:id/status` `{ status: "completed" }` |
| 17 | On trip complete → show summary screen | — |

---

## Screen 14 — Scan QR / Enter OTP

### Description
Driver scans parent's QR code or enters OTP to verify pickup/drop.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Open camera to scan parent's QR code | — (device camera) |
| 2 | Verify scanned QR code | `POST /daily-qr-otp/verify` |
| 3 | Alternatively, enter OTP manually | — |
| 4 | Verify manually entered OTP | `POST /daily-qr-otp/verify` |
| 5 | On success → record attendance and pickup/drop | `POST /daily-qr-otp/verify-attendance` |
| 6 | Show success confirmation with student name | From verify response |
| 7 | Show error if QR/OTP is wrong or expired | From error response |

---

## Screen 15 — Student Attendance View

### Description
Driver sees all students in the trip and can manage their status.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all students in the trip | `GET /trip-students/trip/:tripId` |
| 2 | Filter by attendance status (present / absent) | `GET /trip-students/trip/:tripId/attendance` |
| 3 | Filter by pickup status | `GET /trip-students/trip/:tripId/pickup` |
| 4 | Mark individual student attendance | `PUT /trip-students/trip/:tripId/student/:studentId/attendance` |
| 5 | Mark individual student pickup | `PUT /trip-students/trip/:tripId/student/:studentId/pickup` |
| 6 | Mark individual student drop | `PUT /trip-students/trip/:tripId/student/:studentId/drop` |
| 7 | View a specific trip-student record | `GET /trip-students/trip/:tripId/student/:studentId` |

---

## Screen 16 — Route Map

### Description
Displays the calculated route with stops. Used both pre-trip (planning) and during active trip.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Calculate optimal route before starting trip | `POST /tracking/calculate` |
| 2 | Calculate route with TomTom Matrix API (if enabled) | `POST /tracking/tomtom` |
| 3 | Display route polyline + numbered stop markers on map | From route response |
| 4 | Show estimated distance + time for each stop | From route response |
| 5 | During trip: update driver position on map | `PATCH /tracking/:tripId/position` |
| 6 | During trip: recalculate from current position | `POST /tracking/:tripId/recalculate` |
| 7 | View tracking history (post-trip playback) | `GET /tracking/:tripId/tracking` |
| 8 | View route geometry + waypoints | `GET /tracking/:tripId/details` |

---

## Screen 17 — My Assignments

### Description
Driver views students assigned to them and manages assignment requests.

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all assignments | `GET /driver-student-assignments/driver/my-assignments` |
| 2 | Load pending assignments (awaiting driver approval) | `GET /driver-student-assignments/driver/my-pending-assignments` |
| 3 | Load active assignments | `GET /driver-student-assignments/driver/my-active-assignments` |
| 4 | Load parent-requested assignments | `GET /driver-student-assignments/driver/my-parent-requested` |
| 5 | **Approve assignment** | `POST /driver-student-assignments/:id/approve` |
| 6 | **Reject assignment** (with reason) | `POST /driver-student-assignments/:id/reject` |
| 7 | **Deactivate assignment** (no longer serving this student) | `POST /driver-student-assignments/:id/deactivate` |

> Build two tabs: **Active Assignments** and **Pending / Requests**.

---

## Screen 18 — Notifications

### Scenarios to implement

| # | Scenario | API |
|---|----------|-----|
| 1 | Load all notifications (paginated) | `GET /notifications` |
| 2 | Load only unread notifications | `GET /notifications/unread` |
| 3 | Show unread count badge in header | `GET /notifications/unread-count` |
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
| 4 | Block access to main app if driver is not approved | Check approval status from profile |
| 5 | Resume mid-trip if app is killed / restarted | `GET /trips/:id/progress` on app start |
| 6 | Show loading skeleton while data loads | All list/detail screens |
| 7 | Show empty state when list returns 0 results | All list screens |
| 8 | Show confirm dialog before destructive actions | Reject assignment, deactivate |
| 9 | Show toast on success / error | All write operations |
| 10 | Background location updates during active trip | OS background location service → `PATCH /tracking/:tripId/position` |
| 11 | Keep screen awake during active trip | OS wake lock |

---

## Screen Flow Summary

```
Send OTP
  └── Verify OTP
        ├── New Driver → Onboarding
        │     ├── Personal Info
        │     ├── Address
        │     ├── Vehicle & Documents
        │     └── Pending Approval
        │           ├── Approved → Home
        │           └── Rejected → Re-upload Documents
        └── Existing Approved Driver → Home

Home
  ├── Active Trip → Active Trip Screen
  │     ├── Scan QR / OTP
  │     ├── Student Attendance View
  │     └── Route Map
  ├── My Trips (Trip List)
  │     ├── Create Trip
  │     └── Trip Detail
  ├── My Assignments
  │     └── Approve / Reject
  ├── Notifications
  ├── Profile
  │     └── My Documents
  └── Route Map (pre-trip planning)
```
