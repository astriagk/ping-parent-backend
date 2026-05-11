# Admin / Superadmin Full Access — Implementation Spec

## Goal

Admin and superadmin must be able to perform every action a parent, driver, or school_admin
can perform — so that schools can request bulk onboarding without depending on the parent or
driver to install the app and self-serve.

This spec adds only what is needed to mirror those existing capabilities, plus bulk onboarding.
No new admin-only feature areas (no notification broadcast, no review moderation, no analytics
audit views) are introduced here.

**Impact:** All new routes are additive. No parent, driver, or school_admin behaviour changes.

---

## DBML Schema Change (already applied)

`driver_student_assignments.assignment_source` enum extended in `spec/database/skolo.dbml`:

- **Before:** `'parent' | 'school'`
- **After:** `'parent' | 'school' | 'admin' | 'school_admin'`

The `assigned_by` field already supports `parents._id` and `admin_portal._id` references.

---

## What admin already has (no change needed)

- Schools CRUD — `GET/POST/PUT/DELETE /admin/schools`
- School subscriptions full lifecycle (+ codes) — `/admin/school-subscriptions/*`
- Subscription plans — `POST/PUT/PATCH /admin/subscription-plans/*`
- Driver–school assignments — `/admin/school-drivers/*`, `/admin/school-assignments/*`
- View students by school — `GET /admin/students/school/:schoolId`
- View assignments / parent-requested — `GET /admin/assignments[/parent-requested]`
- View trips — `GET /admin/trips`
- View payments — `GET /admin/payments[/:id]`
- View parent subscriptions — `GET /admin/subscriptions`
- Audit logs — `GET /admin/audit-logs/*`
- Support tickets — `GET/PUT /admin/support-tickets/*`
- User management — list, get, activate, deactivate, update, delete — `/admin/management/users/*`
- Driver/parent details — `GET /admin/management/{drivers|parents}/:id/details`
- Driver approval status — `PATCH /admin/management/drivers/:id/approval-status`
- Roles CRUD (superadmin) — `/admin/roles/*`

The school_admin role today only exposes `GET /school-admin/school`, `GET /school-admin/drivers`,
`POST /school-admin/drivers`. Admin already has equivalents — no admin-side gap to close.

---

## New API Endpoints

### 1. Parent Management (mirrors parent self-service)

#### `POST /admin/parents`
Create a parent account without OTP.

**DB writes:** `users` (user_type=parent) + `parents` + optionally `parent_addresses`

**Request body:**
```json
{
  "phone_number": "+919876543210",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "photo_url": "https://...",
  "address": {
    "address_line1": "12 MG Road",
    "address_line2": "Apt 3B",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001",
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```
- `phone_number` and `name` required; everything else optional.
- `address` optional but recommended — without it, students cannot be created.
- If `phone_number` already exists → **409 Conflict**.
- Parent is marked `is_active: true`.

**Response:** `{ user_id, parent_id, address_id? }`

---

#### `PUT /admin/parents/:parentId`
Update parent profile fields: `name`, `email`, `photo_url`. Phone change requires OTP
re-verification (separate concern).

**DB writes:** `parents`

---

#### `DELETE /admin/parents/:parentId`
Soft-delete parent (sets `users.is_active = false`). Cascade:
- Active `driver_student_assignments` for this parent's children → `inactive`
- Students of this parent → `is_active = false`
- `parent_subscriptions` → unaffected (preserves billing history)

---

#### `GET /admin/parents/:parentId/address`
Read the parent's primary address (mirrors `GET /parent/address`).

#### `PUT /admin/parents/:parentId/address`
Upsert the parent's primary address (mirrors `PUT /parent/address`).

**DB writes:** `parent_addresses` (upsert on `is_primary: true`)

**Required:** `address_line1`, `city`, `state`, `latitude`, `longitude`
**Optional:** `address_line2`, `pincode`

---

### 2. Student Management (mirrors parent's student CRUD)

