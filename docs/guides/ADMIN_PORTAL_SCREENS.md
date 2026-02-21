# Admin Portal — Screen-by-Screen Development Guide

> A practical checklist for frontend developers. Each section = one screen/page.
> Roles: **SA** = Super Admin, **A** = Admin, **SchA** = School Admin

---

## Legend

| Symbol | Meaning |
|--------|---------|
| SA + A | Both Super Admin and Admin |
| SchA | School Admin only |
| SA only | Super Admin only |
| — | Not accessible |

---

## Screen 1 — Login

### Who accesses it
- `SA + A` → Admin login page
- `SchA` → Separate School Admin login page (different route/portal)

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Admin enters email + password, clicks Login | SA + A | `POST /admin/login` |
| 2 | School Admin enters email + password, clicks Login | SchA | `POST /school-admin/login` |
| 3 | Show error on wrong credentials | All | — |
| 4 | Store JWT token after successful login | All | — |
| 5 | Redirect to Dashboard after login | All | — |

> **Note:** Keep the two login flows on separate pages or separate portals. After login, decode the token to read the role and scope all subsequent requests accordingly.

---

## Screen 2 — Dashboard

### Who accesses it
All roles, but data scope differs.

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Show total parents count | SA + A | `GET /admin/users?role=parent` |
| 2 | Show total drivers count | SA + A | `GET /admin/users?role=driver` |
| 3 | Show total students count | SA + A | `GET /admin/users?role=student` |
| 4 | Show school-scoped user counts | SchA | `GET /admin/users` (scoped) |
| 5 | Show active trips count | SA + A | `GET /trips/admin/all-trips?status=active` |
| 6 | Show school trips count | SchA | `GET /trips/admin/all-trips` (scoped) |
| 7 | Show revenue this month | SA + A | `GET /payments/admin/all-payments` |
| 8 | Show subscription stats | SA + A | `GET /parent-subscriptions/admin/all-subscriptions` |
| 9 | Show pending driver approval count (badge) | SA + A + SchA | `GET /admin/users?role=driver&status=pending` |
| 10 | Show expiring subscriptions alert | SA + A + SchA | `GET /parent-subscriptions/admin/all-subscriptions?status=expiring` |
| 11 | Show recent activity feed / recent trips table | SA + A | `GET /trips/admin/all-trips` |

### Dashboard cards to build
- Total Parents
- Total Drivers (with pending approval badge)
- Total Students
- Active Trips
- Revenue (this month)
- Pending Driver Approvals

### Charts to build
- Trips over time (line chart)
- Revenue trend (bar chart)
- Subscriptions by plan type (pie/donut)

---

## Screen 3 — Parents List

### Who accesses it
SA + A (all parents), SchA (school-scoped parents).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all parents (paginated) | SA + A | `GET /admin/users?role=parent` |
| 2 | List school-scoped parents | SchA | `GET /admin/users?role=parent&schoolId=<id>` |
| 3 | Search / filter parents | SA + A + SchA | query params on the same endpoint |
| 4 | Click parent row → go to Parent Detail page | All | — |
| 5 | Activate parent account | SA + A | `PATCH /admin/users/:id/activate` |
| 6 | Deactivate parent account | SA + A | `PATCH /admin/users/:id/deactivate` |
| 7 | Delete parent | SA + A | `DELETE /admin/users/:id` |

---

## Screen 4 — Parent Detail

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load full parent profile | SA + A + SchA | `GET /admin/parents/:id/details` |
| 2 | Show linked students list | SA + A + SchA | included in profile or `GET /admin/users/:id` |
| 3 | Show parent's subscriptions | SA + A + SchA | `GET /parent-subscriptions/admin/all-subscriptions?parentId=<id>` |
| 4 | Show parent's payments | SA + A | `GET /payments/admin/all-payments?parentId=<id>` |
| 5 | Activate / Deactivate button | SA + A | `PATCH /admin/users/:id/activate` or `deactivate` |
| 6 | Delete button (with confirm dialog) | SA + A | `DELETE /admin/users/:id` |

---

## Screen 5 — Drivers List

