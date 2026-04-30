# Admin / Superadmin Full Access — Implementation Spec

## Overview

Admins and superadmins must be able to perform every action a parent, driver, or school_admin can perform, plus bulk operations for onboarding. Currently parents/drivers are only created via the mobile OTP flow, and students are only created by authenticated parents. This spec defines all missing admin endpoints.

---

## Current Gaps

| Action | Who can do it now | Gap |
|---|---|---|
| Create parent | No one (OTP only) | Admin/superadmin need a direct create endpoint |
| Create student | Authenticated parent only | Admin/superadmin need to create for any parent |
| Create driver | No one (OTP only) | Admin/superadmin need a direct create endpoint |
| Assign student to driver | Parent only | Admin/superadmin need direct assignment |
| Bulk create parents + students | Nobody | New bulk endpoints needed |
| Manage parent address | Parent only | Admin needs this as prereq for student creation |

### What admin/superadmin already can do (no changes needed)
- School CRUD — `GET/POST/PUT/DELETE /admin/schools`
- Assign driver to school — `POST /admin/school-drivers/assign`
- Generate student codes — `POST /admin/school-subscriptions/:subscriptionId/generate-codes`
- School assignments — `GET/POST /admin/school-assignments/:schoolId/*`
- View students by school — `GET /admin/students/school/:schoolId`
- All school_admin capabilities are already covered by existing admin routes

---

## New API Endpoints

### 1. Parent Management

#### `POST /admin/parents`
Create a parent account (no OTP required — admin is authorising).

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
- `phone_number` and `name` are required; everything else optional.
- `address` is optional but recommended — without it, students can't be created for this parent (no `pickup_address_id`).
- If `phone_number` already exists with `user_type=parent` → **409 Conflict**.
- Creates: `users` record + `parents` record + (if address given) `parent_addresses` record.
- Created driver is marked `is_active: true`.

**Response:** Created parent object with `user_id`, `parent_id`, `address_id` (if created).

---

#### `GET /admin/parents/:parentId/addresses`
List all addresses for a parent.

#### `POST /admin/parents/:parentId/address`
Create or update the primary address for a parent (upsert on `is_primary: true`).

**Request body:** same shape as `address` object above (all fields except coordinates optional).
`address_line1`, `city`, `state`, `latitude`, `longitude` are required.

---

### 2. Student Management

#### `POST /admin/parents/:parentId/students`
Create a single student for a given parent.

**Request body:**
```json
{
  "school_id": "507f1f77bcf86cd799439011",
  "student_name": "Arjun Sharma",
  "class": "5",
  "pickup_address_id": "507f1f77bcf86cd799439012",
  "section": "A",
  "roll_number": "042",
  "gender": "MALE",
  "date_of_birth": "2015-06-15",
  "emergency_contact": "+919876543210",
  "medical_info": "Nut allergy"
}
```
- `school_id`, `student_name`, `class`, `pickup_address_id` are required.
- `pickup_address_id` must belong to the specified `parentId` — returns 400 if not.
- Duplicate check: same `student_name` + `class` + `school_id` + `parent_id` where `is_active=true` → **409 Conflict**.

#### `GET /admin/parents/:parentId/students`
List all students for a given parent.

#### `POST /admin/parents/:parentId/students/bulk`
Bulk create students for an existing parent. Max 50 students per request.

**Request body:**
```json
{
  "students": [
    { "school_id": "...", "student_name": "...", "class": "5", "pickup_address_id": "..." },
    { "school_id": "...", "student_name": "...", "class": "3", "pickup_address_id": "..." }
  ]
}
```

**Response — results array (non-fatal per-item errors):**
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

### 3. Bulk Parent + Student Creation

#### `POST /admin/bulk/parents`
Bulk create parent accounts. Max 100 parents per request.

**Request body:**
```json
{
  "parents": [
    {
      "phone_number": "+919876543210",
      "name": "Parent One",
      "email": "p1@example.com",
      "address": { ... }
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
Compound operation — create parents and their students in one call. Max 50 records per request.

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
        {
          "school_id": "...",
          "student_name": "Arjun Sharma",
          "class": "5",
          "pickup_address_id": null
        }
      ]
    }
  ]
}
```

**`pickup_address_id: null` behaviour:** When null, the system automatically uses the address created for the parent in the same record. If the parent already exists (skipped) and has no address, the student is also skipped with reason `"no pickup address"`.

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

### 4. Driver Creation