#### `GET /admin/parents/:parentId/students`
List all students where `parent_id = :parentId`.

#### `POST /admin/parents/:parentId/students`
Create a single student for a given parent.

**DB writes:** `students`

**Request body:**
```json
{
  "school_id": "...",
  "student_name": "Arjun Sharma",
  "class": "5",
  "pickup_address_id": "...",
  "section": "A",
  "roll_number": "042",
  "gender": "male",
  "date_of_birth": "2015-06-15",
  "emergency_contact": "+919876543210",
  "medical_info": "Nut allergy"
}
```
- Required: `school_id`, `student_name`, `class`, `pickup_address_id`
- `pickup_address_id` must belong to this `parentId` → **400** if not.
- Duplicate (`student_name` + `class` + `school_id` + `parent_id` where `is_active=true`) → **409**
- `gender` enum: `male | female | other`

#### `PUT /admin/students/:studentId`
Update student fields: `student_name`, `class`, `section`, `roll_number`, `gender`,
`date_of_birth`, `pickup_address_id`, `emergency_contact`, `medical_info`, `school_id`,
`photo_url`.

- If `pickup_address_id` changes, validate it belongs to the same parent → **400** if not.
- If `school_id` changes, treat as transfer; existing active assignments deactivate.

#### `DELETE /admin/students/:studentId`
Soft-delete student (`is_active = false`). Active assignments for this student → `inactive`.

---

### 3. Driver Management (mirrors driver self-service)

#### `POST /admin/drivers`
Create a driver account without OTP. Admin-created drivers are **pre-approved**.

**DB writes:** `users` (user_type=driver) + `drivers` (approval_status=approved) +
optionally `driver_documents` + optionally `drivers.school_id`

**Request body:**
```json
{
  "phone_number": "+919876543210",
  "name": "Raju Kumar",
  "vehicle_type": "van",
  "vehicle_number": "KA01AB1234",
  "vehicle_capacity": 10,
  "email": "raju@example.com",
  "photo_url": "https://...",
  "school_id": "...",
  "documents": {
    "driving_license_number": "KA0120210012345",
    "driving_license_photo_url": "https://...",
    "vehicle_license_number": "REG2021KA01",
    "vehicle_license_photo_url": "https://...",
    "insurance_number": "INS123456",
    "insurance_photo_url": "https://..."
  }
}
```
- Required: `phone_number`, `name`, `vehicle_type`, `vehicle_number`, `vehicle_capacity`
- `vehicle_type` enum: `van | auto | bus`
- `school_id` optional — immediately sets `drivers.school_id`
- `documents` optional — if provided, `driving_license_number` and `vehicle_license_number` are required
- If `phone_number` already exists → **409**
- Sets `approval_status: "approved"`, `approved_by: <admin._id>`, `approved_at: now`
- Generates `driver_unique_id` using the same algorithm as the OTP registration flow

**Response:** Created driver object including `driver_unique_id`

---

#### `PUT /admin/drivers/:driverId`
Update driver profile: `name`, `email`, `photo_url`, `vehicle_type`, `vehicle_number`,
`vehicle_capacity`, `is_available`, `school_id`. Phone change requires re-verification.

#### `DELETE /admin/drivers/:driverId`
Soft-delete driver (`users.is_active = false`). Cascade:
- Active assignments → `inactive`
- Active trips → `cancelled` if not started; started trips left intact for history

---

#### `GET /admin/drivers/:driverId/address`
Read the driver's primary address (mirrors `GET /driver/address`).

#### `PUT /admin/drivers/:driverId/address`
Upsert the driver's primary address (mirrors `POST /driver/address`).

---

#### `GET /admin/drivers/:driverId/documents`
Read driver documents (`driver_documents`).

#### `POST /admin/drivers/:driverId/documents`
Create or replace driver documents (one record per driver per DBML).

**Required:** `driving_license_number`, `vehicle_license_number`
**Optional:** photo URLs, `insurance_number`, `insurance_photo_url`

#### `PUT /admin/drivers/:driverId/documents`
Partial update of any document field.