### Who accesses it
SA + A (all drivers), SchA (school-scoped drivers).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all drivers (paginated) | SA + A | `GET /admin/users?role=driver` |
| 2 | List school-scoped drivers | SchA | `GET /admin/users?role=driver&schoolId=<id>` |
| 3 | Filter by approval status (pending / approved / rejected) | All | query params |
| 4 | Show pending approval count as badge on menu | All | — |
| 5 | Click driver row → go to Driver Detail page | All | — |
| 6 | Activate driver | SA + A | `PATCH /admin/users/:id/activate` |
| 7 | Deactivate driver | SA + A | `PATCH /admin/users/:id/deactivate` |
| 8 | Delete driver | SA + A | `DELETE /admin/users/:id` |

---

## Screen 6 — Driver Detail / Approval

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load full driver profile + documents | All | `GET /admin/drivers/:id/details` |
| 2 | View uploaded documents (license, insurance) — open/download | All | Use document URLs from detail response |
| 3 | **Approve driver** | SA + A + SchA | `PATCH /admin/drivers/:id/approval-status` `{ status: "approved" }` |
| 4 | **Reject driver** (with reason text field) | SA + A + SchA | `PATCH /admin/drivers/:id/approval-status` `{ status: "rejected", reason: "..." }` |
| 5 | View driver's trip history | All | `GET /trips/admin/all-trips?driverId=<id>` |
| 6 | View driver ratings & reviews | All | `GET /ratings-reviews/driver/:driverId` |
| 7 | View driver average rating | All | `GET /ratings-reviews/driver/:driverId/rating` |
| 8 | Activate / Deactivate driver | SA + A | `PATCH /admin/users/:id/activate` or `deactivate` |
| 9 | Delete driver (confirm dialog) | SA + A | `DELETE /admin/users/:id` |

---

## Screen 7 — Students List

### Who accesses it
SA + A (all students), SchA (school-scoped students).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all students (paginated) | SA + A | `GET /admin/users?role=student` |
| 2 | List school-scoped students | SchA | `GET /admin/users?role=student&schoolId=<id>` |
| 3 | Filter / search students | All | query params |
| 4 | Click student row → go to Student Detail page | All | — |

---

## Screen 8 — Student Detail

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load student profile | All | `GET /admin/users/:id` |
| 2 | View student's trip history | All | `GET /trips/admin/all-trips?studentId=<id>` |

---

## Screen 9 — Admin Management

### Who accesses it
SA + A only (SchA has no access).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all admins | SA + A | `GET /admin/` |
| 2 | **Create new Admin** (email, name, password, role) | SA + A | `POST /admin/` `{ role: "admin" }` |
| 3 | **Create Super Admin** | SA only | `POST /admin/setup/create-superadmin` |
| 4 | View admin detail | SA + A | `GET /admin/by-admin-id/:admin_id` |
| 5 | **Update admin** info | SA + A | `PUT /admin/by-admin-id/:admin_id` |
| 6 | **Activate admin** | SA + A | `PATCH /admin/by-admin-id/:admin_id/activate` |
| 7 | **Deactivate admin** | SA + A | `PATCH /admin/by-admin-id/:admin_id/deactivate` |

> **SA-only gate:** Hide the "Create Super Admin" button for Admin role users.

---

## Screen 10 — Schools List

### Who accesses it
SA + A (all schools), SchA (own school only).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all schools | SA + A | `GET /schools/` |
| 2 | SchA sees only their school | SchA | `GET /schools/` (filtered by token) |
| 3 | **Create school** (name, address, contact, logo) | SA + A | `POST /schools/admin` |
| 4 | Click school row → go to School Detail page | All | — |
| 5 | **Update school** info | SA + A + SchA (own) | `PUT /schools/admin/:school_id` |
| 6 | **Delete school** (confirm dialog) | SA + A | `DELETE /schools/admin/:school_id` |

---

