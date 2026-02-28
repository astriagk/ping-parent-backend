# Admin Portal — Complete Reference

> Single codebase, one sidebar — visibility controlled by `admin_role` from `admin_portal` table.
> Merged reference for role-based access and screen-by-screen development.
>
> All routes are prefixed with `/api`. Auth headers required unless marked **public**.

---

## Roles

| Role             | Scope                          | Can Create          |
| ---------------- | ------------------------------ | ------------------- |
| **superadmin**   | Global (all schools, all data) | admin, school_admin |
| **admin**        | Global (all schools, all data) | school_admin only   |
| **school_admin** | Own `school_id` only           | —                   |

**Legend:**

| Symbol | Meaning                    |
| ------ | -------------------------- |
| SA     | Super Admin                |
| A      | Admin                      |
| SchA   | School Admin               |
| SA + A | Both Super Admin and Admin |
| —      | Not accessible             |

---

## Access Matrix

| #   | Sidebar Item         | superadmin |  admin  |   school_admin    |
| --- | -------------------- | :--------: | :-----: | :---------------: |
| 1   | Dashboard            |     Y      |    Y    | Y (school-scoped) |
| 2   | Manage Admins        |     Y      |    —    |         —         |
| 3   | Manage School Admins |     Y      |    Y    |         —         |
| 4   | Manage Schools       |     Y      |    Y    |         —         |
| 5   | Driver Approvals     |     Y      |    Y    |         —         |
| 6   | Trips & Tracking     |  Y (all)   | Y (all) | Y (school-scoped) |
| 7   | Subscription Plans[^1] |     Y      |    —    |         —         |
| 8   | School Subscription  |     —      |    —    |         Y         |
| 9   | Student Codes        |     —      |    —    |         Y         |
| 10  | Students             |     —      |    —    |   Y (read-only)   |
| 11  | Driver Assignments[^3]   |     Y      |    Y    |         Y         |
| 12  | Payments Overview[^2] |     Y      |    Y    |         Y         |
| 13  | Manage Ads           |     Y      |    Y    |         —         |
| 14  | School Events        |     —      |    —    |         Y         |
| 15  | Event RSVPs          |     —      |    —    |         Y         |
| 16  | Community Moderation |     —      |    —    |         Y         |
| 17  | Support Tickets      |     Y      |    Y    |         —         |
| 18  | User Roles           |     Y      |    —    |         —         |
| 19  | Audit Logs           |     Y      |    Y    |         —         |
| 20  | Notifications        |     Y      |    —    | Y (school-scoped) |
| 21  | Reports              |     Y      |    Y    |         —         |
| 22  | System Maintenance   |     Y      |    —    |         —         |

