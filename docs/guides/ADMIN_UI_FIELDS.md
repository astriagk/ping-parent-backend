# Admin UI — Fields & Data Requirements

> Reference for **what to display** in each admin screen and **what to aggregate** in each API response.
> Derived from actual route files: `admin.routes.ts`, `superadmin.routes.ts`, `school-admin.routes.ts`.

---

## Gateways & Role Access

| Gateway | Middleware | Who Accesses |
|---------|-----------|--------------|
| `/api/admin` | `verifyAdminOrAboveToken` | superadmin + admin (school_admin does NOT use this gateway) |
| `/api/superadmin` | `verifySuperadminToken` | superadmin only |
| `/api/school-admin` | `verifySchoolAdminToken` | school_admin only |

> **School Admin has a very limited gateway** (`school-admin.routes.ts`):
> only their own school info + school drivers. All other school_admin actions go through `/api/admin` with scoping at the service level.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[own]` | Field from own collection |
| `[ref: X]` | Joined/aggregated from collection X |
| **Bold** | Primary/key display field |
| ~~Strikethrough~~ | Never expose to frontend |
| `SA` | Super Admin only |
| `SA + A` | Super Admin + Admin |
| `SA + A + SchA` | All admin roles |

---

## 1. Parents

**Routes:** `GET /api/admin/management/users?user_type=parent`, `GET /api/admin/management/parents/:id/details`
**Who:** `SA + A`
**Collections:** `parents` + `users` + `parent_addresses` + `students` + `parent_subscriptions` + `subscription_plans`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Name** | `parents.name` | |
| 2 | Phone | `users.phone_number` | ref via `parents.user_id` |
| 3 | Email | `parents.email` | |
| 4 | No. of Students | count `students` where `parent_id` | Aggregated |
| 5 | Subscription Status | `parent_subscriptions.subscription_status` | Latest record |
| 6 | Active | `users.is_active` | Badge |
| 7 | Joined On | `parents.created_at` | |

### Detail View

**Section: Basic Info**
| Field | Source |
|-------|--------|
| Name | `parents.name` |
| Email | `parents.email` |
| Phone | `users.phone_number` |
| Photo | `parents.photo_url` |
| Account Status | `users.is_active` |
| Last Login | `users.last_login` |
| Joined On | `parents.created_at` |

**Section: Students** (table within detail)
| Field | Source |
|-------|--------|
| Student Name | `students.student_name` |
| School | `schools.school_name` ref via `students.school_id` |
| Class / Section | `students.class`, `students.section` |
| Active | `students.is_active` |

**Section: Addresses**
| Field | Source |
|-------|--------|
| Address | `parent_addresses.address_line1`, `address_line2` |
| City / State | `parent_addresses.city`, `state` |
| Pincode | `parent_addresses.pincode` |
| Primary | `parent_addresses.is_primary` |

**Section: Subscription**
| Field | Source |
|-------|--------|
| Plan Name | `subscription_plans.plan_name` ref via `parent_subscriptions.plan_id` |
| Plan Type | `subscription_plans.plan_type` |
| Status | `parent_subscriptions.subscription_status` |
| Start / End Date | `parent_subscriptions.start_date`, `end_date` |
| Auto Renew | `parent_subscriptions.auto_renew` |

---

## 2. Drivers

**Routes:** `GET /api/admin/management/users?user_type=driver`, `GET /api/admin/management/drivers/:id/details`, `PATCH /api/admin/management/drivers/:id/approval-status`
**Who:** `SA + A`
**Collections:** `drivers` + `users` + `driver_addresses` + `driver_documents` + `schools`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Driver ID** | `drivers.driver_unique_id` | Searchable |
| 2 | **Name** | `drivers.name` | |
| 3 | Phone | `users.phone_number` | ref via `drivers.user_id` |
| 4 | Vehicle Type | `drivers.vehicle_type` | van / auto / bus |
| 5 | Vehicle No. | `drivers.vehicle_number` | |
| 6 | School | `schools.school_name` | ref via `drivers.school_id`; "Independent" if null |
| 7 | Approval Status | `drivers.approval_status` | Badge: pending / approved / rejected |
| 8 | Available | `drivers.is_available` | |
| 9 | Rating | `drivers.rating` | ⭐ x.x |
| 10 | Students | `drivers.current_student_count` / `drivers.vehicle_capacity` | |
| 11 | Joined On | `drivers.created_at` | |

### Detail View

**Section: Basic Info**
| Field | Source |
|-------|--------|
| Driver Unique ID | `drivers.driver_unique_id` |
| Name | `drivers.name` |
| Email | `drivers.email` |
| Phone | `users.phone_number` |
| Photo | `drivers.photo_url` |
| Account Status | `users.is_active` |
| Approval Status | `drivers.approval_status` |
| Rejection Reason | `drivers.rejection_reason` |
| Approved By | `admin_portal.username` ref via `drivers.approved_by` |
| Approved At | `drivers.approved_at` |
| Last Login | `users.last_login` |

**Section: Vehicle**
| Field | Source |
|-------|--------|
| Vehicle Type | `drivers.vehicle_type` |
| Vehicle Number | `drivers.vehicle_number` |
| Vehicle Capacity | `drivers.vehicle_capacity` |
| Current Students | `drivers.current_student_count` |
| Available | `drivers.is_available` |

**Section: School Assignment**
| Field | Source |
|-------|--------|
| School Name | `schools.school_name` ref via `drivers.school_id` |
| School City | `schools.city` |

**Section: Documents**
| Field | Source |
|-------|--------|
| Driving License No. | `driver_documents.driving_license_number` |
| Driving License Photo | `driver_documents.driving_license_photo_url` |
| Vehicle License No. | `driver_documents.vehicle_license_number` |
| Vehicle License Photo | `driver_documents.vehicle_license_photo_url` |
| Insurance No. | `driver_documents.insurance_number` |
| Insurance Photo | `driver_documents.insurance_photo_url` |

**Section: Address**
| Field | Source |
|-------|--------|
| Address | `driver_addresses.address_line1`, `address_line2` |
| City / State | `driver_addresses.city`, `state` |
| Pincode | `driver_addresses.pincode` |

**Section: Stats**
| Field | Source |
|-------|--------|
| Total Trips | `drivers.total_trips` |
| Rating | `drivers.rating` |

---

## 3. Students

**Routes:** `GET /api/admin/students/school/:schoolId`
**Who:** `SA + A` (scoped by schoolId); `SchA` uses same endpoint scoped to own school
**Collections:** `students` + `parents` + `users` + `schools`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Student Name** | `students.student_name` | |
| 2 | Parent Name | `parents.name` ref via `students.parent_id` | |
| 3 | Parent Phone | `users.phone_number` ref via `parents.user_id` | |
| 4 | School | `schools.school_name` ref via `students.school_id` | |
| 5 | Class / Section | `students.class`, `students.section` | |
| 6 | Roll No. | `students.roll_number` | |
| 7 | Gender | `students.gender` | |
| 8 | Active | `students.is_active` | Badge |
| 9 | Added On | `students.created_at` | |

### Detail View (Screen 8)

**Section: Basic Info**
| Field | Source |
|-------|--------|
| Student Name | `students.student_name` |
| Photo | `students.photo_url` |
| Class / Section | `students.class`, `students.section` |
| Roll Number | `students.roll_number` |
| Gender | `students.gender` |
| Date of Birth | `students.date_of_birth` |
| Emergency Contact | `students.emergency_contact` |
| Medical Info | `students.medical_info` |
| Active | `students.is_active` |

**Section: Parent**
| Field | Source |
|-------|--------|
| Parent Name | `parents.name` ref via `students.parent_id` |
| Parent Phone | `users.phone_number` ref via `parents.user_id` |
| Parent Email | `parents.email` |

**Section: School**
| Field | Source |
|-------|--------|
| School Name | `schools.school_name` ref via `students.school_id` |

**Section: Trip History** (table within detail)
| Field | Source |
|-------|--------|
| Trip Date | `trips.trip_date` |
| Trip Type | `trips.trip_type` |
| Driver Name | `drivers.name` |
| Attendance Status | `trip_students.attendance_status` |
| Pickup Status | `trip_students.pickup_status` |

---

## 4. Schools

**Routes:** `GET /api/admin/schools`, `GET /api/admin/schools/:school_id`
**Who:** `SA + A` (CRUD); `SchA` via `GET /api/school-admin/school` (read own school only)
**Collections:** `schools` + `school_subscriptions` + `subscription_plans` + `admin_portal` + `drivers` + `students`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **School Name** | `schools.school_name` | |
| 2 | City / State | `schools.city`, `schools.state` | |
| 3 | Contact | `schools.contact_number` | |
| 4 | Email | `schools.email` | |
| 5 | Drivers Count | count `drivers` where `school_id` | Aggregated |
| 6 | Students Count | count `students` where `school_id` | Aggregated |
| 7 | Subscription Status | `school_subscriptions.subscription_status` | Latest active |
| 8 | Added On | `schools.created_at` | |

### Detail View

**Section: School Info**
| Field | Source |
|-------|--------|
| School Name | `schools.school_name` |
| Address | `schools.address` |
| City / State | `schools.city`, `schools.state` |
| Contact | `schools.contact_number` |
| Email | `schools.email` |
| Coordinates | `schools.latitude`, `schools.longitude` |

**Section: Active Subscription**
| Field | Source |
|-------|--------|
| Plan Name | `subscription_plans.plan_name` |
| Plan Type | `subscription_plans.plan_type` |
| Status | `school_subscriptions.subscription_status` |
| Start / End Date | `school_subscriptions.start_date`, `end_date` |
| Max Drivers | `school_subscriptions.max_drivers` |
| Max Students | `school_subscriptions.max_students` |
| Billing Contact | `school_subscriptions.billing_contact` |
| Auto Renew | `school_subscriptions.auto_renew` |

**Section: School Admins** (table within detail)
| Field | Source |
|-------|--------|
| Username | `admin_portal.username` where `admin_portal.school_id = schools._id` |
| Email | `admin_portal.email` |
| Active | `admin_portal.is_active` |
| Last Login | `admin_portal.last_login` |

**Section: Stats**
| Field | Source |
|-------|--------|
| Total Drivers | count from `drivers` |
| Total Students | count from `students` |

---

## 5. School Drivers (Driver ↔ School Assignment)

> Distinct from driver-student assignments. This is linking a **driver account to a school**.

**Routes:**
- `GET /api/admin/school-drivers/:schoolId` — list drivers in a school
- `POST /api/admin/school-drivers/assign` — assign driver to school
- `POST /api/admin/school-drivers/:driverId/remove` — remove driver from school
- `GET /api/admin/school-drivers/:driverId/details` — driver details
- `GET /api/school-admin/drivers` — SchA views drivers in own school
- `POST /api/school-admin/drivers` — SchA assigns a driver to own school

**Who:** `SA + A` (all schools); `SchA` (own school only, limited to view + assign — no remove)
**Collections:** `drivers` + `users` + `schools` + `school_subscriptions`

### List View (Table) — No separate detail page (links to Driver detail)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Driver ID** | `drivers.driver_unique_id` | |
| 2 | **Driver Name** | `drivers.name` | |
| 3 | Phone | `users.phone_number` ref via `drivers.user_id` | |
| 4 | Vehicle Type | `drivers.vehicle_type` | |
| 5 | Vehicle No. | `drivers.vehicle_number` | |
| 6 | Capacity | `drivers.vehicle_capacity` | |
| 7 | Current Students | `drivers.current_student_count` | |
| 8 | Approval Status | `drivers.approval_status` | Must be approved |
| 9 | Available | `drivers.is_available` | |
| 10 | Subscription Limit | `school_subscriptions.max_drivers` | Show remaining slots |

> **Capacity guard:** API blocks assignment if `current_driver_count >= school_subscriptions.max_drivers`

---

## 6. School Assignments (School Admin → Driver → Students)

> School admin directly creating driver-to-student assignments (bypassing parent request flow). Source = `school_admin`.

**Routes:**
- `GET /api/admin/school-assignments/:schoolId` — all assignments for school
- `GET /api/admin/school-assignments/:schoolId/pending` — pending assignments
- `GET /api/admin/school-assignments/:schoolId/driver/:driverId` — by driver
- `POST /api/admin/school-assignments/:schoolId/create` — create (driver + student_ids)
- `POST /api/admin/school-assignments/:assignmentId/approve` — approve pending
- `POST /api/admin/school-assignments/:assignmentId/reject` — reject with reason

**Who:** `SA + A` (all schools); school_admin scoped to own school via `schoolId` param
**Collections:** `driver_student_assignments` + `drivers` + `students` + `parents` + `schools`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Driver Name** | `drivers.name` ref via `driver_student_assignments.driver_id` | |
| 2 | Driver Unique ID | `drivers.driver_unique_id` | |
| 3 | Student Name | `students.student_name` ref via `driver_student_assignments.student_id` | |
| 4 | Parent Name | `parents.name` ref via `students.parent_id` | |
| 5 | Class | `students.class`, `students.section` | |
| 6 | Monthly Fee | `driver_student_assignments.monthly_fee` | |
| 7 | Status | `driver_student_assignments.assignment_status` | Badge: active / pending / parent_requested / rejected / inactive |
| 8 | Source | `driver_student_assignments.assignment_source` | parent / school_admin / system |
| 9 | Rejection Reason | `driver_student_assignments.rejection_reason` | Only when rejected |
| 10 | Assigned Date | `driver_student_assignments.assigned_date` | |
| 11 | Start Date | `driver_student_assignments.start_date` | |

> **Pending tab** is key — shows `parent_requested` and `pending` entries waiting for school approval.

---

## 7. Driver-Student Assignments (Parent-initiated — Global View)

> Admin-level view of all assignments across all schools. Source can be `parent`, `school_admin`, or `system`.

**Routes:** `GET /api/admin/assignments`, `GET /api/admin/assignments/parent-requested`
**Who:** `SA + A`
**Collections:** `driver_student_assignments` + `drivers` + `students` + `parents` + `schools`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Driver Name** | `drivers.name` | |
| 2 | Driver Unique ID | `drivers.driver_unique_id` | |
| 3 | Student Name | `students.student_name` | |
| 4 | Parent Name | `parents.name` | |
| 5 | School | `schools.school_name` ref via `students.school_id` | |
| 6 | Monthly Fee | `driver_student_assignments.monthly_fee` | |
| 7 | Status | `driver_student_assignments.assignment_status` | |
| 8 | Source | `driver_student_assignments.assignment_source` | |
| 9 | Assigned Date | `driver_student_assignments.assigned_date` | |

> **Parent-requested tab** (`/parent-requested`) shows only `assignment_status = parent_requested` — admin review queue.

---

## 8. Trips

**Routes:** `GET /api/admin/trips`
**Who:** `SA + A`
**Collections:** `trips` + `drivers` + `schools` + `trip_students` + `students`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Trip Date** | `trips.trip_date` | |
| 2 | Trip Type | `trips.trip_type` | pickup / drop |
| 3 | Driver Name | `drivers.name` ref via `trips.driver_id` | |
| 4 | Driver Unique ID | `drivers.driver_unique_id` | |
| 5 | School | `schools.school_name` ref via `trips.school_id` | |
| 6 | Status | `trips.trip_status` | Badge: scheduled / started / in_progress / completed / cancelled |
| 7 | Students Count | count from `trip_students` where `trip_id` | |
| 8 | Start Time | `trips.start_time` | |
| 9 | End Time | `trips.end_time` | |
| 10 | Distance (km) | `trips.total_distance` | |

### Detail View

**Section: Trip Info**
| Field | Source |
|-------|--------|
| Trip Date | `trips.trip_date` |
| Trip Type | `trips.trip_type` |
| Status | `trips.trip_status` |
| Start Time | `trips.start_time` |
| End Time | `trips.end_time` |
| Total Distance | `trips.total_distance` |

**Section: Driver**
| Field | Source |
|-------|--------|
| Driver Name | `drivers.name` |
| Driver Unique ID | `drivers.driver_unique_id` |
| Vehicle | `drivers.vehicle_type`, `drivers.vehicle_number` |
| Phone | `users.phone_number` ref via `drivers.user_id` |

**Section: School**
| Field | Source |
|-------|--------|
| School Name | `schools.school_name` |
| City | `schools.city` |

**Section: Students on Trip** (table within detail)
| Field | Source |
|-------|--------|
| Student Name | `students.student_name` ref via `trip_students.student_id` |
| Sequence | `trip_students.sequence_order` |
| Attendance | `trip_students.attendance_status` |
| Pickup Status | `trip_students.pickup_status` |
| Pickup Time | `trip_students.pickup_time` |
| Drop Time | `trip_students.drop_time` |
| ETA | `trip_students.estimated_arrival_time` |

---

## 9. Payments

**Routes:** `GET /api/admin/payments`, `GET /api/admin/payments/:id`
**Who:** `SA + A`
**Collections:** `payments` + `parents` + `users` + `parent_subscriptions` + `subscription_plans`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Transaction ID** | `payments.transaction_id` | Searchable |
| 2 | Parent Name | `parents.name` ref via `payments.parent_id` | |
| 3 | Parent Phone | `users.phone_number` ref via `parents.user_id` | |
| 4 | Payment Type | `payments.payment_type` | subscription / penalty |
| 5 | Amount | `payments.amount` | with `payments.currency` |
| 6 | Payment Method | `payments.payment_method` | card / upi / netbanking / wallet / cash |
| 7 | Status | `payments.payment_status` | Badge: pending / completed / failed / refunded |
| 8 | Plan Name | `subscription_plans.plan_name` | 3-hop join (see below) |
| 9 | Payment Date | `payments.payment_date` | |

### Detail View

All list fields plus:

| Field | Source |
|-------|--------|
| Currency | `payments.currency` |
| Gateway Response | `payments.gateway_response` | `SA` only — raw JSON expandable |
| Subscription Start | `parent_subscriptions.start_date` |
| Subscription End | `parent_subscriptions.end_date` |

> **3-hop join for Plan Name:**
> `payments.subscription_id` → `parent_subscriptions._id` → `parent_subscriptions.plan_id` → `subscription_plans.plan_name`

---

## 10. Parent Subscriptions

**Routes:** `GET /api/admin/subscriptions`
**Who:** `SA + A`
**Collections:** `parent_subscriptions` + `parents` + `subscription_plans`

### List View (Table) — No detail page

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Parent Name** | `parents.name` ref via `parent_subscriptions.parent_id` | |
| 2 | Parent Phone | `users.phone_number` ref via `parents.user_id` | |
| 3 | Plan Name | `subscription_plans.plan_name` ref via `parent_subscriptions.plan_id` | |
| 4 | Plan Type | `subscription_plans.plan_type` | monthly / quarterly / yearly |
| 5 | Status | `parent_subscriptions.subscription_status` | active / expired / cancelled |
| 6 | Start Date | `parent_subscriptions.start_date` | |
| 7 | End Date | `parent_subscriptions.end_date` | |
| 8 | Auto Renew | `parent_subscriptions.auto_renew` | |
| 9 | Created On | `parent_subscriptions.created_at` | |

---

## 11. Subscription Plans

**Routes:** `POST/PUT /api/admin/subscription-plans`, `PATCH .../activate`, `PATCH .../deactivate`
**Who:** `SA + A` (full CRUD on `/api/admin` — NOTE: both can manage plans here)
**Collections:** `subscription_plans`

### List View (Table) — No detail page

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Plan Name** | `subscription_plans.plan_name` | |
| 2 | Plan Type | `subscription_plans.plan_type` | monthly / quarterly / yearly |
| 3 | Price | `subscription_plans.price` | with currency (INR) |
| 4 | Features | `subscription_plans.features` | JSON — display as bullet list |
| 5 | Active | `subscription_plans.is_active` | Toggle |
| 6 | Created On | `subscription_plans.created_at` | |

---

## 12. School Subscriptions

**Routes:** `POST /api/admin/school-subscriptions`, `GET .../school/:schoolId`, `GET .../school/:schoolId/active`, `PATCH /:subscriptionId`, `/renew`, `/cancel`
**Who:** `SA + A` (manage); `SchA` (read own via `/active`)
**Collections:** `school_subscriptions` + `schools` + `subscription_plans`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **School Name** | `schools.school_name` ref via `school_subscriptions.school_id` | |
| 2 | Plan Name | `subscription_plans.plan_name` ref via `school_subscriptions.plan_id` | |
| 3 | Plan Type | `subscription_plans.plan_type` | |
| 4 | Status | `school_subscriptions.subscription_status` | Badge: active / expired / cancelled / pending |
| 5 | Start Date | `school_subscriptions.start_date` | |
| 6 | End Date | `school_subscriptions.end_date` | |
| 7 | Max Drivers | `school_subscriptions.max_drivers` | |
| 8 | Max Students | `school_subscriptions.max_students` | |
| 9 | Billing Contact | `school_subscriptions.billing_contact` | |
| 10 | Auto Renew | `school_subscriptions.auto_renew` | |

> **Expired tab:** Separate list via `GET /school-subscriptions/expired/list`

---

## 13. School Student Codes (Redemption Codes)

**Routes:** `POST /api/admin/school-subscriptions/:subscriptionId/generate-codes`, `GET .../codes`
**Who:** `SA + A` generate + view (all schools); `SchA` generates + views for own school (same endpoint, scoped by `subscriptionId` belonging to their school)
**Collections:** `school_student_codes` + `students` + `schools` + `parents` + `school_subscriptions`

### List View (Table) — No detail page

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Code** | `school_student_codes.code` | Copyable; prefixed SCHSTDCD |
| 2 | School | `schools.school_name` ref via `school_student_codes.school_id` | |
| 3 | Student Name | `students.student_name` ref via `school_student_codes.student_id` | |
| 4 | Student Class | `students.class`, `students.section` | |
| 5 | Redeemed | `school_student_codes.is_redeemed` | Badge: Redeemed / Pending |
| 6 | Redeemed By | `parents.name` ref via `school_student_codes.redeemed_by_parent_id` | Empty if not redeemed |
| 7 | Redeemed At | `school_student_codes.redeemed_at` | |
| 8 | Valid Until | `school_student_codes.end_date` | Highlight if expired |
| 9 | Created On | `school_student_codes.created_at` | |

> **Generate codes action:** Input is `student_ids[]`. API creates one code per student from the `school_subscription`.

---

## 14. Admin Portal Users

**Routes:** `GET /api/superadmin/admins` (all), `GET /api/admin/management/by-school/:school_id` (school admins)
**Who:** `SA` — full list + manage; `A` — view school admins per school only
**Collections:** `admin_portal` + `schools`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Admin ID** | `admin_portal.admin_id` | Unique display ID |
| 2 | **Username** | `admin_portal.username` | |
| 3 | Email | `admin_portal.email` | |
| 4 | Phone | `admin_portal.phone_number` | |
| 5 | Role | `admin_portal.admin_role` | Badge: superadmin / admin / school_admin |
| 6 | School | `schools.school_name` ref via `admin_portal.school_id` | Only for school_admin |
| 7 | Active | `admin_portal.is_active` | |
| 8 | Last Login | `admin_portal.last_login` | |
| 9 | Created On | `admin_portal.created_at` | |

> ~~`admin_portal.password_hash`~~ — **Never expose**

---

## 15. Roles

**Routes:** `GET /api/superadmin/roles`, `POST/PUT/DELETE /api/superadmin/roles/:id`
**Who:** `SA` only
**Collections:** `roles`

### List View (Table) — No detail page

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Role Name** | `roles.role_name` | e.g. parent, driver, school_admin |
| 2 | Description | `roles.description` | |
| 3 | Created On | `roles.created_at` | |

> Actions: Create, Update, Delete (SA only). These are custom platform roles, not the `admin_portal.admin_role` enum.

---

## 16. Support Tickets

**Routes:** (planned — not yet in routes files)
**Who:** `SA + A`
**Collections:** `support_tickets` + `users` + `parents` or `drivers` + `admin_portal`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Subject** | `support_tickets.subject` | |
| 2 | Raised By | name from `parents` or `drivers` ref via `support_tickets.user_id` | + role badge |
| 3 | Phone | `users.phone_number` | |
| 4 | Priority | `support_tickets.priority` | Badge: low / medium / high / urgent |
| 5 | Status | `support_tickets.ticket_status` | Badge: open / in_progress / resolved / closed |
| 6 | Assigned To | `admin_portal.username` ref via `support_tickets.assigned_to` | |
| 7 | Created On | `support_tickets.created_at` | |
| 8 | Resolved On | `support_tickets.resolved_at` | |

### Detail View

All list fields plus:
| Field | Source |
|-------|--------|
| Full Description | `support_tickets.description` |
| User Type | `users.user_type` |
| Updated At | `support_tickets.updated_at` |

---

## 17. Ratings & Reviews

**Routes:** (planned — not yet in routes files)
**Who:** `SA + A`
**Collections:** `ratings_reviews` + `parents` + `drivers` + `trips`

### List View (Table) — No detail page

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Rating** | `ratings_reviews.rating` | ⭐ 1–5 |
| 2 | Parent Name | `parents.name` ref via `ratings_reviews.parent_id` | |
| 3 | Driver Name | `drivers.name` ref via `ratings_reviews.driver_id` | |
| 4 | Driver Unique ID | `drivers.driver_unique_id` | |
| 5 | Review | `ratings_reviews.review_text` | Truncated in list |
| 6 | Trip Date | `trips.trip_date` ref via `ratings_reviews.trip_id` | |
| 7 | Created On | `ratings_reviews.created_at` | |

---

## 18. Audit Logs

**Routes:** `GET /api/admin/audit-logs`, `GET /api/superadmin/audit-logs`, `GET .../audit-logs/:id`
**Who:** `SA + A` (both gateways expose it)
**Collections:** `audit_logs` + `admin_portal`

### List View (Table) — No separate detail page (expandable row)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Action** | `audit_logs.action_type` | |
| 2 | Entity Type | `audit_logs.entity_type` | e.g. driver, trip, school |
| 3 | Entity ID | `audit_logs.entity_id` | Deep link to entity |
| 4 | Performed By | `admin_portal.username` ref via `audit_logs.user_id` | |
| 5 | IP Address | `audit_logs.ip_address` | |
| 6 | Timestamp | `audit_logs.created_at` | |

> `audit_logs.old_values`, `audit_logs.new_values` — expandable JSON in row detail drawer

---

## 19. Dashboard Stats

> Not a standalone entity — aggregated from multiple collections. Listed here so API responses are complete.

**Routes:** No dedicated endpoint yet — assembled from existing list endpoints with filters.
**Who:** `SA + A` (global); `SchA` (school-scoped)

### Cards (stat counts)

| Card | Query | SA + A | SchA |
|------|-------|:------:|:----:|
| Total Parents | count `parents` | All | count by `school_id` via students |
| Total Drivers | count `drivers` | All | count where `school_id` |
| Pending Driver Approvals | count `drivers` where `approval_status=pending` | All | scoped |
| Total Students | count `students` | All | count where `school_id` |
| Active Trips Today | count `trips` where `trip_date=today, status!=cancelled` | All | scoped |
| Revenue This Month | sum `payments.amount` where `payment_status=completed, this month` | SA + A | ❌ |
| Expiring Subscriptions | count `parent_subscriptions` or `school_subscriptions` expiring in 7 days | SA + A | own school |

### Charts

| Chart | Data Source |
|-------|------------|
| Trips over time (line) | `trips` grouped by `trip_date` |
| Revenue trend (bar) | `payments` grouped by month |
| Subscriptions by plan (donut) | `parent_subscriptions` grouped by `plan_id` → `subscription_plans.plan_name` |

---

## 20. Live Tracking

> Real-time view — no DB list. Data comes from Socket.IO + a single REST call for current position.

**Routes:** `GET /shared/tracking/:tripId/current-position`, `GET /shared/tracking/:tripId/tracking`
**Who:** `SA + A + SchA`

### Map Overlay Fields

| Field | Source | Notes |
|-------|--------|-------|
| Driver Current Lat/Long | `location_tracking` (latest) | Real-time via socket `trip:position_update` |
| Driver Speed | `location_tracking.speed` | |
| Driver Heading | `location_tracking.heading` | For directional marker |
| Student Waypoints | `trip_students` → `parent_addresses` (lat/long) | Pending pickup stops |
| School Location | `schools.latitude`, `schools.longitude` | Destination pin |
| Student Pickup Status | `trip_students.pickup_status` | Color-code waypoints: pending / picked / dropped |

---

## 21. Manage Ads

> Backend routes not yet implemented. Schema from `ads` + `ad_interactions` tables.

**Routes (planned):** `GET/POST /admin/ads`, `PUT/DELETE /admin/ads/:id`, `GET /admin/ads/:id/analytics`
**Who:** `SA + A`
**Collections:** `ads` + `ad_interactions` + `admin_portal` + `schools`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Title** | `ads.title` | |
| 2 | Ad Type | `ads.ad_type` | banner / interstitial / native_card |
| 3 | Media Type | `ads.media_type` | image / video |
| 4 | Target Audience | `ads.target_audience` | all / parents / drivers / school_admin |
| 5 | Target Schools | `schools.school_name[]` ref via `ads.target_school_ids` | "All Schools" if null |
| 6 | Advertiser | `ads.advertiser_name` | |
| 7 | Start / End Date | `ads.start_date`, `ads.end_date` | |
| 8 | Active | `ads.is_active` | Toggle |
| 9 | Impressions | `ads.impression_count` | Denormalized |
| 10 | Clicks | `ads.click_count` | Denormalized |
| 11 | CTR | `click_count / impression_count` | Calculated on frontend |
| 12 | Created By | `admin_portal.username` ref via `ads.created_by` | |

### Detail / Edit View

All list fields plus:

| Field | Source |
|-------|--------|
| Description | `ads.description` |
| Media URL | `ads.media_url` | Preview image/video |
| Click Action | `ads.click_action_type` | url / in_app_screen / none |
| Click URL | `ads.click_url` | |
| Display Frequency | `ads.display_frequency` | Max shows/user/day |
| Priority | `ads.priority` | Higher = shown first |

### Analytics (per ad)

| Field | Source |
|-------|--------|
| Total Impressions | count `ad_interactions` where `type=impression` |
| Total Clicks | count `ad_interactions` where `type=click` |
| Total Dismissals | count `ad_interactions` where `type=dismiss` |
| Impressions over time | `ad_interactions.timestamp` grouped by day |

---

## 22. School Events

> SchA only. Backend routes not yet implemented.

**Routes (planned):** `GET/POST /school-admin/events`, `GET/PUT/PATCH /school-admin/events/:id`
**Who:** `SchA`
**Collections:** `school_events` + `admin_portal` + `schools`

### List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Event Title** | `school_events.event_title` | |
| 2 | Event Type | `school_events.event_type` | sports / holiday / exam / etc. |
| 3 | Event Date | `school_events.event_date` | |
| 4 | End Date | `school_events.end_date` | Multi-day events only |
| 5 | Time | `school_events.start_time` – `school_events.end_time` | |
| 6 | Venue | `school_events.venue` | |
| 7 | Audience | `school_events.audience_scope` | all / class_specific |
| 8 | Target Classes | `school_events.target_classes` | JSON array, shown when class_specific |
| 9 | Mandatory | `school_events.is_mandatory` | |
| 10 | RSVP Required | `school_events.requires_rsvp` | |
| 11 | RSVP Deadline | `school_events.rsvp_deadline` | |
| 12 | Notification Sent | `school_events.notification_sent` | |
| 13 | Cancelled | `school_events.is_cancelled` | Badge |
| 14 | Created By | `admin_portal.username` ref via `school_events.created_by` | |
| 15 | Created On | `school_events.created_at` | |

### Detail View

All list fields plus:

| Field | Source |
|-------|--------|
| Full Description | `school_events.event_description` |
| Attachments | `school_events.attachment_urls` | Downloadable links |
| Cancellation Reason | `school_events.cancellation_reason` | Only if cancelled |

---

## 23. Event RSVPs

> SchA only. Accessed from within Event Detail. Backend routes not yet implemented.

**Routes (planned):** `GET /school-admin/events/:eventId/rsvps`
**Who:** `SchA`
**Collections:** `event_rsvp` + `parents` + `students` + `school_events`

### List View (Table) — No detail page

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Parent Name** | `parents.name` ref via `event_rsvp.parent_id` | |
| 2 | Parent Phone | `users.phone_number` ref via `parents.user_id` | |
| 3 | Student Name | `students.student_name` ref via `event_rsvp.student_id` | |
| 4 | Student Class | `students.class`, `students.section` | For class-specific events |
| 5 | **RSVP Status** | `event_rsvp.rsvp_status` | Badge: attending / not_attending / maybe |
| 6 | Notes | `event_rsvp.notes` | Parent's optional message |
| 7 | Responded At | `event_rsvp.responded_at` | |

### Summary Counts (above table)

| Stat | Query |
|------|-------|
| Attending | count where `rsvp_status=attending` |
| Not Attending | count where `rsvp_status=not_attending` |
| Maybe | count where `rsvp_status=maybe` |
| No Response | total invited - total responded |

---

## 24. Community Board

> SchA only. Backend routes not yet implemented.

**Routes (planned):** `GET /school-admin/community-posts`, `PATCH .../pin`, `PATCH .../hide`, `PATCH .../comments/:id/hide`
**Who:** `SchA`
**Collections:** `community_posts` + `community_post_comments` + `community_post_reactions` + `parents`

### Posts List View (Table)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Post Content** | `community_posts.post_content` | Truncated |
| 2 | Author | `parents.name` ref via `community_posts.author_parent_id` | Show even if `is_anonymous=true` (SchA can see) |
| 3 | Anonymous | `community_posts.is_anonymous` | Flag badge |
| 4 | Post Type | `community_posts.post_type` | general / question / alert / recommendation |
| 5 | Reactions | `community_posts.reaction_count` | Denormalized |
| 6 | Comments | `community_posts.comment_count` | Denormalized |
| 7 | Pinned | `community_posts.is_pinned` | Pin icon |
| 8 | Visible | `community_posts.is_visible` | Hidden badge if false |
| 9 | Moderation Reason | `community_posts.moderation_reason` | Only if hidden |
| 10 | Posted On | `community_posts.created_at` | |

### Post Detail — Comments (table within detail)

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | **Comment** | `community_post_comments.comment_text` | |
| 2 | Author | `parents.name` ref via `community_post_comments.parent_id` | Show even if anonymous |
| 3 | Anonymous | `community_post_comments.is_anonymous` | |
| 4 | Visible | `community_post_comments.is_visible` | Hidden badge if false |
| 5 | Posted On | `community_post_comments.created_at` | |

### Actions

| Action | Field to Update | API |
|--------|----------------|-----|
| Pin post | `community_posts.is_pinned = true` | PATCH `.../pin` |
| Unpin post | `community_posts.is_pinned = false` | PATCH `.../unpin` |
| Hide post | `community_posts.is_visible = false` + `moderation_reason` | PATCH `.../hide` |
| Hide comment | `community_post_comments.is_visible = false` | PATCH `.../comments/:id/hide` |

---

## 25. Reports

> Backend routes not yet implemented. All data is aggregated from existing collections.

**Routes (planned):** `GET /admin/reports/trips`, `/payments`, `/drivers`, `/students`, `/:type/export`
**Who:** `SA + A`

### Trip Reports

| Field | Source |
|-------|--------|
| Total Trips | count `trips` |
| By Status | count grouped by `trips.trip_status` |
| By Type | count grouped by `trips.trip_type` |
| By School | count grouped by `trips.school_id` → `schools.school_name` |
| Avg Duration | avg of `end_time - start_time` |
| Avg Distance | avg `trips.total_distance` |

### Payment Reports

| Field | Source |
|-------|--------|
| Total Revenue | sum `payments.amount` where `status=completed` |
| By Method | sum grouped by `payments.payment_method` |
| By Type | sum grouped by `payments.payment_type` |
| Failed Payments | count where `status=failed` |
| Refunded Amount | sum where `status=refunded` |

### Driver Reports

| Field | Source |
|-------|--------|
| Total Drivers | count `drivers` |
| By Approval Status | count grouped by `drivers.approval_status` |
| Avg Rating | avg `drivers.rating` |
| Total Trips per Driver | `drivers.total_trips` |
| By School | count grouped by `drivers.school_id` |

### Student Attendance Reports

| Field | Source |
|-------|--------|
| Total Present | count `trip_students` where `attendance_status=present` |
| Total Absent | count where `attendance_status=absent` |
| Attendance Rate | present / (present + absent) % |
| No-show Count | count where `pickup_status=no_show` |

---

## Summary — Screen Type & Role Access

Mapped to screens in `ADMIN_PORTAL_SCREENS.md`.

| Screen | Entity | List | Detail | SA | A | SchA |
|--------|--------|:----:|:------:|:--:|:-:|:----:|
| 2 | Dashboard | — | — | ✅ | ✅ | ✅ (scoped) |
| 3–4 | Parents | ✅ | ✅ | ✅ | ✅ | ❌ |
| 5–6 | Drivers | ✅ | ✅ | ✅ | ✅ | ❌ |
| 7–8 | Students | ✅ | ✅ | ✅ | ✅ | ✅ (own school) |
| 9 | Admin Portal Users | ✅ | ❌ | ✅ | ✅ (school_admin only) | ❌ |
| 10–11 | Schools + School Drivers | ✅ | ✅ | ✅ | ✅ | ✅ (read own) |
| 12 | School Admins | ✅ | ❌ | ✅ | ✅ | ❌ |
| 13–14 | Trips | ✅ | ✅ | ✅ | ✅ | ❌ |
| 15 | Live Tracking | — (map) | — | ✅ | ✅ | ✅ |
| 16 | Assignments (global) | ✅ | ❌ | ✅ | ✅ | ❌ |
| 17 | School Assignments | ✅ | ❌ | ✅ | ✅ | ✅ (own school) |
| 18 | Subscription Plans | ✅ | ❌ | ✅ (manage) | ✅ (read) | ✅ (read) |
| 19 | Parent Subscriptions | ✅ | ❌ | ✅ | ✅ | ❌ |
| 20–21 | School Subscriptions + Codes | ✅ | ❌ | ✅ | ✅ | ✅ (own school) |
| 22 | Payments | ✅ | ✅ | ✅ | ✅ | ❌ |
| 23 | Ads | ✅ | ✅ | ✅ | ✅ | ❌ |
| 24 | Support Tickets | ✅ | ✅ | ✅ | ✅ | ❌ |
| 25 | Reports | — (charts) | — | ✅ | ✅ | ❌ |
| 26 | Roles | ✅ | ❌ | ✅ | ❌ | ❌ |
| 27 | Audit Logs | ✅ | ❌ (expandable) | ✅ | ✅ | ❌ |
| 28 | Notifications | ✅ | ❌ | ✅ | ❌ | ✅ (own school) |
| 29 | School Events | ✅ | ✅ | ❌ | ❌ | ✅ |
| 30 | Event RSVPs | ✅ | ❌ | ❌ | ❌ | ✅ |
| 31 | Community Board | ✅ | ✅ (posts + comments) | ❌ | ❌ | ✅ |
| 32 | Ratings & Reviews | ✅ | ❌ | ✅ | ✅ | ❌ |
| 33 | System Maintenance | — (action only) | — | ✅ | ❌ | ❌ |

---

## Aggregation Cheat Sheet

```
Parents list:
  parents
  → LOOKUP users ON user_id → phone_number, is_active, last_login
  → LOOKUP students ON parent_id → COUNT as student_count
  → LOOKUP parent_subscriptions ON parent_id (sort -created_at, limit 1) → subscription_status