## Screen 11 — School Detail

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load school info | All | `GET /schools/` (find by id) |
| 2 | View school admins list | SA + A | `GET /school-admin/:schoolId` |
| 3 | **Create School Admin** for this school | SA + A | `POST /school-admin/register` `{ schoolId, name, email, password }` |
| 4 | **Deactivate School Admin** | SA + A | `POST /school-admin/:adminId/deactivate` |
| 5 | View school drivers list | All | `GET /school-driver/:schoolId` |
| 6 | **Assign driver to school** | SA + A + SchA (own) | `POST /school-driver/assign` `{ schoolId, driverId }` |
| 7 | **Remove driver from school** | SA + A + SchA (own) | `POST /school-driver/:driverId/remove` |
| 8 | View driver details from this list | All | `GET /school-driver/:driverId/details` |

---

## Screen 12 — School Admins List (standalone page)

### Who accesses it
SA + A only.

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List school admins for a given school | SA + A | `GET /school-admin/:schoolId` |
| 2 | **Register school admin** | SA + A | `POST /school-admin/register` |
| 3 | **Deactivate school admin** | SA + A | `POST /school-admin/:adminId/deactivate` |

---

## Screen 13 — Trips List

### Who accesses it
SA + A (all trips), SchA (school-scoped trips).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all trips (paginated) | SA + A | `GET /trips/admin/all-trips` |
| 2 | List school-scoped trips | SchA | `GET /trips/admin/all-trips` (scoped) |
| 3 | Filter by status (active / completed / cancelled) | All | `?status=active` |
| 4 | Filter by date range | All | `?startDate=&endDate=` |
| 5 | Filter by driver | All | `?driverId=` |
| 6 | Click trip row → go to Trip Detail page | All | — |

---

## Screen 14 — Trip Detail

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load trip info (driver, date, status, type) | All | `GET /trips/admin/all-trips` (by id) |
| 2 | Show student list with pickup/drop status + attendance | All | Included in trip detail |
| 3 | Show route map with geometry and waypoints | All | `GET /tracking/:tripId/details` |
| 4 | Show chronological timeline of trip events | All | Included in tracking details |
| 5 | Show tracking history (path playback) | All | `GET /tracking/:tripId/tracking` |

---

## Screen 15 — Live Tracking

### Scenarios to implement

| # | Scenario | Who | API / Socket |
|---|----------|-----|-----|
| 1 | Show map with driver's live position | All | `GET /tracking/:tripId/current-position` |
| 2 | Real-time position updates on map | All | Socket.IO — listen to `trip:position_update` |
| 3 | Connect to Socket.IO on page load | All | Role-separated socket namespace |
| 4 | Disconnect on page leave | All | — |

---

## Screen 16 — Driver-Student Assignments

### Who accesses it
SA + A (all), SchA (school-scoped).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all assignments | SA + A | `GET /driver-student-assignments/admin/all-assignments` |
| 2 | List school-scoped assignments | SchA | Same endpoint (scoped) |
| 3 | List parent-requested assignments (pending tab) | All | `GET /driver-student-assignments/admin/my-assignments` |
| 4 | **Create assignment** (select driver + student) | All | `POST /driver-student-assignments/` |
| 5 | **Approve assignment** | All | `PUT /driver-student-assignments/:id` `{ status: "approved" }` |
| 6 | **Reject assignment** | All | `PUT /driver-student-assignments/:id` `{ status: "rejected" }` |
| 7 | **Deactivate assignment** | All | `PUT /driver-student-assignments/:id` `{ status: "inactive" }` |
| 8 | **Delete assignment** | SA + A | `DELETE /driver-student-assignments/:id` |

> Build two tabs: **All Assignments** and **Pending / Parent-Requested**.

---

## Screen 17 — School Assignments

### Who accesses it
SA + A (all), SchA (own school).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all school assignments | All | `GET /school-assignments/:schoolId` |
| 2 | List pending school assignments (tab) | All | `GET /school-assignments/:schoolId/pending` |
| 3 | List assignments for a specific driver | All | `GET /school-assignments/:schoolId/driver/:driverId` |
| 4 | **Create school assignment** | All | `POST /school-assignments/:schoolId/create` |
| 5 | **Approve assignment** | All | `POST /school-assignments/:assignmentId/approve` |
| 6 | **Reject assignment** (with reason) | All | `POST /school-assignments/:assignmentId/reject` |