---

### 4. Assignment Override (admin bypasses parent/driver flow)

#### `POST /admin/assignments/assign-student`
Admin directly assigns a student to a driver — bypasses the parent-request / driver-approval flow.

**DB writes:** `driver_student_assignments` with `assignment_source: "admin"`

**Request body:**
```json
{
  "driver_id": "...",
  "student_id": "...",
  "monthly_fee": 1500.00,
  "start_date": "2026-05-01"
}
```

**Logic:**
1. Verify driver exists and `approval_status = "approved"`
2. Verify student exists and `is_active = true`
3. Check no active assignment exists for this student → **409** if one does
4. Create `driver_student_assignments`:
   - `assignment_status: "active"`
   - `assignment_source: "admin"`
   - `assigned_by: <admin._id>`
   - `assigned_date: today`

#### `POST /admin/assignments/:id/approve`
Admin approves a `pending` or `parent_requested` assignment. Sets `assignment_status: "active"`,
sets `start_date: today` if unset. **400** for other statuses.

#### `POST /admin/assignments/:id/reject`
Admin rejects a `pending` or `parent_requested` assignment → `assignment_status: "rejected"`.
**400** for other statuses.

#### `POST /admin/assignments/:id/deactivate`
Admin deactivates an `active` assignment → `assignment_status: "inactive"`. **400** otherwise.

---

### 5. Bulk Onboarding (the school-asks-for-N-accounts requirement)

#### `POST /admin/bulk/parents`
Bulk create parent accounts. Max 100 per request. Non-fatal per-item errors.

**DB writes:** Per parent: `users` + `parents` + optionally `parent_addresses`

**Request body:**
```json
{
  "parents": [
    {
      "phone_number": "+919876543210",
      "name": "Parent One",
      "email": "p1@example.com",
      "address": { "address_line1": "...", "city": "...", "state": "...", "latitude": 0, "longitude": 0 }
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    { "phone_number": "+91...", "status": "created", "parent_id": "..." },
    { "phone_number": "+91...", "status": "skipped", "reason": "phone already exists" }
  ],
  "created": 1,
  "skipped": 1
}
```

---

#### `POST /admin/bulk/parents-with-students`
Compound — create parents and their students in one call. Max 50 records per request.

**DB writes:** Per record: `users` + `parents` + `parent_addresses` + N × `students`

**Request body:**
```json
{
  "records": [
    {
      "parent": {
        "phone_number": "+919876543210",
        "name": "Priya Sharma",
        "address": {
          "address_line1": "12 MG Road",
          "city": "Bengaluru",
          "state": "Karnataka",
          "latitude": 12.9716,
          "longitude": 77.5946
        }
      },
      "students": [
        { "school_id": "...", "student_name": "Arjun Sharma", "class": "5", "pickup_address_id": null }
      ]
    }
  ]
}
```

**`pickup_address_id: null` behaviour:** When null, the system uses the `parent_addresses._id`
created for the parent in the same record. If the parent already existed and has no primary
address, the student is skipped with `reason: "no pickup address"`.

**Response:**
```json
{
  "results": [
    {
      "phone_number": "+91...",
      "parent_status": "created",
      "parent_id": "...",
      "students": [
        { "student_name": "Arjun", "status": "created", "student_id": "..." }
      ]
    }
  ],
  "parents_created": 1,
  "students_created": 1,
  "skipped": 0
}
```

---

#### `POST /admin/parents/:parentId/students/bulk`
Multi-child onboarding for an existing parent. Max 50 per request.

**Request body:**
```json
{
  "students": [
    { "school_id": "...", "student_name": "...", "class": "5", "pickup_address_id": "..." }
  ]
}
```

**Response:**
```json
{
  "results": [
    { "student_name": "Arjun", "status": "created", "student_id": "..." },
    { "student_name": "Riya", "status": "skipped", "reason": "duplicate" }
  ],
  "created": 1,
  "skipped": 1
}
```

---

