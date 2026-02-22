# Admin Portal Blueprint

> Feature & menu mapping for the Ping Parent admin portal, organized by role.

---

## Roles Overview

| Role | Scope | Description |
|------|-------|-------------|
| **Super Admin** | Global | Full system access. Can create admins, manage all schools, all users, all billing. |
| **Admin** | Global | Same as Super Admin but cannot create other Super Admins. |
| **School Admin** | School-scoped | Manages drivers, students, assignments, and subscriptions for their school only. |

---

## Menu Structure by Role

### 1. Dashboard

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| Total users (parents, drivers, students) | Y | Y | School only |
| Active trips count | Y | Y | School only |
| Revenue / subscription stats | Y | Y | School only |
| Recent activity feed | Y | Y | School only |
| Pending driver approvals | Y | Y | School only |
| Expiring subscriptions alerts | Y | Y | School only |

**APIs:**
- `GET /admin/users` — aggregate counts
- `GET /trips/admin/all-trips` — trip stats
- `GET /parent-subscriptions/admin/all-subscriptions` — subscription stats
- `GET /payments/admin/all-payments` — revenue stats

---

### 2. User Management

#### 2a. Parents

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all parents | Y | Y | School only |
| View parent details | Y | Y | School only |
| Activate / deactivate parent | Y | Y | - |
| Delete parent | Y | Y | - |
| View parent's students | Y | Y | School only |
| View parent's subscriptions | Y | Y | School only |
| View parent's payments | Y | Y | - |

**APIs:**
- `GET /admin/users` — list parents (filter by role)
- `GET /admin/users/:id` — parent details
- `GET /admin/parents/:id/details` — full parent profile
- `PATCH /admin/users/:id/activate`
- `PATCH /admin/users/:id/deactivate`
- `DELETE /admin/users/:id`

#### 2b. Drivers

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all drivers | Y | Y | School only |
| View driver details + documents | Y | Y | School only |
| Approve / reject driver | Y | Y | School only |
| Activate / deactivate driver | Y | Y | - |
| Delete driver | Y | Y | - |
| View driver's trip history | Y | Y | School only |
| View driver ratings & reviews | Y | Y | School only |

**APIs:**
- `GET /admin/users` — list drivers (filter by role)
- `GET /admin/drivers/:id/details` — full driver profile + documents
- `PATCH /admin/drivers/:id/approval-status` — approve/reject
- `PATCH /admin/users/:id/activate`
- `PATCH /admin/users/:id/deactivate`
- `DELETE /admin/users/:id`
- `GET /ratings-reviews/driver/:driverId` — reviews
- `GET /ratings-reviews/driver/:driverId/rating` — average rating

#### 2c. Students

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all students | Y | Y | School only |
| View student details | Y | Y | School only |
| View student's trip history | Y | Y | School only |

**APIs:**
- `GET /admin/users` — includes students
- `GET /admin/users/:id` — student details

---

### 3. Admin Management

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all admins | Y | Y | - |
| Create new admin | Y | Y | - |
| Update admin | Y | Y | - |
| Activate / deactivate admin | Y | Y | - |
| Create super admin | Y | - | - |

**APIs:**
- `GET /admin/` — list admins
- `POST /admin/` — create admin
- `GET /admin/:id` or `GET /admin/by-admin-id/:admin_id`
- `PUT /admin/:id` or `PUT /admin/by-admin-id/:admin_id`
- `PATCH /admin/:id/activate` or `PATCH /admin/by-admin-id/:admin_id/activate`
- `PATCH /admin/:id/deactivate` or `PATCH /admin/by-admin-id/:admin_id/deactivate`
- `POST /admin/setup/create-superadmin` — one-time setup

---

### 4. School Management

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all schools | Y | Y | Own school |
| Create school | Y | Y | - |
| Update school | Y | Y | Own school |
| Delete school | Y | Y | - |
| Manage school admins | Y | Y | - |
| View school drivers | Y | Y | Own school |
| Assign driver to school | Y | Y | Own school |
| Remove driver from school | Y | Y | Own school |

**APIs:**
- `GET /schools/` — list all schools
- `POST /schools/admin` — create school
- `PUT /schools/admin/:school_id` — update school
- `DELETE /schools/admin/:school_id` — delete school
- `GET /school-admin/:schoolId` — school's admins
- `POST /school-admin/:adminId/deactivate` — deactivate school admin
- `GET /school-driver/:schoolId` — school's drivers
- `POST /school-driver/assign` — assign driver
- `POST /school-driver/:driverId/remove` — remove driver
- `GET /school-driver/:driverId/details` — driver details

---