> **⚠️ Notes / clarifications:**
>
> * Rows in the matrix show who sees the sidebar item. detailed permissions and scoped views are documented in each screen section below.
> * Subscription Plans (#7) are manageable only by SA; other roles may query the public `/subscription-plans` endpoint for read‑only display.
> * Payments Overview (#12) has a dedicated admin page for SA only. A and SchA see payment summaries on the dashboard or via scoped list endpoints (see Screen 2 and Screen 22).
> * Driver Assignments (#11) is available to SA/A with full visibility; SchA see assignments scoped to their school.

[^1]: SA only for management; other roles can view via `GET /public/subscription-plans`.
[^2]: Dedicated payments page is SA-only. Dashboard cards and scoped queries provide data for A/SchA.
[^3]: SA/A see all assignments; SchA scoped to their school (driver‑student assignments).



---

## Sidebar Config JSON

```json
{
  "superadmin": [
    { "key": "dashboard",          "label": "Dashboard",          "icon": "LayoutDashboard", "path": "/dashboard" },
    { "key": "admin_management",   "label": "Manage Admins",      "icon": "ShieldCheck",     "path": "/admins" },
    { "key": "school_management",  "label": "Manage Schools",     "icon": "School",          "path": "/schools" },
    { "key": "driver_approval",    "label": "Driver Approvals",   "icon": "UserCheck",       "path": "/drivers" },
    { "key": "trips_tracking",     "label": "Trips & Tracking",   "icon": "MapPin",          "path": "/trips" },
    { "key": "subscription_plans", "label": "Subscription Plans", "icon": "CreditCard",      "path": "/subscription-plans" },
    { "key": "payments",           "label": "Payments",           "icon": "IndianRupee",     "path": "/payments" },
    { "key": "ads_management",     "label": "Manage Ads",         "icon": "Megaphone",       "path": "/ads" },
    { "key": "support_tickets",    "label": "Support Tickets",    "icon": "LifeBuoy",        "path": "/support" },
    { "key": "user_roles",         "label": "User Roles",         "icon": "Users",           "path": "/roles" },
    { "key": "audit_logs",         "label": "Audit Logs",         "icon": "FileText",        "path": "/audit-logs" },
    { "key": "notifications",      "label": "Notifications",      "icon": "Bell",            "path": "/notifications" },
    { "key": "reports",            "label": "Reports",            "icon": "BarChart3",       "path": "/reports" },
    { "key": "system_maintenance", "label": "System Maintenance", "icon": "Settings",        "path": "/maintenance" }
  ],

  "admin": [
    { "key": "dashboard",               "label": "Dashboard",        "icon": "LayoutDashboard", "path": "/dashboard" },
    { "key": "school_management",       "label": "Manage Schools",   "icon": "School",          "path": "/schools" },
    { "key": "school_admin_management", "label": "School Admins",    "icon": "ShieldCheck",     "path": "/school-admins" },
    { "key": "driver_approval",         "label": "Driver Approvals", "icon": "UserCheck",       "path": "/drivers" },
    { "key": "trips_tracking",          "label": "Trips & Tracking", "icon": "MapPin",          "path": "/trips" },
    { "key": "ads_management",          "label": "Manage Ads",       "icon": "Megaphone",       "path": "/ads" },
    { "key": "support_tickets",         "label": "Support Tickets",  "icon": "LifeBuoy",        "path": "/support" },
    { "key": "reports",                 "label": "Reports",          "icon": "BarChart3",       "path": "/reports" }
  ],

  "school_admin": [
    { "key": "dashboard",            "label": "Dashboard",          "icon": "LayoutDashboard", "path": "/dashboard" },
    { "key": "school_subscription",  "label": "Subscription",       "icon": "CreditCard",      "path": "/subscription" },
    { "key": "student_codes",        "label": "Student Codes",      "icon": "QrCode",          "path": "/student-codes" },
    { "key": "students",             "label": "Students",           "icon": "GraduationCap",   "path": "/students" },
    { "key": "driver_assignments",   "label": "Driver Assignments", "icon": "Bus",             "path": "/assignments" },
    { "key": "trips_tracking",       "label": "Trips & Tracking",   "icon": "MapPin",          "path": "/trips" },
    { "key": "school_events",        "label": "Events",             "icon": "CalendarDays",    "path": "/events" },
    { "key": "event_rsvps",          "label": "Event RSVPs",        "icon": "ClipboardCheck",  "path": "/events/rsvps" },
    { "key": "community_moderation", "label": "Community Board",    "icon": "MessageSquare",   "path": "/community" },
    { "key": "notifications",        "label": "Notifications",      "icon": "Bell",            "path": "/notifications" }
  ]
}
```

---

## Creation Hierarchy

```
superadmin
├── can create → admin
├── can create → school_admin (with school_id)
│
admin
├── can create → school_admin (with school_id)
│
school_admin
└── cannot create any admin accounts
```

---

## Frontend Implementation Notes

1. After login, read `admin_role` from the JWT/session
2. Use the sidebar JSON above to render only the allowed menu items
3. For `school_admin`, all API calls should be scoped by their `school_id` (backend enforces this)
4. Trips & Tracking page: same component, different data scope — superadmin/admin see all, school_admin filtered by `school_id`
5. Icons reference [Lucide Icons](https://lucide.dev/icons/) — swap as needed for your icon library
6. Decode JWT on load → store role in global state → use for conditional rendering
7. Redirect to Login on 401 response (global axios interceptor)

---

## Route Architecture

| Gateway | Base Path | Auth |
|---------|-----------|------|
| Auth | `/api/auth` | Public |
| Public | `/api/public` | Public |
| Shared | `/api/shared` | Any authenticated user |
| Parent | `/api/parent` | `verifyParentToken` |
| Driver | `/api/driver` | `verifyDriverToken` |
| Admin | `/api/admin` | `verifyAdminOrAboveToken` |
| Superadmin | `/api/superadmin` | `verifySuperadminToken` |
| School Admin | `/api/school-admin` | `verifySchoolAdminToken` |

---

## Screen-by-Screen Development Guide

> Each section = one screen/page. **Roles: SA = Super Admin, A = Admin, SchA = School Admin**

---

### Screen 1 — Login

**Who accesses it:** SA + A → Admin login. SchA → Uses the same login endpoint; role is returned in the token.

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Admin enters email + password, clicks Login | SA + A | `POST /admin/auth/login` |
| 2 | School Admin enters email + password, clicks Login | SchA | `POST /admin/auth/login` |
| 3 | Show error on wrong credentials | All | — |
| 4 | Store JWT token after successful login | All | — |
| 5 | Redirect to Dashboard after login | All | — |

> After login, decode the token to read `admin_role` and `school_id` and scope all subsequent requests accordingly.

---

### Screen 2 — Dashboard

**Who accesses it:** All roles, but data scope differs.

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Show total parents count | SA + A | `GET /admin/users?role=parent` |
| 2 | Show total drivers count | SA + A | `GET /admin/users?role=driver` |
| 3 | Show total students count | SA + A | `GET /admin/users?role=student` |
| 4 | Show school-scoped user counts | SchA | `GET /admin/users` (scoped by token) |
| 5 | Show active trips count | SA + A | `GET /admin/trips?status=active` |
| 6 | Show school trips count | SchA | `GET /admin/trips` (scoped by token) |
| 7 | Show revenue this month | SA + A | `GET /admin/payments` |
| 8 | Show subscription stats | SA + A | `GET /admin/subscriptions` |
| 9 | Show pending driver approval count (badge) | SA + A + SchA | `GET /admin/users?role=driver&status=pending` |
| 10 | Show expiring subscriptions alert | SA + A + SchA | `GET /admin/subscriptions?status=expiring` |
| 11 | Show recent activity feed / recent trips table | SA + A | `GET /admin/trips` |

**Cards to build:** Total Parents, Total Drivers (pending badge), Total Students, Active Trips, Revenue (this month), Pending Driver Approvals

**Charts to build:** Trips over time (line), Revenue trend (bar), Subscriptions by plan type (pie/donut)

---

### Screen 3 — Parents List

**Who accesses it:** SA + A (all parents), SchA (school-scoped parents).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all parents (paginated) | SA + A | `GET /admin/users?role=parent` |
| 2 | List school-scoped parents | SchA | `GET /admin/users?role=parent&schoolId=<id>` |
| 3 | Search / filter parents | All | query params on the same endpoint |
| 4 | Click parent row → go to Parent Detail page | All | — |
| 5 | Activate parent account | SA + A | `PATCH /admin/users/:id/activate` |
| 6 | Deactivate parent account | SA + A | `PATCH /admin/users/:id/deactivate` |
| 7 | Delete parent | SA + A | `DELETE /admin/management/users/:id` |

---

### Screen 4 — Parent Detail

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load full parent profile | All | `GET /admin/management/parents/:id/details` |
| 2 | Show linked students list | All | included in profile or `GET /admin/management/users/:id` |
| 3 | Show parent's subscriptions | All | `GET /admin/subscriptions?parentId=<id>` |
| 4 | Show parent's payments | SA + A | `GET /admin/payments?parentId=<id>` |
| 5 | Activate / Deactivate button | SA + A | `PATCH /admin/management/users/:id/activate` or `deactivate` |
| 6 | Delete button (with confirm dialog) | SA + A | `DELETE /admin/management/users/:id` |

---

### Screen 5 — Drivers List

**Who accesses it:** SA + A (all drivers), SchA (school-scoped drivers).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all drivers (paginated) | SA + A | `GET /admin/users?role=driver` |
| 2 | List school-scoped drivers | SchA | `GET /admin/users?role=driver&schoolId=<id>` |
| 3 | Filter by approval status (pending / approved / rejected) | All | query params |
| 4 | Show pending approval count as badge on menu | All | — |
| 5 | Click driver row → go to Driver Detail page | All | — |
| 6 | Activate driver | SA + A | `PATCH /admin/management/users/:id/activate` |
| 7 | Deactivate driver | SA + A | `PATCH /admin/management/users/:id/deactivate` |
| 8 | Delete driver | SA + A | `DELETE /admin/management/users/:id` |

---

### Screen 6 — Driver Detail / Approval

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load full driver profile + documents | All | `GET /admin/management/drivers/:id/details` |
| 2 | View uploaded documents (license, insurance) — open/download | All | Document URLs from detail response |
| 3 | **Approve driver** | SA + A + SchA | `PATCH /admin/management/drivers/:id/approval-status` `{ status: "approved" }` |
| 4 | **Reject driver** (with reason text field) | SA + A + SchA | `PATCH /admin/management/drivers/:id/approval-status` `{ status: "rejected", reason: "..." }` |
| 5 | View driver's trip history | All | `GET /admin/trips?driverId=<id>` |
| 6 | View driver ratings & reviews | All | `GET /public/reviews/driver/:driverId` |
| 7 | View driver average rating | All | `GET /public/reviews/driver/:driverId/rating` |
| 8 | Activate / Deactivate driver | SA + A | `PATCH /admin/management/users/:id/activate` or `deactivate` |
| 9 | Delete driver (confirm dialog) | SA + A | `DELETE /admin/management/users/:id` |

---

### Screen 7 — Students List

**Who accesses it:** SA + A (all students), SchA (school-scoped students).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all students (paginated) | SA + A | `GET /admin/users?role=student` |
| 2 | List school-scoped students | SchA | `GET /admin/users?role=student&schoolId=<id>` |
| 3 | Filter / search students | All | query params |
| 4 | Click student row → go to Student Detail page | All | — |

---

### Screen 8 — Student Detail

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load student profile | All | `GET /admin/management/users/:id` |
| 2 | View student's trip history | All | `GET /admin/trips?studentId=<id>` |

---

### Screen 9 — Admin Management

**Who accesses it:** SA only (superadmin routes; admin cannot manage other admins).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all admins | SA | `GET /superadmin/admins` |
| 2 | **Create new Admin** (email, name, password, role) | SA | `POST /superadmin/admins` `{ role: "admin" }` |
| 3 | **Create Super Admin** | SA | `POST /admin/auth/setup/create-superadmin` |
| 4 | View admin detail | SA | `GET /superadmin/admins/:id` |
| 5 | **Update admin** info | SA | `PUT /superadmin/admins/by-admin-id/:admin_id` |
| 6 | **Activate admin** | SA | `PATCH /superadmin/admins/by-admin-id/:admin_id/activate` |
| 7 | **Deactivate admin** | SA | `PATCH /superadmin/admins/by-admin-id/:admin_id/deactivate` |

> Hide the "Create Super Admin" button for Admin role users.

---

### Screen 10 — Schools List

**Who accesses it:** SA + A (all schools), SchA (own school only via `/school-admin/school`).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all schools | SA + A | `GET /admin/schools` |
| 2 | SchA sees only their school | SchA | `GET /school-admin/school` |
| 3 | **Create school** (name, address, contact, logo) | SA + A | `POST /admin/schools` |
| 4 | Click school row → go to School Detail page | All | — |
| 5 | **Update school** info | SA + A | `PUT /admin/schools/:school_id` |
| 6 | **Delete school** (confirm dialog) | SA + A | `DELETE /admin/schools/:school_id` |

---

### Screen 11 — School Detail

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load school info | SA + A | `GET /admin/schools/:school_id` |
| 2 | Load own school info | SchA | `GET /school-admin/school` |
| 3 | View school admins list | SA + A | `GET /admin/management/by-school/:school_id` |
| 4 | **Create School Admin** for this school | SA | `POST /superadmin/admins` `{ role: "school_admin", school_id }` |
| 5 | **Deactivate School Admin** | SA + A | `PATCH /superadmin/admins/by-admin-id/:admin_id/deactivate` |
| 6 | View school drivers list | SA + A | `GET /admin/school-drivers/:schoolId` |
| 7 | View school drivers list | SchA | `GET /school-admin/drivers` |
| 8 | **Assign driver to school** | SA + A | `POST /admin/school-drivers/assign` `{ schoolId, driverId }` |
| 9 | **Assign driver to school** | SchA | `POST /school-admin/drivers` `{ driverId }` |
| 10 | **Remove driver from school** | SA + A | `POST /admin/school-drivers/:driverId/remove` |
| 11 | View driver details from this list | SA + A | `GET /admin/school-drivers/:driverId/details` |

---

### Screen 12 — School Admins List

**Who accesses it:** SA + A only.

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List school admins for a given school | SA + A | `GET /admin/management/by-school/:school_id` |
| 2 | **Register school admin** | SA | `POST /superadmin/admins` `{ role: "school_admin", school_id }` |
| 3 | **Deactivate school admin** | SA + A | `PATCH /superadmin/admins/by-admin-id/:admin_id/deactivate` |

---

### Screen 13 — Trips List

**Who accesses it:** SA + A (all trips), SchA (school-scoped trips).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all trips (paginated) | SA + A | `GET /admin/trips` |
| 2 | List school-scoped trips | SchA | `GET /admin/trips` (scoped by token) |
| 3 | Filter by status (active / completed / cancelled) | All | `?status=active` |
| 4 | Filter by date range | All | `?startDate=&endDate=` |
| 5 | Filter by driver | All | `?driverId=` |
| 6 | Click trip row → go to Trip Detail page | All | — |

---

### Screen 14 — Trip Detail

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Load trip info (driver, date, status, type) | All | `GET /admin/trips/:id` |
| 2 | Show student list with pickup/drop status + attendance | All | Included in trip detail |
| 3 | Show route map with geometry and waypoints | All | `GET /shared/tracking/:tripId/details` |
| 4 | Show chronological timeline of trip events | All | Included in tracking details |
| 5 | Show tracking history (path playback) | All | `GET /shared/tracking/:tripId/tracking` |

---

### Screen 15 — Live Tracking

| # | Scenario | Who | API / Socket |
|---|----------|-----|-----|
| 1 | Show map with driver's live position | All | `GET /shared/tracking/:tripId/current-position` |
| 2 | Real-time position updates on map | All | Socket.IO — listen to `trip:position_update` |
| 3 | Connect to Socket.IO on page load | All | Role-separated socket namespace |
| 4 | Disconnect on page leave | All | — |

---

### Screen 16 — Driver-Student Assignments

**Who accesses it:** SA + A (view all), SchA (school-scoped view).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all assignments | SA + A | `GET /admin/assignments` |
| 2 | List school-scoped assignments | SchA | `GET /admin/assignments` (scoped by token) |
| 3 | List parent-requested assignments (pending tab) | All | `GET /admin/assignments/parent-requested` |

> **Note:** Create / approve / reject / deactivate assignment actions are not yet available via admin routes. These operations are currently handled via driver-side routes (`/driver/assignments`).

---

### Screen 17 — School Assignments

**Who accesses it:** SA + A (all), SchA (own school).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all school assignments | All | `GET /admin/school-assignments/:schoolId` |
| 2 | List pending school assignments (tab) | All | `GET /admin/school-assignments/:schoolId/pending` |
| 3 | List assignments for a specific driver | All | `GET /admin/school-assignments/:schoolId/driver/:driverId` |
| 4 | **Create school assignment** | All | `POST /admin/school-assignments/:schoolId/create` |
| 5 | **Approve assignment** | All | `POST /admin/school-assignments/:assignmentId/approve` |
| 6 | **Reject assignment** (with reason) | All | `POST /admin/school-assignments/:assignmentId/reject` |

---

### Screen 18 — Subscription Plans

**Who accesses it:** SA (manage), SchA (read-only via public endpoint).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all subscription plans | All | `GET /public/subscription-plans` |
| 2 | View plan detail | All | `GET /public/subscription-plans/:id` |
| 3 | **Create plan** | SA | `POST /admin/subscription-plans` |
| 4 | **Update plan** | SA | `PUT /admin/subscription-plans/:id` |
| 5 | **Activate plan** | SA | `PATCH /admin/subscription-plans/:id/activate` |
| 6 | **Deactivate plan** | SA | `PATCH /admin/subscription-plans/:id/deactivate` |

**Create / Edit Plan form fields:**

- Name, Description
- Badge: `BEST_VALUE` / `POPULAR` / `RECOMMENDED` / `LIMITED_OFFER`
- Plan Type: `MONTHLY` / `QUARTERLY` / `YEARLY`
- Pricing Model: `FLAT` / `PER_KID` / `BASE_PLUS_PER_KID`
- Base Price, Per-Kid Price, Max Kids
- Features list (dynamic add/remove)
- Active toggle

> **SchA:** Show plan cards as read-only (public endpoint), hide Create / Edit / Toggle buttons.

---

### Screen 19 — Parent Subscriptions

**Who accesses it:** SA + A (all), SchA (school-scoped).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all parent subscriptions | SA + A | `GET /admin/subscriptions` |
| 2 | List school-scoped subscriptions | SchA | `GET /admin/subscriptions` (scoped by token) |
| 3 | Filter by status (active / expired / cancelled) | All | `?status=` |
| 4 | View subscription detail (plan, dates, parent info) | All | Included in list response |

---

### Screen 20 — School Subscriptions

**Who accesses it:** SA + A (full), SchA (own school — view only).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | View own school's active subscription | SchA | `GET /admin/school-subscriptions/school/:schoolId/active` |
| 2 | List all school subscriptions | SA + A | `GET /admin/school-subscriptions/school/:schoolId` |
| 3 | **Create school subscription** | SA + A | `POST /admin/school-subscriptions` |
| 4 | View subscription detail | All | `GET /admin/school-subscriptions/:subscriptionId` |
| 5 | **Update subscription** | SA + A | `PATCH /admin/school-subscriptions/:subscriptionId` |
| 6 | **Renew subscription** | SA + A | `POST /admin/school-subscriptions/:subscriptionId/renew` |
| 7 | **Cancel subscription** (confirm dialog) | SA + A | `POST /admin/school-subscriptions/:subscriptionId/cancel` |
| 8 | View expired subscriptions list | SA + A | `GET /admin/school-subscriptions/expired/list` |
| 9 | **Generate redemption codes** (enter quantity) | SA + A + SchA (own) | `POST /admin/school-subscriptions/:subscriptionId/generate-codes` |
| 10 | View redemption codes list | SA + A + SchA (own) | `GET /admin/school-subscriptions/:subscriptionId/codes` |

---

### Screen 21 — Redemption Codes

> Can be a tab within School Subscriptions or a separate page.

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | View all redemption codes for a subscription | SA + A + SchA (own) | `GET /admin/school-subscriptions/:subscriptionId/codes` |
| 2 | Show code status: available / redeemed | All | From codes response |
| 3 | Show which student redeemed the code | All | From codes response |
| 4 | Generate new codes (quantity input + button) | SA + A + SchA (own) | `POST /admin/school-subscriptions/:subscriptionId/generate-codes` |

---

### Screen 22 — Payments

**Who accesses it:** SA (all payments and refunds).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all payments (paginated) | SA | `GET /admin/payments` |
| 2 | Filter by payment status (success / failed / pending) | SA | `?status=` |
| 3 | Filter by payment type | SA | `?type=` |
| 4 | Filter by date range | SA | `?startDate=&endDate=` |
| 5 | View payment detail (parent, plan, amount, method, date) | SA | `GET /admin/payments/:id` |
| 6 | View Razorpay order detail | SA | `GET /public/razorpay/orders/:orderId` |
| 7 | View Razorpay payment detail | SA | `GET /public/razorpay/payments/:paymentId` |
| 8 | **Process refund** (confirm dialog + reason) | SA | `POST /public/razorpay/refunds` |

---

### Screen 23 — Manage Ads

**Who accesses it:** SA + A only.
Tables: `ads`, `ad_interactions`

> **Backend routes not yet implemented.** Expected routes:

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all ads | SA + A | `GET /admin/ads` |
| 2 | **Create ad** (banner / interstitial / native_card) | SA + A | `POST /admin/ads` |
| 3 | **Update ad** | SA + A | `PUT /admin/ads/:id` |
| 4 | **Activate / Deactivate ad** | SA + A | `PATCH /admin/ads/:id/status` |
| 5 | **Delete ad** (confirm dialog) | SA + A | `DELETE /admin/ads/:id` |
| 6 | View ad impressions & click analytics | SA + A | `GET /admin/ads/:id/analytics` |

**Create / Edit Ad form fields:**

- Title, Description, Image URL
- Ad Type: `banner` / `interstitial` / `native_card`
- Target Audience: `all` / `parents` / `drivers` / `school_admin`
- Target School IDs (multi-select, optional)
- Active toggle, Start Date, End Date

---

### Screen 24 — Support Tickets

**Who accesses it:** SA + A only.
Table: `support_tickets`

> **Backend routes not yet implemented.** Expected routes:

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all tickets (paginated) | SA + A | `GET /admin/support-tickets` |
| 2 | Filter by status (open / in_progress / resolved / closed) | SA + A | `?status=` |
| 3 | Filter by priority | SA + A | `?priority=` |
| 4 | View ticket detail | SA + A | `GET /admin/support-tickets/:id` |
| 5 | **Assign ticket to admin** | SA + A | `PATCH /admin/support-tickets/:id/assign` |
| 6 | **Update ticket status** | SA + A | `PATCH /admin/support-tickets/:id/status` |
| 7 | **Resolve ticket** | SA + A | `PATCH /admin/support-tickets/:id/resolve` |

---

### Screen 25 — Reports

**Who accesses it:** SA + A only.

> **Backend routes not yet implemented.** Expected routes:

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | View trip reports (filter by date range, school, driver) | SA + A | `GET /admin/reports/trips` |
| 2 | View payment reports (filter by date range, status) | SA + A | `GET /admin/reports/payments` |
| 3 | View driver stats (total trips, avg rating, on-time %) | SA + A | `GET /admin/reports/drivers` |
| 4 | View student attendance reports | SA + A | `GET /admin/reports/students` |
| 5 | Export report as CSV/PDF | SA + A | `GET /admin/reports/:type/export` |

---

### Screen 26 — Roles & Permissions

**Who accesses it:** SA only (superadmin routes).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all roles | SA | `GET /superadmin/roles` |
| 2 | View role detail (permissions list) | SA | `GET /superadmin/roles/:id` |
| 3 | **Create custom role** | SA | `POST /superadmin/roles` |
| 4 | **Update role** | SA | `PUT /superadmin/roles/:id` |
| 5 | **Delete role** (confirm dialog) | SA | `DELETE /superadmin/roles/:id` |

---

### Screen 27 — Audit Logs

**Who accesses it:** SA + A. Both gateways expose audit log routes.

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all audit logs (paginated) | SA | `GET /superadmin/audit-logs` |
| 2 | List audit logs | A | `GET /admin/audit-logs` |
| 3 | Filter by action type | All | `?action=` |
| 4 | Filter by user | All | `?userId=` |
| 5 | Filter by date range | All | `?startDate=&endDate=` |
| 6 | View audit log detail | SA | `GET /superadmin/audit-logs/:id` |
| 7 | View audit log detail | A | `GET /admin/audit-logs/:id` |

---

### Screen 28 — Notifications

**Who accesses it:** All roles (shared gateway).

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all notifications | All | `GET /shared/notifications` |
| 2 | List only unread notifications | All | `GET /shared/notifications/unread` |
| 3 | Show unread count badge in header/menu | All | `GET /shared/notifications/unread-count` |
| 4 | **Mark single notification as read** | All | `PUT /shared/notifications/:id/mark-as-read` |
| 5 | **Mark all as read** button | All | `PUT /shared/notifications/mark-all-as-read` |
| 6 | **Send push notification** to all parents of school | SchA | *(route not yet implemented)* |

---

### Screen 29 — School Events

**Who accesses it:** SchA only.
Table: `school_events`

> **Backend routes not yet implemented.** Expected routes:

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all events for own school | SchA | `GET /school-admin/events` |
| 2 | **Create event** (set type, audience, RSVP settings) | SchA | `POST /school-admin/events` |
| 3 | View event detail | SchA | `GET /school-admin/events/:id` |
| 4 | **Update event** | SchA | `PUT /school-admin/events/:id` |
| 5 | **Cancel event** with reason | SchA | `PATCH /school-admin/events/:id/cancel` |
| 6 | Trigger push notification to affected parents | SchA | `POST /school-admin/events/:id/notify` |

**Create / Edit Event form fields:**

- Title, Description, Date & Time, Location
- Event Type: `sports` / `parent_meeting` / `cultural` / `holiday` / `festival` / `exam` / `excursion` / `general`
- Audience Scope: `all` / `class_specific` (with target_classes)
- Requires RSVP toggle, RSVP Deadline
- Attachments (file upload)

---

### Screen 30 — Event RSVPs

**Who accesses it:** SchA only.
Table: `event_rsvp`

> **Backend routes not yet implemented.** Expected routes:

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | Select an event to view RSVPs | SchA | — |
| 2 | View RSVP responses per event (attending / not_attending / maybe) | SchA | `GET /school-admin/events/:eventId/rsvps` |
| 3 | Show response counts and breakdown | SchA | From RSVP list response |
| 4 | Export RSVP list (CSV) | SchA | `GET /school-admin/events/:eventId/rsvps/export` |

---

### Screen 31 — Community Board

**Who accesses it:** SchA only.
Tables: `community_posts`, `community_post_comments`

> **Backend routes not yet implemented.** Expected routes:

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List all community posts for own school | SchA | `GET /school-admin/community-posts` |
| 2 | **Pin post** | SchA | `PATCH /school-admin/community-posts/:id/pin` |
| 3 | **Unpin post** | SchA | `PATCH /school-admin/community-posts/:id/unpin` |
| 4 | **Hide post** (set `is_visible = false`, add moderation_reason) | SchA | `PATCH /school-admin/community-posts/:id/hide` |
| 5 | **Hide comment** | SchA | `PATCH /school-admin/community-posts/:postId/comments/:id/hide` |
| 6 | View anonymous post authors (parents cannot see this) | SchA | From post detail response |

---

### Screen 32 — Ratings & Reviews

**Who accesses it:** SA + A (all drivers), SchA (school-scoped drivers). Uses public endpoint.

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | List reviews for a driver | All | `GET /public/reviews/driver/:driverId` |
| 2 | Show average rating for a driver | All | `GET /public/reviews/driver/:driverId/rating` |

> Typically accessed from the Driver Detail page. Can also be a standalone page listing top/low-rated drivers.

---

### Screen 33 — System Maintenance

**Who accesses it:** SA only. Hide this menu item for Admin and SchA.

| # | Scenario | Who | API |
|---|----------|-----|-----|
| 1 | **Clean old tracking data** (confirm dialog with date range input) | SA | `POST /admin/tracking/cleanup` |

---

## Cross-Cutting Scenarios

> Apply to all screens.

| # | Scenario | Notes |
|---|----------|-------|
| 1 | Show 403 / access denied if user hits a route they don't have access to | Route guards |
| 2 | Decode JWT on load → store role in global state | Used for conditional rendering |
| 3 | Append `schoolId` to all School Admin requests | From token payload |
| 4 | Show loading skeleton while API is in flight | All list/detail screens |
| 5 | Show empty state when list returns 0 results | All list screens |
| 6 | Show confirmation dialog before any destructive action (delete, deactivate, cancel, refund) | Delete / deactivate / cancel |
| 7 | Paginate all list screens | Use `page` + `limit` query params |
| 8 | Show toast notification on success / error | All write operations |
| 9 | Redirect to Login on 401 response | Global axios interceptor |
| 10 | Sidebar menu items hidden based on role | Route guard + role check |

---

## Role-Gated Feature Summary

| Feature                      | SA  | A   | SchA            |
| ---------------------------- | --- | --- | --------------- |
| Create Super Admin           | ✅  | ❌  | ❌              |
| Delete school                | ✅  | ✅  | ❌              |
| Create school                | ✅  | ✅  | ❌              |
| Create school admin          | ✅  | ❌  | ❌              |
| Approve / reject driver      | ✅  | ✅  | ✅ (own school) |
| Activate / deactivate users  | ✅  | ✅  | ❌              |
| Delete users                 | ✅  | ✅  | ❌              |
| Assign driver to school      | ✅  | ✅  | ✅ (own school) |
| Manage subscription plans    | ✅  | ❌  | ❌              |
| View subscription plans      | ✅  | ✅  | ✅ (read-only)  |
| Create school subscription   | ✅  | ✅  | ❌              |
| Generate redemption codes    | ✅  | ✅  | ✅ (own school) |
| Process refund               | ✅  | ❌  | ❌              |
| Manage roles                 | ✅  | ❌  | ❌              |
| View audit logs              | ✅  | ✅  | ❌              |
| Manage ads                   | ✅  | ✅  | ❌              |
| Manage support tickets       | ✅  | ✅  | ❌              |
| View reports                 | ✅  | ✅  | ❌              |
| Manage school events         | ❌  | ❌  | ✅              |
| Moderate community board     | ❌  | ❌  | ✅              |
| System maintenance / cleanup | ✅  | ❌  | ❌              |