### 6. Parent Subscriptions (admin acts on parent's behalf)

#### `POST /admin/parent-subscriptions`
Create a subscription on a parent's behalf (e.g. comp / manual billing).

**Request body:** `{ parent_id, plan_id, start_date, end_date, auto_renew }`
**DB writes:** `parent_subscriptions` with `subscription_status: "active"`.

#### `PATCH /admin/parent-subscriptions/:id/cancel`
Cancel an active parent subscription. Sets `subscription_status: "cancelled"`.

---

## File Changes

### New Route Files
| File | Purpose |
|---|---|
| `src/routes/admin/parents.routes.ts` | Parent CRUD + address upsert + per-parent student endpoints + bulk-students |
| `src/routes/admin/drivers.routes.ts` | Driver create + update + delete + address upsert + documents CRUD |
| `src/routes/admin/bulk.routes.ts` | `/admin/bulk/parents`, `/admin/bulk/parents-with-students` |
| `src/routes/admin/parent-subscriptions.routes.ts` (extend existing GET) | Add POST + PATCH cancel |

### Modified Route Files
| File | Change |
|---|---|
| `src/routes/admin/index.ts` | Register new routers |
| `src/routes/admin/students.routes.ts` (extend existing) | Add `PUT /admin/students/:id`, `DELETE /admin/students/:id` |
| `src/routes/admin/assignments.routes.ts` | Add `POST /assign-student`, `:id/approve`, `:id/reject`, `:id/deactivate` |

### Modified Module Files
| File | Change |
|---|---|
| `src/modules/users/parent/parent.controller.ts` | Add `adminCreateParent`, `adminUpdateParent`, `adminDeleteParent`, `adminGetParentAddress`, `adminUpsertParentAddress`, `adminGetParentStudents` |
| `src/modules/users/parent/parent.service.ts` | Add `adminCreateParentWithUser`, `adminBulkCreateParents`, `adminUpdateParent`, `adminDeleteParentCascade`, `adminGetParentAddress`, `adminUpsertParentAddress` |
| `src/modules/users/parent/parent.validation.ts` | Add admin create / update / address / bulk schemas |
| `src/modules/users/student/student.controller.ts` | Add `adminCreateStudent`, `adminBulkCreateStudents`, `adminUpdateStudent`, `adminDeleteStudent` |
| `src/modules/users/student/student.service.ts` | Add `adminCreateStudentForParent`, `adminBulkCreateStudents`, `adminUpdateStudent`, `adminSoftDeleteStudent` |
| `src/modules/users/driver/driver.controller.ts` | Add `adminCreateDriver`, `adminUpdateDriver`, `adminDeleteDriver`, address upsert, documents CRUD |
| `src/modules/users/driver/driver.service.ts` | Add `adminCreateDriverWithUser`, `adminUpdateDriverProfile`, `adminDeleteDriverCascade`, address + document service methods |
| `src/modules/users/driver/driver.validation.ts` | Add admin create / update / address / documents schemas |
| `src/modules/trips/driver_student_assignment/driver_student_assignment.controller.ts` | Add `adminAssignStudent`, `adminApproveAssignment`, `adminRejectAssignment`, `adminDeactivateAssignment` |
| `src/modules/trips/driver_student_assignment/driver_student_assignment.service.ts` | Add corresponding service methods |
| `src/modules/billing/parent_subscription/parent_subscription.controller.ts` | Add `adminCreateSubscription`, `adminCancelSubscription` |

### Reused Functions (do not duplicate)
- `authRepository.findByPhoneNumber()` — phone uniqueness check
- `authRepository.createUser()` — creates `users` record
- `parentRepository.create()` — creates `parents` record
- `studentRepository.findDuplicateStudent()` — duplicate detection
- `studentRepository.create()` — creates `students` record
- `driverRepository.create()` — creates `drivers` record (reuse `driver_unique_id` generation)
- `assignmentRepository.create()` — creates `driver_student_assignments` record
- `assignmentRepository.findActiveByStudentId()` — active-assignment guard
- `getCompleteDriverDetailsById()` / `getCompleteParentDetailsById()` — already in service layer