### 5. School Admin Management

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View school admins for a school | Y | Y | Own school |
| Register school admin | Y | Y | - |
| Deactivate school admin | Y | Y | - |

**APIs:**
- `GET /school-admin/:schoolId`
- `POST /school-admin/register`
- `POST /school-admin/:adminId/deactivate`

---

### 6. Trip Management

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all trips | Y | Y | School only |
| Filter trips by status / date / driver | Y | Y | School only |
| View trip details (students, route, timeline) | Y | Y | School only |
| View trip tracking history | Y | Y | School only |
| View live trip on map | Y | Y | School only |

**APIs:**
- `GET /trips/admin/all-trips` — all trips with filters
- `GET /tracking/:tripId/tracking` — tracking history
- `GET /tracking/:tripId/current-position` — live position
- `GET /tracking/:tripId/details` — route geometry + waypoints

---

### 7. Assignments

#### 7a. Driver-Student Assignments

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all assignments | Y | Y | School only |
| View parent-requested assignments | Y | Y | School only |
| Create assignment | Y | Y | School only |
| Approve / reject assignment | Y | Y | School only |
| Deactivate assignment | Y | Y | School only |
| Delete assignment | Y | Y | - |

**APIs:**
- `GET /driver-student-assignments/admin/all-assignments`
- `GET /driver-student-assignments/admin/my-assignments` — parent-requested
- `POST /driver-student-assignments/`
- `PUT /driver-student-assignments/:id`
- `DELETE /driver-student-assignments/:id`

#### 7b. School Assignments

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View school assignments | Y | Y | Own school |
| View pending assignments | Y | Y | Own school |
| Create school assignment | Y | Y | Own school |
| Approve / reject | Y | Y | Own school |

**APIs:**
- `GET /school-assignments/:schoolId`
- `GET /school-assignments/:schoolId/pending`
- `GET /school-assignments/:schoolId/driver/:driverId`
- `POST /school-assignments/:schoolId/create`
- `POST /school-assignments/:assignmentId/approve`
- `POST /school-assignments/:assignmentId/reject`

---

### 8. Billing & Subscriptions

#### 8a. Subscription Plans

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all plans | Y | Y | Y (read-only) |
| Create plan | Y | Y | - |
| Update plan | Y | Y | - |
| Activate / deactivate plan | Y | Y | - |

**APIs:**
- `GET /subscription-plans/`
- `POST /subscription-plans/`
- `PUT /subscription-plans/:id`
- `PATCH /subscription-plans/:id/activate`
- `PATCH /subscription-plans/:id/deactivate`

**Plan Configuration Fields:**
- Name, description, badge (BEST_VALUE, POPULAR, RECOMMENDED, LIMITED_OFFER)
- Plan type: MONTHLY, QUARTERLY, YEARLY
- Pricing model: FLAT, PER_KID, BASE_PLUS_PER_KID
- Base price, per-kid price, max kids
- Features list, active/inactive status

#### 8b. Parent Subscriptions

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all subscriptions | Y | Y | School only |
| Filter by status (active/expired/cancelled) | Y | Y | School only |
| View subscription details | Y | Y | School only |

**APIs:**
- `GET /parent-subscriptions/admin/all-subscriptions`

#### 8c. School Subscriptions

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| Create school subscription | Y | Y | - |
| View school subscriptions | Y | Y | Own school |
| View active subscription | Y | Y | Own school |
| Update subscription | Y | Y | - |
| Renew subscription | Y | Y | - |
| Cancel subscription | Y | Y | - |
| View expired subscriptions | Y | Y | - |
| Generate redemption codes | Y | Y | Own school |
| View redemption codes | Y | Y | Own school |

**APIs:**
- `POST /school-subscriptions/`
- `GET /school-subscriptions/school/:schoolId`
- `GET /school-subscriptions/school/:schoolId/active`
- `GET /school-subscriptions/:subscriptionId`
- `PATCH /school-subscriptions/:subscriptionId`
- `POST /school-subscriptions/:subscriptionId/renew`
- `POST /school-subscriptions/:subscriptionId/cancel`
- `GET /school-subscriptions/expired/list`
- `POST /school-subscriptions/:subscriptionId/generate-codes`
- `GET /school-subscriptions/:subscriptionId/codes`

#### 8d. Payments

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all payments | Y | Y | School only |
| Filter by status / type / method | Y | Y | School only |
| View payment details | Y | Y | School only |
| Process refunds (via Razorpay) | Y | Y | - |

**APIs:**
- `GET /payments/admin/all-payments`
- `POST /razorpay/refunds` — process refund
- `GET /razorpay/orders/:orderId` — order details
- `GET /razorpay/payments/:paymentId` — payment details

