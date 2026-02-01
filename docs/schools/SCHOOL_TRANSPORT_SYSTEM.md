# School-Based Transport System Implementation Guide

## Overview

The system now supports two parallel transport management models:

1. **Parent Model**: Parents directly subscribe and assign drivers to their students
2. **School Model**: Schools assign their employed drivers to students whose parents have paid fees to the school

**Key Difference in School Model:**

- Parent pays fees to school **outside the system** (school's own payment/billing system)
- School provides parent with a **unique subscription code** (for tracking/analytics only)
- Parent may redeem code in app (optional, for tracking and showing subscription status to parent)
- School can assign drivers regardless of code redemption
- Code redemption is NOT payment, and is NOT a blocker for assignment—it's only for tracking/analytics and parent visibility

Both models use the same dynamic routing and trip generation logic. The key difference is the **assignment source** (parent vs school) and **payment verification** (code redemption).

---

## Database Changes

### New Tables

#### 1. **school_subscriptions**

Tracks parent-school service subscriptions for transport service.

```sql
CREATE TABLE school_subscriptions (
  subscription_id varchar(36) PRIMARY KEY,
  school_id varchar(36) NOT NULL FOREIGN KEY REFERENCES schools.school_id,
  parent_id varchar(36) NULLABLE FOREIGN KEY REFERENCES parents.parent_id,
  subscription_code varchar(50) UNIQUE NOT NULL,
  plan_id varchar(36) NOT NULL FOREIGN KEY REFERENCES subscription_plans.plan_id,
  start_date date NOT NULL,
  end_date date NOT NULL,
  subscription_status enum ('active', 'expired', 'cancelled') NOT NULL,
  is_redeemed boolean DEFAULT false,
  redeemed_by_parent_id varchar(36) NULLABLE FOREIGN KEY REFERENCES parents.parent_id,
  redeemed_at timestamp NULLABLE,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp,

  UNIQUE KEY unique_school_parent_subscription (school_id, parent_id),
  UNIQUE KEY unique_subscription_code (subscription_code),
  INDEX idx_school_id (school_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_subscription_code (subscription_code),
  INDEX idx_subscription_status (subscription_status),
  INDEX idx_school_parent (school_id, parent_id)
);
```

**Purpose:**

- School generates subscription codes for tracking/analytics
- Parent may redeem code in app (links code to parent account for their own tracking)
- Code redemption is NOT required for assignment, only for showing subscription status to parent and for analytics
- School assigns drivers based on their own records of payment, not code redemption

---

### Modified Tables

#### 1. **driver_student_assignments**

Add fields to track assignment source (parent or school).

**New Columns:**

- `assigned_by` varchar(36) - FK to either parent_id or school_id (nullable)
- `assignment_source` enum ['parent', 'school'] - Indicates source of assignment

**Updated Logic:**

- If `assignment_source = 'school'`: Assigned by school admin
- If `assignment_source = 'parent'`: Assigned by parent directly
- No validation on code redemption for assignment; school assigns based on their own records

#### 2. **drivers**

Add school employment relationship.

**New Columns:**

- `school_id` varchar(36) NULLABLE FOREIGN KEY REFERENCES schools.school_id
- Can be NULL (driver not employed by any school) or populated (employed driver)

**Purpose:**

- Track which drivers are employed by which schools
- Allow schools to only assign their own employed drivers
- Allow drivers to work independently or for a school

#### 3. **payments**

Extend to support parent subscription payments only (school subscriptions are code-based, no payment tracking).

**Existing Columns:** Keep as-is for parent subscription payments

- `parent_id`, `payment_type`, `amount`, `payment_method`, `payment_status`, `subscription_id` (for parent subscriptions)

**Purpose:**

- Track payments for parent subscriptions only
- School subscriptions are code-based and don't require payment tracking
- Schools manage codes internally, no payment flow through app

---

## API Changes

### New Modules/Endpoints

#### 1. **School Authentication**

```
POST /api/v1/school/auth/register
- Register school admin account
- Request: { email, password, school_id, phone_number }
- Response: { admin_id, school_id, token }

POST /api/v1/school/auth/login
- Login school admin
- Request: { email, password }
- Response: { admin_id, school_id, token }

POST /api/v1/school/auth/logout
- Logout school admin
```

#### 2. **School Driver Management**

```
GET /api/v1/school/drivers
- List drivers employed by school
- Response: [ { driver_id, name, vehicle_type, vehicle_number, ... } ]

POST /api/v1/school/drivers/:driverId/assign
- Assign driver to school (add to school_id)
- Request: { driver_id }

POST /api/v1/school/drivers/:driverId/remove
- Remove driver from school
```

#### 3. **School Student Management**

```
GET /api/v1/school/students
- List students whose parents are subscribed to school service
- Query params: { subscription_status, limit, offset }
- Response: [ { student_id, student_name, parent_id, school_id, ... } ]

GET /api/v1/school/students/:studentId
- Get student details if parent is subscribed
```

#### 4. **School Assignment Management**

```
POST /api/v1/school/students/:studentId/assign-driver
- Assign school driver to student (by school)
- Request: { driver_id, monthly_fee }
- Validation:
   - Driver must be employed by this school (driver.school_id = school_id)
   - Student must belong to parent who has paid fees to school (school checks this in their own system)
- **No check for code redemption—assignment is allowed regardless of code status**
- Response: { assignment_id, driver_id, student_id, assignment_source: 'school' }

GET /api/v1/school/assignments
- Get all driver-student assignments made by school
- Filter by assignment_status, student_id, driver_id

POST /api/v1/school/assignments/:assignmentId/approve
- School approves assignment (if needed)

POST /api/v1/school/assignments/:assignmentId/reject
- School rejects assignment
```

#### 5. **School Subscriptions (Code-Based Verification)**

```
POST /api/v1/school/subscriptions/generate-code
- School generates subscription codes (for parents who paid fees)
- Request: { plan_id, parent_list: [parent_ids], start_date, end_date }
  - School selects which parents paid fees → generates codes for them
  - Or bulk generate with quantity, then distribute manually
- Response: [ { subscription_code, plan_id, validity_period, parent_id (optional) } ]
- Code is unredeemed until parent uses it in app

GET /api/v1/school/subscriptions
- List all subscription codes generated by school
- Response: [ { subscription_code, plan_id, status (active/redeemed/expired), redeemed_by_parent (name/id), redeemed_at } ]
- Shows which codes are redeemed by parents

GET /api/v1/school/subscriptions/analytics
- Subscription analytics (generated, redeemed, active, expired, etc.)
```

#### 6. **Parent Side: Redeem School Subscription Code**

```
POST /api/v1/parent/school-subscriptions/redeem
- Parent redeems school subscription code (given by school)
- Request: { subscription_code }
- Validation:
   - Code exists
   - Code not expired
   - Code not already redeemed by another parent
- Logic: Parent redeems code → Links code to parent account for tracking/visibility
- Response: { subscription_id, school_id, school_name, plan_id, valid_until, status: 'active' }

GET /api/v1/parent/school-subscriptions
- Get parent's school subscriptions (redeemed codes only)
- Shows which schools parent is verified/active with in the app (for their own tracking)
- Response: [ { subscription_id, school_id, school_name, status, start_date, end_date } ]

POST /api/v1/parent/school-subscriptions/:subscriptionId/cancel
- Cancel redeemed school subscription
```

#### 7. **Modified: Assignment Endpoints**

```
POST /api/v1/students/:studentId/assign-driver
- Updated to handle both parent and school assignments
- Logic:
  - If parent assigns: Check parent subscription status (if school-managed)
  - If school assigns: Check school subscription for parent
  - Create same driver_student_assignment with assignment_source field
  - assignment_source = 'parent' or 'school'
```

#### 8. **Modified: Trip Generation**

```
POST /api/v1/trips/generate-daily
- Auto-generate trips based on assignments (both parent and school)
- For each driver: Get all assigned students → Create trip
- Logic independent of assignment_source
```

---

## App-Specific Changes

### Admin Portal

#### New Features:

1. **School Management**
   - View all registered schools
   - Manage school subscriptions and plans
   - View school admin accounts
   - Analytics: active parents per school, revenue, etc.

2. **School Admin Accounts**
   - Create/manage school admin users
   - Assign schools to admins
   - Control admin permissions and roles

3. **School Subscription Code Management**
   - Generate subscription codes for schools
   - Bulk code generation for distribution
   - Track code redemption status
   - View redeemed vs unredeemed codes per school
   - Analytics: codes generated, redeemed, pending, expired

4. **School Driver Employment**
   - View drivers employed by each school
   - Approve/manage school-driver relationships
   - Track driver assignments per school

5. **Analytics Dashboard**
   - Breakdown by assignment source (parent vs school)
   - Active subscriptions (parent only - school are code-based)
   - Revenue from parent subscriptions
   - School code generation and redemption metrics
   - Usage metrics per school

#### UI Changes:

- New "Schools" section in admin sidebar
- School admin management panel
- School performance dashboard
- Subscription analytics with school filter

---

### Driver App

#### New Features:

1. **School Employment Option**
   - View if employed by any school
   - Accept/reject school employment offers
   - Switch between independent and school mode

2. **Assignment Sources**
   - View assignments from both parents and schools
   - Clear indication of assignment type (parent vs school)
   - Different UI for each assignment type

3. **School Settings**
   - If employed by school: View school details
   - View school-assigned students list
   - School contact and support info

#### No Major Logic Changes:

- Trip generation, routing, tracking, pickup/drop flow remains SAME
- Assignment status flow (pending, active, inactive) remains SAME
- Notifications for both parent and school assignments work same way

#### UI Indicators:

- Show "School Assigned" badge for school assignments
- Show parent name for parent assignments
- Color-code or separate tabs for parent vs school students

---

### Parent App

#### New Features:

1. **School Subscription Code Redemption (Verification)**
   - Receive subscription code from school (after parent has paid fees to school)
   - Redeem code in app to verify payment status
   - Automatic subscription activation upon code redemption
   - View active school subscriptions
   - Cancel school subscriptions

2. **Assignment Control**
   - If NO school subscription redeemed: Assign drivers directly (existing parent flow)
   - If HAS school subscription redeemed: School can assign drivers (parent sees status in app)
   - If parent has not redeemed code, school can still assign (parent just won't see status in app)
   - Cannot directly assign drivers if child is school-managed

3. **School Transport Access**
   - View school-assigned drivers
   - Track students on school routes
   - Receive notifications from school assignments
   - Rate/review school-assigned drivers

#### Logic Changes:

- **Student Assignment Flow:**
  - If student is school-managed: Show "School assigned drivers" (read-only to parent, assigned by school)
  - If student is not school-managed: Show "Assign Driver" button (parent assigns, existing flow)

- **Subscription Status Check:**
  - Code redemption links code to parent account for tracking/visibility only
  - School can assign drivers regardless of code redemption
  - No blocking or validation on code redemption for assignment

#### UI Changes:

- New "Redeem Code" option in subscription section
- Input field to enter subscription code (from school)
- Separate view for school-managed vs parent-managed students
- Clear indication of who assigned the driver (parent or school)
- Show when code was redeemed and validity period

---

## Implementation Summary

### Database Layer

- Create `school_subscriptions` table with `subscription_code` and `is_redeemed` fields
- Add columns to `driver_student_assignments` (assigned_by, assignment_source)
- Add `school_id` column to `drivers` table
- Keep `payments` table unchanged (no school payment tracking)

### API Layer

- Create `school/*` module with auth, drivers, students, assignments, code generation endpoints
- **Critical:** Assignment validation checks for active, redeemed school subscription
- Modify assignment logic to handle `assigned_by` and `assignment_source`
- Modify trip generation to work with both sources (parent and school)
- Update parent endpoints for code redemption

### Business Logic - **CODE REDEMPTION FOR TRACKING ONLY**

- **School Assignment Rule:** School can assign drivers to any student whose parent has paid fees (tracked in school's own system)
  - Code redemption is NOT required for assignment
  - Code redemption is only for tracking/analytics and to show status to parent in app
- **Parent Assignment Rule:** Student cannot have school subscription (exclusive)
- **Code Redemption Process:**
  - School identifies parent paid fees → Generates code → Parent may redeem in app (optional)
  - Code acts as proof of payment for tracking/analytics in our app, not for assignment logic
  - No payment processing in our app for school subscriptions
- **Assignment Creation:** Always set `assignment_source` field correctly
- **Trip Generation:** Independent of source (same algorithm for both parent and school)
- **Notifications:** Consider assignment source for messaging

### Frontend Changes

- Admin: School management dashboard
- Driver: School employment and assignment indicators
- Parent: School subscription flow and conditional assignment UI

---

## Deployment Checklist

### Database

- [ ] Create migration for `school_subscriptions` table (with subscription_code field)
- [ ] Add columns to `driver_student_assignments` (assigned_by, assignment_source)
- [ ] Add `school_id` column to `drivers` table
- [ ] Update ORM models and types

### Backend API

- [ ] Implement school auth endpoints (login, logout)
- [ ] Implement school code generation endpoint
- [ ] Implement school assignment endpoints
- [ ] Implement parent code redemption endpoint
- [ ] Update assignment validation logic (check assignment_source)
- [ ] Update trip generation logic (independent of source)
- [ ] Add assignment_source to trip tracking
- [ ] Update notification service for both sources

### Admin Portal

- [ ] School code generation and management UI
- [ ] Track code redemption status
- [ ] School driver employment management
- [ ] Subscription analytics dashboard (codes, redemptions)

### Driver App

- [ ] School employment indicator
- [ ] View if employed by any school
- [ ] Assignment type indicator (parent vs school)
- [ ] School contact info display

### Parent App

- [ ] Code redemption UI (input field + validation)
- [ ] Show active school subscriptions
- [ ] Conditional assignment UI (parent vs school managed)
- [ ] Cancel school subscription option

### Testing

- [ ] Test: Parent assignment flow (existing, no changes)
- [ ] Test: School code generation
- [ ] Test: Parent code redemption
- [ ] Test: School assignment validation
- [ ] Test: Mixed assignments (both parent and school drivers)
- [ ] Test: Trip generation for both sources
- [ ] Test: Code expiry and validation
- [ ] Test: Cannot redeem same code twice