Drivers list:
  drivers
  → LOOKUP users ON user_id → phone_number, is_active
  → LOOKUP schools ON school_id → school_name

School Drivers list:
  drivers (filter: school_id = <schoolId>)
  → LOOKUP users ON user_id → phone_number
  → LOOKUP school_subscriptions ON school_id (active) → max_drivers (for capacity display)

Payments list:
  payments
  → LOOKUP parents ON parent_id → name
  → LOOKUP users (via parents.user_id) → phone_number
  → LOOKUP parent_subscriptions ON subscription_id → plan_id
  → LOOKUP subscription_plans ON plan_id → plan_name, plan_type

School Assignments list:
  driver_student_assignments (filter: school_id = <schoolId>)
  → LOOKUP drivers ON driver_id → name, driver_unique_id
  → LOOKUP students ON student_id → student_name, class, section, parent_id, school_id
  → LOOKUP parents ON student.parent_id → name (as parent_name)

Redemption Codes list:
  school_student_codes (filter: school_subscription_id = <subscriptionId>)
  → LOOKUP students ON student_id → student_name, class, section
  → LOOKUP parents ON redeemed_by_parent_id → name (as redeemed_by_name)

Support Tickets list:
  support_tickets
  → LOOKUP users ON user_id → phone_number, user_type
  → LOOKUP parents ON user_id (if user_type=parent) → name
  → LOOKUP drivers ON user_id (if user_type=driver) → name
  → LOOKUP admin_portal ON assigned_to → username
```

---

## Role-Based Field Restrictions

| Field | SA | A | SchA |
|-------|:--:|:-:|:----:|
| `payments.gateway_response` | ✅ | ❌ | ❌ |
| `audit_logs.old_values / new_values` | ✅ | ✅ | ❌ |
| `admin_portal.password_hash` | ❌ | ❌ | ❌ |
| `parents.email` | ✅ | ✅ | ❌ |
| `driver_documents.*` | ✅ | ✅ | ✅ (own school) |
| `school_subscriptions.billing_contact` | ✅ | ✅ | ✅ (own school) |
| `drivers.rejection_reason` | ✅ | ✅ | ✅ (own school) |
| Admin list (all roles) | ✅ | ✅ (school_admin only) | ❌ |
| Roles CRUD | ✅ | ❌ | ❌ |