> Per project convention, all MongoDB aggregation pipelines live in repository files, not service files.

---

## Implementation Order

1. `POST /admin/parents` + address upsert — foundation for everything else
2. `POST /admin/parents/:parentId/students` + student `PUT`/`DELETE`
3. `POST /admin/drivers` + driver `PUT`/`DELETE` + address + documents (parallel with step 2)
4. Assignment overrides — assign-student, approve, reject, deactivate
5. Bulk endpoints — depends on steps 1–3
6. Parent subscription create + cancel

---

## Auth

All endpoints above sit under `/admin/*` and use `verifyAdminOrAboveToken`.

---

## Out of Scope — Separate Feature Modules

These DBML tables exist but have **no backend module yet**, so admin endpoints for them are
deferred until each module's full spec is designed:

- `ads`, `ad_interactions`
- `school_events`, `event_rsvp`
- `school_parent_community`, `parent_connections`, `community_posts`, `community_post_reactions`, `community_post_comments`
- `user_roles` (RBAC mapping; the `roles` table itself already has CRUD)

Also explicitly out of scope for this spec (admin-only features not requested here):
- Notification broadcast
- Ratings/reviews moderation
- Daily QR/OTP audit views
- New `/school-admin/*` endpoints
- Auth middleware tightening (school_admin currently passes `verifyAdminOrAboveToken`)

---

## Verification Checklist

### Account creation
- [ ] `POST /admin/parents` creates `users`, `parents`, `parent_addresses` (if address given)
- [ ] Duplicate phone returns **409** for single create, `skipped` in bulk
- [ ] `POST /admin/drivers` generates `driver_unique_id`, sets `approval_status: "approved"`, `approved_by`, `approved_at`
- [ ] `POST /admin/parents/:parentId/students` rejects `pickup_address_id` belonging to another parent
- [ ] Duplicate student (name+class+school+parent+is_active=true) returns **409** single, `skipped` bulk

### Updates / soft-deletes
- [ ] `PUT /admin/parents/:id` updates name/email/photo
- [ ] `DELETE /admin/parents/:id` soft-deletes parent and cascades active assignments to `inactive`
- [ ] `PUT /admin/students/:id` validates `pickup_address_id` ownership when changed
- [ ] `DELETE /admin/students/:id` soft-deletes student and cascades active assignments to `inactive`
- [ ] `PUT /admin/drivers/:id` updates vehicle info; `DELETE` cascades trips/assignments
- [ ] `PUT /admin/parents/:id/address` and `PUT /admin/drivers/:id/address` upsert correctly
- [ ] `POST/PUT /admin/drivers/:id/documents` upserts `driver_documents`

### Assignment overrides
- [ ] `POST /admin/assignments/assign-student` creates active assignment with `assignment_source: "admin"`, blocks if student already has active assignment
- [ ] `POST /admin/assignments/:id/approve` only from `pending|parent_requested`
- [ ] `POST /admin/assignments/:id/reject` only from `pending|parent_requested`
- [ ] `POST /admin/assignments/:id/deactivate` only from `active`

### Bulk
- [ ] `POST /admin/bulk/parents` enforces max 100, partial successes return `created`/`skipped`
- [ ] `POST /admin/bulk/parents-with-students` enforces max 50; `pickup_address_id: null` auto-resolves to address created in same record
- [ ] Compound bulk: parent skipped + no existing primary address → student skipped with `reason: "no pickup address"`
- [ ] `POST /admin/parents/:parentId/students/bulk` enforces max 50

### Parent subscriptions
- [ ] `POST /admin/parent-subscriptions` creates active subscription on behalf
- [ ] `PATCH /admin/parent-subscriptions/:id/cancel` sets `subscription_status: "cancelled"`

### Schema
- [ ] `assignment_source` enum in DBML includes `admin` (and `school_admin`, already applied)