---

## Screen 18 — Subscription Plans

### Who accesses it
SA + A (full CRUD), SchA (read-only).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all subscription plans | All | `GET /subscription-plans/` |
| 2 | **Create plan** | SA + A | `POST /subscription-plans/` |
| 3 | **Update plan** | SA + A | `PUT /subscription-plans/:id` |
| 4 | **Activate plan** | SA + A | `PATCH /subscription-plans/:id/activate` |
| 5 | **Deactivate plan** | SA + A | `PATCH /subscription-plans/:id/deactivate` |

### Create / Edit Plan Form Fields
- Name, Description
- Badge: `BEST_VALUE` / `POPULAR` / `RECOMMENDED` / `LIMITED_OFFER`
- Plan Type: `MONTHLY` / `QUARTERLY` / `YEARLY`
- Pricing Model: `FLAT` / `PER_KID` / `BASE_PLUS_PER_KID`
- Base Price, Per-Kid Price, Max Kids
- Features list (dynamic add/remove)
- Active toggle

> **SchA:** Show plan cards as read-only, hide Create / Edit / Toggle buttons.

---

## Screen 19 — Parent Subscriptions

### Who accesses it
SA + A (all), SchA (school-scoped).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all parent subscriptions | SA + A | `GET /parent-subscriptions/admin/all-subscriptions` |
| 2 | List school-scoped subscriptions | SchA | Same endpoint (scoped) |
| 3 | Filter by status (active / expired / cancelled) | All | `?status=` |
| 4 | View subscription detail (plan, dates, parent info) | All | Included in list response |

---

## Screen 20 — School Subscriptions

### Who accesses it
SA + A (full), SchA (own school — limited actions).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | View own school's active subscription | SchA | `GET /school-subscriptions/school/:schoolId/active` |
| 2 | List all school subscriptions | SA + A | `GET /school-subscriptions/school/:schoolId` |
| 3 | **Create school subscription** | SA + A | `POST /school-subscriptions/` |
| 4 | View subscription detail | All | `GET /school-subscriptions/:subscriptionId` |
| 5 | **Update subscription** | SA + A | `PATCH /school-subscriptions/:subscriptionId` |
| 6 | **Renew subscription** | SA + A | `POST /school-subscriptions/:subscriptionId/renew` |
| 7 | **Cancel subscription** (confirm dialog) | SA + A | `POST /school-subscriptions/:subscriptionId/cancel` |
| 8 | View expired subscriptions list | SA + A | `GET /school-subscriptions/expired/list` |
| 9 | **Generate redemption codes** (enter quantity) | SA + A + SchA (own) | `POST /school-subscriptions/:subscriptionId/generate-codes` |
| 10 | View redemption codes list | SA + A + SchA (own) | `GET /school-subscriptions/:subscriptionId/codes` |

---

## Screen 21 — Redemption Codes

> Can be a tab within School Subscriptions or a separate page.

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | View all redemption codes for a subscription | SA + A + SchA (own) | `GET /school-subscriptions/:subscriptionId/codes` |
| 2 | Show code status: available / redeemed | All | From codes response |
| 3 | Show which student redeemed the code | All | From codes response |
| 4 | Generate new codes (quantity input + button) | SA + A + SchA (own) | `POST /school-subscriptions/:subscriptionId/generate-codes` |

---

## Screen 22 — Payments

### Who accesses it
SA + A (all payments), SchA (school-scoped).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all payments (paginated) | SA + A | `GET /payments/admin/all-payments` |
| 2 | List school-scoped payments | SchA | Same endpoint (scoped) |
| 3 | Filter by payment status (success / failed / pending) | All | `?status=` |
| 4 | Filter by payment type | All | `?type=` |
| 5 | Filter by payment method (UPI, card, etc.) | All | `?method=` |
| 6 | Filter by date range | All | `?startDate=&endDate=` |
| 7 | View payment detail (parent, plan, amount, method, date) | All | `GET /razorpay/payments/:paymentId` |
| 8 | View associated order | All | `GET /razorpay/orders/:orderId` |
| 9 | **Process refund** (confirm dialog + reason) | SA + A | `POST /razorpay/refunds` |