---

### 9. Roles & Permissions

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all roles | Y | Y | - |
| Create custom role | Y | - | - |
| Update role | Y | - | - |
| Delete role | Y | - | - |

**APIs:**
- `GET /roles/`
- `POST /roles/`
- `GET /roles/:id`
- `PUT /roles/:id`
- `DELETE /roles/:id`

---

### 10. Audit Logs

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View all audit logs | Y | Y | - |
| Filter by action / user / date | Y | Y | - |
| View audit log details | Y | Y | - |

**APIs:**
- `GET /audit-logs/`
- `GET /audit-logs/:id`

---

### 11. Notifications

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View notifications | Y | Y | Y |
| Mark as read | Y | Y | Y |

**APIs:**
- `GET /notifications/`
- `GET /notifications/unread`
- `GET /notifications/unread-count`
- `PUT /notifications/:id/mark-as-read`
- `PUT /notifications/mark-all-as-read`

---

### 12. Ratings & Reviews

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| View driver reviews | Y | Y | School only |
| View driver average rating | Y | Y | School only |

**APIs:**
- `GET /ratings-reviews/driver/:driverId`
- `GET /ratings-reviews/driver/:driverId/rating`

---

### 13. System Maintenance (Super Admin Only)

| Feature | Super Admin | Admin | School Admin |
|---------|:-----------:|:-----:|:------------:|
| Clean old tracking data | Y | - | - |

**APIs:**
- `POST /tracking/admin/cleanup`

---

## Sidebar Menu Structure

### Super Admin / Admin Sidebar

```
Dashboard
User Management
  ├── Parents
  ├── Drivers (with approval badge count)
  └── Students
Admin Management
School Management
  ├── Schools
  ├── School Admins
  └── School Drivers
Trip Management
  ├── All Trips
  └── Live Tracking
Assignments
  ├── Driver-Student
  └── School Assignments
Billing
  ├── Subscription Plans
  ├── Parent Subscriptions
  ├── School Subscriptions
  ├── Redemption Codes
  └── Payments
Roles & Permissions
Ratings & Reviews
Audit Logs
Notifications
Settings
```

### School Admin Sidebar

```
Dashboard
Drivers
  ├── School Drivers
  └── Driver Approvals
Students
Trips
  ├── School Trips
  └── Live Tracking
Assignments
  ├── Driver-Student
  └── School Assignments
Subscriptions
  ├── School Subscription
  └── Redemption Codes
Ratings & Reviews
Notifications
Settings
```

---

## Key Pages Detail

### Dashboard Page
- **Cards:** Total Parents, Total Drivers, Total Students, Active Trips, Revenue (this month), Pending Approvals
- **Charts:** Trips over time, Revenue trend, Subscriptions by plan type
- **Tables:** Recent trips, Pending driver approvals, Expiring subscriptions

### Driver Approval Page
- Driver personal info + photo
- Vehicle details
- Uploaded documents (license, insurance) — view/download
- Approve / Reject buttons with reason field

### Trip Detail Page
- Trip info: driver, date, status, type (pickup/drop)
- Student list with attendance + pickup/drop status
- Map view with route geometry and waypoints
- Timeline: trip events in chronological order
- Tracking history playback

### Subscription Plan Management Page
- Plan cards with badge, price, features
- Create/edit form: name, type, pricing model, prices, features, badge
- Toggle active/inactive

### School Subscription Page
- Active subscription details
- Generate redemption codes (bulk)
- View codes: code, status (available/redeemed), assigned student
- Renew / cancel actions

### Payment History Page
- Table: parent, amount, plan, method, status, date
- Filters: status, payment method, date range
- Refund action for completed payments

---

## Notes for Frontend Development

1. **Authentication:** Admin portal uses email + password login (`POST /admin/login`). Store JWT in httpOnly cookie or secure storage.

2. **School Admin Auth:** Separate login flow (`POST /school-admin/login`). After login, scope all queries to their school.

3. **Role-based routing:** Use route guards to hide menu items and pages based on role. The token payload contains the user's role.

4. **Real-time features:** Connect to Socket.IO for live trip tracking on the map view. Listen to `trip:position_update` events.

5. **Pagination:** Most list endpoints support pagination via query params. Implement infinite scroll or page-based navigation.

6. **File viewing:** Driver documents (license, insurance photos) are served from the configured storage provider. Use the URL from the driver details API.

7. **ID convention:** The backend uses custom IDs (admin_id, driver_id, etc.) in responses to avoid exposing MongoDB `_id`. Use the `by-admin-id` style endpoints where available.