#### `POST /admin/drivers`
Create a driver account without OTP. Admin-created drivers are **pre-approved** (`approval_status: "approved"`).

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
- `phone_number`, `name`, `vehicle_type`, `vehicle_number`, `vehicle_capacity` are required.
- `vehicle_type` enum: `van | auto | bus`.
- `school_id` optional — immediately assigns driver to the school if provided.
- `documents` optional — creates `driver_documents` record if provided.
- If `phone_number` already exists → **409 Conflict**.
- Generates `driver_unique_id` using the same algorithm as the OTP registration flow.
- Creates: `users` record + `drivers` record + (if `documents`) `driver_documents` record + (if `school_id`) school assignment.

**Response:** Created driver object including generated `driver_unique_id`.

---

### 5. Direct Student-to-Driver Assignment

#### `POST /admin/assignments/assign-student`
Admin directly assigns a student to a driver (bypasses parent approval flow).

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
1. Verify driver exists and `approval_status = "approved"`.
2. Verify student exists and `is_active = true`.
3. Check no active assignment already exists for this student → **409** if one does.
4. Create `driver_student_assignments` record:
   - `assignment_status: "active"`
   - `assignment_source: "school"`
   - `assigned_by: <admin._id>`
   - `assigned_date: today`

---

## File Changes

### New files
| File | Purpose |
|---|---|
| `src/routes/admin/parents.routes.ts` | Parent + address + student endpoints |
| `src/routes/admin/drivers.routes.ts` | Driver creation endpoint |
| `src/routes/admin/bulk.routes.ts` | Bulk creation endpoints |

### Modified files
| File | Change |
|---|---|
| `src/routes/admin/index.ts` | Register `parentsRouter`, `driversRouter`, `bulkRouter` |
| `src/routes/admin/assignments.routes.ts` | Add `POST /assignments/assign-student` |
| `src/routes/admin/students.routes.ts` | Add per-parent student routes (delegate to parent router) |
| `src/modules/users/parent/parent.controller.ts` | Add `adminCreateParent` handler |
| `src/modules/users/parent/parent.service.ts` | Add `adminCreateParentWithUser`, `adminBulkCreateParents` |
| `src/modules/users/parent/parent.validation.ts` | Add admin create/bulk schemas |
| `src/modules/users/student/student.controller.ts` | Add `adminCreateStudent`, `adminBulkCreateStudents` |
| `src/modules/users/student/student.service.ts` | Add `adminCreateStudentForParent`, `adminBulkCreateStudents` |
| `src/modules/users/driver/driver.controller.ts` | Add `adminCreateDriver` |
| `src/modules/users/driver/driver.service.ts` | Add `adminCreateDriverWithUser` |
| `src/modules/users/driver/driver.validation.ts` | Add admin driver create schema |
| `src/modules/trips/driver_student_assignment/driver_student_assignment.controller.ts` | Add `adminAssignStudentToDriver` |
| `src/modules/trips/driver_student_assignment/driver_student_assignment.service.ts` | Add `adminCreateAssignment` |

### Reused functions (do not duplicate)
- `authRepository.findByPhoneNumber()` — phone uniqueness check
- `authRepository.createUser()` — creates users collection record
- `parentRepository.create()` — creates parents record
- `studentRepository.findDuplicateStudent()` — duplicate detection
- `studentRepository.create()` — creates students record
- `driverRepository.create()` — creates drivers record (check existing for `driver_unique_id` generation pattern)
- `assignmentRepository.create()` — creates driver_student_assignments record

---

## Implementation Order

1. **`POST /admin/parents` + address endpoints** — everything else depends on parents existing
2. **`POST /admin/parents/:parentId/students`** — single student creation
3. **`POST /admin/drivers`** — parallel with step 2
4. **`POST /admin/assignments/assign-student`** — depends on steps 2 and 3
5. **Bulk endpoints** — depends on steps 1 and 2 being solid

---

## Auth Rules

- All new endpoints sit behind `verifyAdminOrAboveToken` (same as the rest of `/admin/*`).
- `school_admin` tokens must **NOT** have access — `verifyAdminOrAboveToken` already excludes school_admin for the `/admin` prefix (school_admin uses `/school-admin` prefix).
- `superadmin` uses `verifySuperadminToken` which already inherits admin access.

---

## Verification Checklist

- [ ] `POST /admin/parents` creates records in `users`, `parents`, and `parent_addresses` collections
- [ ] Duplicate phone returns 409 for single create, `skipped` in bulk
- [ ] `POST /admin/parents/:parentId/students` rejects `pickup_address_id` belonging to another parent
- [ ] Duplicate student (same name+class+school+parent) returns 409 single, `skipped` bulk
- [ ] `POST /admin/drivers` generates `driver_unique_id`, sets `approval_status: "approved"`
- [ ] `POST /admin/assignments/assign-student` blocks if student already has active assignment
- [ ] Bulk compound: `pickup_address_id: null` auto-resolves to the address created in same record
- [ ] Calling any new endpoint with `school_admin` token returns 403
