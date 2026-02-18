# School-Based Transport System Implementation Guide

## Overview

The system supports two parallel transport management models:

1. **Parent Model**: Parents directly subscribe and assign drivers to their students
2. **School Model**: Schools assign their employed drivers to students whose parents have paid fees to the school

**Key Difference in School Model:**

- Parent pays fees to school **outside the system** (school's own payment/billing system)
- School creates a **school subscription** (school-level) and generates **per-student redemption codes**
- Parent may redeem code in app (optional, for tracking and showing subscription status to parent)
- School can assign drivers regardless of code redemption
- Code redemption is NOT payment, and is NOT a blocker for assignment—it's only for tracking/analytics and parent visibility

Both models use the same dynamic routing and trip generation logic. The key difference is the **assignment source** (parent vs school_admin) and **payment verification** (code redemption).

---

## Database Schema

### Collections

#### 1. **school_subscriptions**

School-level subscription record. One per school per billing period.

```
{
  subscription_id: string       // PK, prefix: SCHSUB
  school_id: string             // FK to schools
  plan_id: string               // FK to subscription_plans
  start_date: Date
  end_date: Date
  subscription_status: enum     // 'active', 'expired', 'cancelled', 'pending'
  auto_renew: boolean
  max_drivers?: number          // Maximum drivers allowed under this subscription
  max_students?: number         // Maximum students allowed under this subscription
  billing_contact?: string      // Contact person for billing
  created_at: Date
  updated_at?: Date
}
```

**Purpose:**

- Represents the school's subscription to the transport platform
- Admin creates this, then generates per-student codes under it
- Does NOT contain per-parent or per-student fields

---

#### 2. **school_student_codes**

Per-student redemption codes generated under a school subscription.

```
{
  code_id: string                   // PK, prefix: SSC
  code: string                      // Unique redemption code, prefix: SCHSTDCD
  school_subscription_id: string    // FK to school_subscriptions
  school_id: string                 // FK to schools
  student_id: string                // FK to students
  plan_id: string                   // FK to subscription_plans
  end_date: Date
  is_redeemed: boolean
  redeemed_by_parent_id?: string    // Parent who redeemed this code
  redeemed_at?: Date
  created_at: Date
}
```

**Purpose:**

- School admin generates codes for specific students
- Parent redeems code in app to link it to their account (optional, for tracking/visibility)
- Code redemption is NOT required for driver assignment

---

### Modified Collections

#### 1. **driver_student_assignments**

Tracks assignment source (parent or school_admin).

**Key Fields:**

- `assigned_by` varchar(36) — FK to parent_id or school_admin_id depending on source
- `assignment_source` enum — `'parent'`, `'school_admin'`, or `'system'`

**Logic:**

- If `assignment_source = 'school_admin'`: Assigned by school admin, status is `active` immediately
- If `assignment_source = 'parent'`: Assigned by parent, status starts as `pending`

#### 2. **drivers**

School employment relationship.

- `school_id` varchar(36) — FK to schools (nullable)
- Can be NULL (independent driver) or populated (employed by a school)

---

## API Endpoints

All endpoints are prefixed with `/api`.

### 1. School Admin Authentication

**Base path:** `/api/school-admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | None | Register school admin account |
| POST | `/login` | None | Login school admin |
| GET | `/me` | Admin | Get current admin profile |
| PATCH | `/update` | Admin | Update admin profile |
| POST | `/change-password` | Admin | Change admin password |
| GET | `/:schoolId` | Admin | Get all admins for a school |
| POST | `/:adminId/deactivate` | Admin | Deactivate an admin |

---

### 2. School Driver Management

**Base path:** `/api/school-driver`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:schoolId` | Admin | List drivers employed by school |
| POST | `/assign` | Admin | Assign driver to school |
| POST | `/:driverId/remove` | Admin | Remove driver from school |
| GET | `/:driverId/details` | Admin | Get driver details |

---

### 3. School Assignment Management

**Base path:** `/api/school-assignments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:schoolId` | Admin | Get all assignments for school |
| GET | `/:schoolId/pending` | Admin | Get pending assignments |
| GET | `/:schoolId/driver/:driverId` | Admin | Get assignments by driver |
| POST | `/:schoolId/create` | Admin | Create school assignment (immediately active) |
| POST | `/:assignmentId/approve` | Admin | Approve a pending assignment |
| POST | `/:assignmentId/reject` | Admin | Reject an assignment |

**Create Assignment Request Body:**

```json
{
  "driver_id": "DRIVER-001",
  "student_id": "STUDENT-001",
  "monthly_fee": 5000,
  "start_date": "2026-02-01"
}
```

**Note:** School assignments are created with `assignment_status: 'active'` and `assignment_source: 'school_admin'` immediately—no approval needed.

---

### 4. School Subscriptions (Admin-Managed)

**Base path:** `/api/school-subscriptions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Admin | Create new school subscription |
| GET | `/school/:schoolId` | Admin | Get all subscriptions for a school |
| GET | `/school/:schoolId/active` | Admin | Get active subscription for school |
| GET | `/:subscriptionId` | Admin | Get subscription by ID |
| PATCH | `/:subscriptionId` | Admin | Update subscription |
| POST | `/:subscriptionId/renew` | Admin | Renew subscription |
| POST | `/:subscriptionId/cancel` | Admin | Cancel subscription |
| GET | `/expired/list` | Admin | Get expired subscriptions |
| POST | `/:subscriptionId/generate-codes` | Admin | Generate per-student redemption codes |
| GET | `/:subscriptionId/codes` | Admin | Get all student codes for a subscription |

**Create Subscription Request Body:**

```json
{
  "school_id": "SCHOOL-001",
  "plan_id": "PLAN-001",
  "start_date": "2026-02-01",
  "end_date": "2026-03-01",
  "auto_renew": false,
  "max_drivers": 10,
  "max_students": 50,
  "billing_contact": "admin@school.com"
}
```

**Generate Student Codes Request Body:**

```json
{
  "student_ids": ["STUDENT-001", "STUDENT-002"]
}
```

---

### 5. Parent Redemption (Parent-Facing)

**Base path:** `/api/redemptions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/redeem` | Parent | Redeem school subscription code |
| GET | `/active` | Parent | Get active subscription |
| GET | `/` | Parent | Get all parent subscriptions |
| GET | `/:subscriptionId` | Parent | Get subscription details |
| POST | `/cancel` | Parent | Cancel subscription |
| GET | `/status/check` | Parent | Check if parent has active subscription |
| GET | `/available/codes` | None | Get available (unredeemed) codes |

**Redeem Code Request Body:**

```json
{
  "subscription_code": "SCHSTDCD-ABC123"
}
```

**Cancel Subscription Request Body:**

```json
{
  "subscription_id": "SUB-001"
}
```

---

### 6. School Management (CRUD)

**Base path:** `/api/schools`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | None | Get all schools |
| GET | `/:school_id` | None | Get school by ID |
| POST | `/admin` | Admin | Create school |
| PUT | `/admin/:school_id` | Admin | Update school |
| DELETE | `/admin/:school_id` | Admin | Delete school |

---

## Enums

### AssignmentSource

```typescript
enum AssignmentSource {
  PARENT = "parent",
  SCHOOL_ADMIN = "school_admin",
  SYSTEM = "system",
}
```

### SchoolSubscriptionStatus

```typescript
enum SchoolSubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
}
```

### SubscriptionSource

```typescript
enum SubscriptionSource {
  SELF_PAY = "self_pay",
  SCHOOL_REDEMPTION = "school_redemption",
}
```

---

## Code Module Structure

### School Subscription Module

```
src/modules/billing/school_subscription/
  school_subscription.controller.ts    # HTTP handlers
  school_subscription.service.ts       # Business logic (create, renew, generate codes)
  school_subscription.repository.ts    # Data access (extends BaseRepository<SchoolSubscription>)
  school_subscription.routes.ts        # Route definitions
  school_subscription.type.ts          # SchoolSubscription interface
  school_subscription.validation.ts    # Joi schemas
  school_student_code.type.ts          # SchoolStudentCode interface
  school_student_code.repository.ts    # Data access for student codes