---

## Screen 23 — Roles & Permissions

### Who accesses it
SA (full CRUD), A (view only).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all roles | SA + A | `GET /roles/` |
| 2 | View role detail (permissions list) | SA + A | `GET /roles/:id` |
| 3 | **Create custom role** | SA only | `POST /roles/` |
| 4 | **Update role** | SA only | `PUT /roles/:id` |
| 5 | **Delete role** (confirm dialog) | SA only | `DELETE /roles/:id` |

> **Admin gate:** Hide Create / Edit / Delete buttons for Admin role.

---

## Screen 24 — Audit Logs

### Who accesses it
SA + A only (SchA has no access).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all audit logs (paginated) | SA + A | `GET /audit-logs/` |
| 2 | Filter by action type | SA + A | `?action=` |
| 3 | Filter by user | SA + A | `?userId=` |
| 4 | Filter by date range | SA + A | `?startDate=&endDate=` |
| 5 | View audit log detail | SA + A | `GET /audit-logs/:id` |

---

## Screen 25 — Notifications

### Who accesses it
All roles.

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all notifications | All | `GET /notifications/` |
| 2 | List only unread notifications | All | `GET /notifications/unread` |
| 3 | Show unread count badge in header/menu | All | `GET /notifications/unread-count` |
| 4 | **Mark single notification as read** | All | `PUT /notifications/:id/mark-as-read` |
| 5 | **Mark all as read** button | All | `PUT /notifications/mark-all-as-read` |

---

## Screen 26 — Ratings & Reviews

### Who accesses it
SA + A (all), SchA (school-scoped drivers).

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List reviews for a driver | All | `GET /ratings-reviews/driver/:driverId` |
| 2 | Show average rating for a driver | All | `GET /ratings-reviews/driver/:driverId/rating` |

> Typically accessed from the Driver Detail page. Can also be a standalone page listing top/low rated drivers.

---

## Screen 27 — System Maintenance *(Super Admin only)*

### Who accesses it
SA only. Hide this menu item for Admin and SchA.

### Scenarios to implement

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | **Clean old tracking data** (confirm dialog with date range input) | SA only | `POST /tracking/admin/cleanup` |

---

## Cross-Cutting Scenarios (Apply to All Screens)

| # | Scenario | Notes |
|---|----------|-------|
| 1 | Show 403 / access denied if user hits a route they don't have access to | Route guards |
| 2 | Decode JWT on load → store role in global state | Used for conditional rendering |
| 3 | Append `schoolId` to all School Admin requests | From token payload |
| 4 | Show loading skeleton while API is in flight | All list/detail screens |
| 5 | Show empty state when list returns 0 results | All list screens |
| 6 | Show confirmation dialog before any destructive action (delete, deactivate, cancel, refund) | Delete / deactivate / cancel |
| 7 | Paginate all list screens | Use page + limit query params |
| 8 | Show toast notification on success / error | All write operations |
| 9 | Redirect to Login on 401 response | Global axios interceptor |
| 10 | Sidebar menu items hidden based on role | Route guard + role check |

---

## Role-Gated Feature Summary

| Feature | SA | A | SchA |
|---------|----|---|------|
| Create Super Admin | ✅ | ❌ | ❌ |
| Delete school | ✅ | ✅ | ❌ |
| Create school | ✅ | ✅ | ❌ |
| Create school admin | ✅ | ✅ | ❌ |
| Approve / reject driver | ✅ | ✅ | ✅ (own school) |
| Activate / deactivate users | ✅ | ✅ | ❌ |
| Delete users | ✅ | ✅ | ❌ |
| Assign driver to school | ✅ | ✅ | ✅ (own school) |
| Create subscription plan | ✅ | ✅ | ❌ |
| View subscription plans | ✅ | ✅ | ✅ (read-only) |
| Create school subscription | ✅ | ✅ | ❌ |
| Generate redemption codes | ✅ | ✅ | ✅ (own school) |
| Process refund | ✅ | ✅ | ❌ |
| Manage roles | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ |
| System maintenance / cleanup | ✅ | ❌ | ❌ |