```

### Redemption Module

```
src/modules/billing/redemption/
  redemption.controller.ts    # Parent-facing HTTP handlers
  redemption.service.ts       # Redeem code, get subscriptions, cancel
  redemption.routes.ts        # Route definitions
  redemption.validation.ts    # Joi schemas
```

### School Assignment Module

```
src/modules/trips/school_assignment/
  school_assignment.controller.ts    # School admin assignment handlers
  school_assignment.routes.ts        # Route definitions
```

### School Admin Module

```
src/modules/school_admin/
  school_admin.controller.ts    # Auth + profile handlers
  school_admin.routes.ts        # Route definitions
  school_admin.validation.ts    # Joi schemas
```

### School Driver Module

```
src/modules/users/school_driver/
  school_driver.controller.ts    # Driver-school management handlers
  school_driver.routes.ts        # Route definitions
```

---

## Business Logic

### Code Redemption (Tracking Only)

- **School Assignment Rule:** School can assign drivers to any student whose parent has paid fees (tracked in school's own system). Code redemption is NOT required for assignment.
- **Parent Assignment Rule:** Parents assign drivers directly using `driver_unique_id`. Assignment starts as `pending` and requires driver approval.
- **Code Redemption Process:**
  1. Admin creates a school subscription
  2. Admin generates per-student codes under that subscription (`POST /:subscriptionId/generate-codes`)
  3. School distributes codes to parents (outside the system)
  4. Parent may redeem code in app (`POST /api/redemptions/redeem`) — optional, for tracking/visibility
  5. Redemption creates a `parent_subscription` with `source: 'school_redemption'`
- **Assignment Creation:** Always sets `assignment_source` field correctly (`parent` or `school_admin`)
- **Trip Generation:** Independent of source (same algorithm for both parent and school assignments)

---

## Deployment Checklist

### Database

- [x] Create `school_subscriptions` collection
- [x] Create `school_student_codes` collection
- [x] Add `assigned_by` and `assignment_source` to `driver_student_assignments`
- [x] Add `school_id` to `drivers` collection

### Backend API

- [x] School admin auth (register, login, profile, password)
- [x] School driver management (assign, remove, list, details)
- [x] School assignment endpoints (create, approve, reject, list)
- [x] School subscription CRUD (create, update, renew, cancel, expired)
- [x] Per-student code generation
- [x] Parent code redemption
- [x] Parent subscription listing and cancellation

### Frontend (Pending)

- [ ] Admin: School management dashboard
- [ ] Admin: Subscription code generation and tracking UI
- [ ] Driver: School employment indicator and assignment type badges
- [ ] Parent: Code redemption UI (input field + validation)
- [ ] Parent: Conditional assignment UI (parent vs school managed)
