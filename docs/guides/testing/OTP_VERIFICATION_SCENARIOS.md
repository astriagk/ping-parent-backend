# OTP Verification - Scenario Guide

**Version:** 1.0.0  
**Last Updated:** 2026-02-09  
**Purpose:** Step-by-step scenarios explaining Daily QR/OTP verification for pickup and drop flows

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Understanding Daily QR/OTP](#understanding-daily-qrotp)
3. [Morning Pickup Trip Scenarios](#morning-pickup-trip-scenarios)
4. [Evening Drop Trip Scenarios](#evening-drop-trip-scenarios)
5. [Sibling Scenarios (Multiple Students Same Parent)](#sibling-scenarios-multiple-students-same-parent)
6. [Database Tables Reference](#database-tables-reference)

---

## Quick Reference

### Two-Step Flow at Home Stops

| Step                    | Purpose                                     | Endpoint                                                |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------- |
| **1. Verify OTP**       | Check OTP valid, see which students covered | `POST /api/daily-qr-otp/verify`                         |
| **2. Mark Pickup/Drop** | Record attendance & update status           | `POST /api/trip-students/trip/:tripId/pickup-point` |

### Endpoint Summary

| Scenario                  | OTP Required? | Endpoint                                                  |
| ------------------------- | ------------- | --------------------------------------------------------- |
| Verify OTP (see students) | Yes           | `POST /api/daily-qr-otp/verify`                           |
| Pickup at Home            | Yes (4-digit) | `POST /api/trip-students/trip/:tripId/pickup-point`   |
| Drop at Home              | Yes (4-digit) | `POST /api/trip-students/trip/:tripId/pickup-point`   |
| Drop at School            | **No**        | `POST /api/trip-students/trip/:tripId/school-point` |
| Pickup from School        | **No**        | `POST /api/trip-students/trip/:tripId/school-point` |

---

## Understanding Daily QR/OTP

### What is Daily QR/OTP?

- **4-digit code** generated per parent per trip
- One OTP covers ALL siblings in the same trip
- Parent can show QR code OR tell 4-digit code to driver
- Generated automatically when driver creates a trip
- Valid for 24 hours

### When is OTP Required?

| Location  | Morning (PICKUP trip) | Evening (DROP trip) |
| --------- | --------------------- | ------------------- |
| Home Stop | ✅ OTP Required       | ✅ OTP Required     |
| School    | ❌ No OTP             | ❌ No OTP           |

**Why?** OTP ensures handover is verified by parent at home. School location is trusted, so no OTP needed.

---

## Morning Pickup Trip Scenarios

### How Morning Pickup Works

```
Driver Home → Stop 1 (Parent A) → Stop 2 (Parent B) → ... → School
               ↓                    ↓
          OTP Required          OTP Required
```

**OTP is required** at each home stop to verify parent handed over the students.  
**No OTP needed** at school - driver just marks everyone as dropped.

---

### Scenario 1: Driver Arrives at Stop - 1 Student (Present)

**Situation:** Driver reaches Parent A's home. Parent A has 1 child (Rahul). Parent shows OTP. Rahul gets in the vehicle.

**Step 1: Parent shows OTP to driver**

Parent can show either:

- QR code (driver scans)
- 4-digit code (driver types)

**Step 2: Driver verifies OTP first (to see which students are covered)**

```
Endpoint: POST /api/daily-qr-otp/verify
Payload: {
  "parent_id": "parent-a-id",
  "trip_id": "trip-id",
  "otp_code": "1234"
}
```

**What happens:** System checks if OTP is valid. **No database changes yet.**

**Response:**

```json
{
  "success": true,
  "message": "QR/OTP verified successfully",
  "data": {
    "qr_otp_id": "QR_OTP_abc123",
    "parent_id": "parent-a-id",
    "student_ids": ["rahul-student-id"],
    "trip_id": "trip-id",
    "is_used": false
  }
}
```

**What driver sees:** OTP is valid, covers 1 student (Rahul).

**Step 3: Driver marks student as picked**

```
Endpoint: POST /api/trip-students/trip/{tripId}/pickup-point
Payload: {
  "student_ids": ["rahul-student-id"],
  "absent_student_ids": [],
  "otp_code": "1234",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**What happens in database:**

| Table           | Field                  | Before    | After                  |
| --------------- | ---------------------- | --------- | ---------------------- |
| `trip_students` | `attendance_status`    | `pending` | `present`              |
| `trip_students` | `pickup_status`        | `pending` | `picked`               |
| `trip_students` | `pickup_time`          | null      | `2026-02-09T07:30:00Z` |
| `daily_qr_otp`  | `is_used`              | `false`   | `true`                 |
| `daily_qr_otp`  | `verified_student_ids` | `[]`      | `["rahul-student-id"]` |

**Response:**

```json
{
  "success": true,
  "data": {
    "trip_type": "pickup",
    "processed_students": ["rahul-student-id"],
    "absent_students": [],
    "failed_students": []
  }
}
```

---

### Scenario 2: Driver Arrives at Stop - 1 Student (Absent)

**Situation:** Driver reaches Parent A's home. Parent A informs that Rahul is sick and won't go to school today. No pickup.

**Step 1: Driver marks student as absent (NO OTP needed for absent)**

```
Endpoint: POST /api/trip-students/trip/{tripId}/pickup-point
Payload: {
  "student_ids": [],
  "absent_student_ids": ["rahul-student-id"],
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**Note:** When ALL students at a stop are absent, no OTP is required.

**What happens in database:**

| Table           | Field                | Before    | After                  |
| --------------- | -------------------- | --------- | ---------------------- |
| `trip_students` | `attendance_status`  | `pending` | `absent`               |
| `trip_students` | `pickup_status`      | `pending` | `no_show`              |
| `daily_qr_otp`  | `is_used`            | `false`   | `true`                 |
| `daily_qr_otp`  | `absent_student_ids` | `[]`      | `["rahul-student-id"]` |

---

### Scenario 3: Driver Arrives at School - Drops All Students

**Situation:** Driver has picked up all students and reaches school. Needs to drop them off.

**Step: Driver clicks "Complete at School" (NO OTP required)**

```
Endpoint: POST /api/trip-students/trip/{tripId}/school-point
Payload: {
  "student_ids": ["rahul-id", "priya-id", "arjun-id"],
  "latitude": 12.9800,
  "longitude": 77.6000
}
```

**What happens in database:**

| Table                 | Field           | Before   | After                  |
| --------------------- | --------------- | -------- | ---------------------- |
| `trip_students` (all) | `pickup_status` | `picked` | `dropped`              |
| `trip_students` (all) | `drop_time`     | null     | `2026-02-09T08:30:00Z` |

**Response:**

```json
{
  "success": true,
  "data": {
    "trip_type": "pickup",
    "action": "dropped_at_school",
    "processed_students": ["rahul-id", "priya-id", "arjun-id"],
    "failed_students": []
  }
}
```

**Trip Status Update:** After all students are dropped, trip can be marked as `completed`.

---

## Evening Drop Trip Scenarios

### How Evening Drop Works

```
Driver at School → Stop 1 (Parent A) → Stop 2 (Parent B) → ... → Driver Home
       ↓                ↓                    ↓
  No OTP needed    OTP Required          OTP Required
```

**No OTP needed** at school - driver just collects all students.  
**OTP required** at each home stop to verify parent received the students.

---

### Scenario 4: Driver Collects Students from School

**Situation:** Driver reaches school in the evening. Collects students for drop-off.

**Step: Driver marks students as picked from school (NO OTP)**

```
Endpoint: POST /api/trip-students/trip/{tripId}/school-point
Payload: {
  "student_ids": ["rahul-id", "priya-id", "arjun-id"],
  "latitude": 12.9800,
  "longitude": 77.6000
}
```

**What happens in database:**

| Table                 | Field               | Before    | After                  |
| --------------------- | ------------------- | --------- | ---------------------- |
| `trip_students` (all) | `attendance_status` | `pending` | `present`              |
| `trip_students` (all) | `pickup_status`     | `pending` | `picked`               |
| `trip_students` (all) | `pickup_time`       | null      | `2026-02-09T15:30:00Z` |

**Response:**

```json
{
  "success": true,
  "data": {
    "trip_type": "drop",
    "action": "picked_from_school",
    "processed_students": ["rahul-id", "priya-id", "arjun-id"],
    "failed_students": []
  }
}
```

---

### Scenario 5: Driver Drops Student at Home

**Situation:** Driver reaches Parent A's home with Rahul. Parent A shows OTP. Driver hands over Rahul.

**Step 1: Driver verifies OTP**

```
Endpoint: POST /api/daily-qr-otp/verify
Payload: {
  "parent_id": "parent-a-id",
  "trip_id": "trip-id",
  "otp_code": "5678"
}
```

**Response:** OTP valid, covers `["rahul-id"]`

**Step 2: Driver marks student as dropped**

```
Endpoint: POST /api/trip-students/trip/{tripId}/pickup-point
Payload: {
  "student_ids": ["rahul-id"],
  "absent_student_ids": [],
  "otp_code": "5678",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**What happens in database:**

| Table           | Field                  | Before   | After                  |
| --------------- | ---------------------- | -------- | ---------------------- |
| `trip_students` | `pickup_status`        | `picked` | `dropped`              |
| `trip_students` | `drop_time`            | null     | `2026-02-09T16:00:00Z` |
| `daily_qr_otp`  | `is_used`              | `false`  | `true`                 |
| `daily_qr_otp`  | `verified_student_ids` | `[]`     | `["rahul-id"]`         |

---

## Sibling Scenarios (Multiple Students Same Parent)

### Key Concept: One OTP Per Parent

When a parent has **multiple children (siblings)** in the same trip:

- System generates **ONE OTP** that covers ALL siblings
- Driver can pick/drop siblings **together or separately**
- OTP is marked `is_used: true` only when ALL siblings are accounted for

---

### Scenario 6: Parent Has 2 Children - Both Present

**Situation:** Parent A has 2 children: Rahul and Priya. Both are going to school today. Driver arrives, parent shows OTP, both kids get in.

**Step 1: Driver verifies OTP (sees 2 students covered)**

```
Endpoint: POST /api/daily-qr-otp/verify
Payload: {
  "parent_id": "parent-a-id",
  "trip_id": "trip-id",
  "otp_code": "1234"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "student_ids": ["rahul-id", "priya-id"],
    "is_used": false
  }
}
```

**What driver sees:** OTP covers 2 students - Rahul and Priya.

**Step 2: Driver picks up both siblings**

```
Endpoint: POST /api/trip-students/trip/{tripId}/pickup-point
Payload: {
  "student_ids": ["rahul-id", "priya-id"],
  "absent_student_ids": [],
  "otp_code": "1234",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**What happens in database:**

| Table           | Record         | Change                                                            |
| --------------- | -------------- | ----------------------------------------------------------------- |
| `trip_students` | Rahul          | `attendance_status: present`, `pickup_status: picked`             |
| `trip_students` | Priya          | `attendance_status: present`, `pickup_status: picked`             |
| `daily_qr_otp`  | Parent A's OTP | `is_used: true`, `verified_student_ids: ["rahul-id", "priya-id"]` |

**OTP is used up** because all siblings are accounted for.

---

### Scenario 7: Parent Has 2 Children - 1 Present, 1 Absent

**Situation:** Parent A has Rahul and Priya. Priya is sick. Only Rahul is going.

**Step 1: Driver verifies OTP (sees 2 students covered)**

```
Endpoint: POST /api/daily-qr-otp/verify
Payload: {
  "parent_id": "parent-a-id",
  "trip_id": "trip-id",
  "otp_code": "1234"
}
```

**Response shows 2 students:** `["rahul-id", "priya-id"]`

**Step 2: Driver picks Rahul, marks Priya absent**

```
Endpoint: POST /api/trip-students/trip/{tripId}/pickup-point
Payload: {
  "student_ids": ["rahul-id"],
  "absent_student_ids": ["priya-id"],
  "otp_code": "1234",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**What happens in database:**

| Table           | Record         | Change                                                |
| --------------- | -------------- | ----------------------------------------------------- |
| `trip_students` | Rahul          | `attendance_status: present`, `pickup_status: picked` |
| `trip_students` | Priya          | `attendance_status: absent`, `pickup_status: no_show` |
| `daily_qr_otp`  | Parent A's OTP | `is_used: true` (all accounted)                       |
| `daily_qr_otp`  |                | `verified_student_ids: ["rahul-id"]`                  |
| `daily_qr_otp`  |                | `absent_student_ids: ["priya-id"]`                    |

---

### Scenario 8: Parent Has 2 Children - All Absent

**Situation:** Both Rahul and Priya are sick. Nobody is going to school.

**Step: Driver marks both as absent (NO OTP needed)**

```
Endpoint: POST /api/trip-students/trip/{tripId}/pickup-point
Payload: {
  "student_ids": [],
  "absent_student_ids": ["rahul-id", "priya-id"],
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**Note:** When all students are absent, OTP is NOT required.

**What happens in database:**

| Table           | Record         | Change                                                          |
| --------------- | -------------- | --------------------------------------------------------------- |
| `trip_students` | Rahul          | `attendance_status: absent`, `pickup_status: no_show`           |
| `trip_students` | Priya          | `attendance_status: absent`, `pickup_status: no_show`           |
| `daily_qr_otp`  | Parent A's OTP | `is_used: true`, `absent_student_ids: ["rahul-id", "priya-id"]` |

---

### Scenario 9: Parent Has 3 Children - Picked in 2 Separate Calls

**Situation:** Parent A has Rahul, Priya, and Arjun. Rahul is ready first, driver picks him. Then comes back for Priya and Arjun later.

**Call 1: Pick Rahul first**

```
Payload: {
  "student_ids": ["rahul-id"],
  "absent_student_ids": [],
  "otp_code": "1234"
}
```

**What happens:**

| `daily_qr_otp` | `verified_student_ids` | `["rahul-id"]` |
| `daily_qr_otp` | `is_used` | `false` (still 2 unaccounted) |

**Call 2: Pick remaining siblings**

```
Payload: {
  "student_ids": ["priya-id", "arjun-id"],
  "absent_student_ids": [],
  "otp_code": "1234"
}
```

**What happens:**

| `daily_qr_otp` | `verified_student_ids` | `["rahul-id", "priya-id", "arjun-id"]` |
| `daily_qr_otp` | `is_used` | `true` (all 3 accounted) |

**Key Point:** Same OTP can be used multiple times UNTIL all siblings are accounted for.

---

## OTP Validation Rules

### When OTP is VALID:

- `is_used: false`
- `valid_from <= now <= valid_until` (within 24 hours)
- `student_id` is in the OTP's `student_ids` array
- `trip_id` matches

### When OTP is INVALID (Error: "Invalid or expired OTP"):

- OTP already used (`is_used: true` and all students accounted)
- OTP expired (`valid_until < now`)
- Wrong OTP code
- Student not covered by this OTP

---

## Complete Trip Flow Summary

### Morning Trip (PICKUP type)

```
┌────────────────────────────────────────────────────────────────────────┐
│ MORNING PICKUP TRIP                                                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. Driver creates PICKUP trip                                         │
│     → System generates OTP for each parent                            │
│     → trip_students created with status: pending                      │
│                                                                        │
│  2. Driver goes to Stop 1 (Parent A's home)                           │
│     → Parent shows OTP                                                │
│     → Driver calls pickup-point with OTP                          │
│     → trip_students: pending → picked                                 │
│     → attendance: pending → present                                   │
│                                                                        │
│  3. Driver goes to Stop 2, 3, ... (repeat step 2)                     │
│                                                                        │
│  4. Driver reaches School                                              │
│     → Driver calls school-point (NO OTP)                        │
│     → trip_students: picked → dropped                                 │
│                                                                        │
│  5. Trip marked as COMPLETED                                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Evening Trip (DROP type)

```
┌────────────────────────────────────────────────────────────────────────┐
│ EVENING DROP TRIP                                                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. Driver creates DROP trip                                           │
│     → System generates OTP for each parent                            │
│     → trip_students created with status: pending                      │
│                                                                        │
│  2. Driver at School                                                   │
│     → Driver calls school-point (NO OTP)                        │
│     → trip_students: pending → picked                                 │
│     → attendance: pending → present                                   │
│                                                                        │
│  3. Driver goes to Stop 1 (Parent A's home)                           │
│     → Parent shows OTP                                                │
│     → Driver calls pickup-point with OTP                          │
│     → trip_students: picked → dropped                                 │
│                                                                        │
│  4. Driver goes to Stop 2, 3, ... (repeat step 3)                     │
│                                                                        │
│  5. Trip marked as COMPLETED                                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Database Tables Reference

### trip_students

| Field               | Values                                    | Description                       |
| ------------------- | ----------------------------------------- | --------------------------------- |
| `attendance_status` | `pending`, `present`, `absent`            | Student's attendance for the trip |
| `pickup_status`     | `pending`, `picked`, `dropped`, `no_show` | Current pickup/drop state         |
| `pickup_time`       | timestamp                                 | When student was picked up        |
| `drop_time`         | timestamp                                 | When student was dropped off      |

### daily_qr_otp

| Field                  | Description                               |
| ---------------------- | ----------------------------------------- |
| `parent_id`            | Parent who owns this OTP                  |
| `student_ids`          | Array of all students covered by this OTP |
| `trip_id`              | Trip this OTP is for                      |
| `otp_code`             | 4-digit code                              |
| `qr_code`              | Base64 QR code image                      |
| `is_used`              | `true` when all students accounted for    |
| `verified_student_ids` | Students picked/dropped using this OTP    |
| `absent_student_ids`   | Students marked absent                    |

---

## Error Scenarios

### Error: "Invalid or expired OTP"

**Cause:** Wrong OTP, expired, or already fully used  
**Solution:** Parent should check their current OTP in the app

### Error: "Student not covered by this OTP"

**Cause:** Trying to verify a student with wrong parent's OTP  
**Solution:** Use the correct parent's OTP

### Error: "Student must be picked up before drop"

**Cause:** Trying to drop a student who hasn't been picked yet  
**Solution:** Pick the student first, then drop

### Error: "Student has already been picked up"

**Cause:** Student was already marked as picked  
**Solution:** No action needed, student is already in the vehicle

---

## Parent App - How to View OTP

```
Endpoint: GET /api/daily-qr-otp/parent/trip/{tripId}
Headers: Authorization: Bearer PARENT_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": {
    "otp_code": "1234",
    "qr_code": "data:image/png;base64,...",
    "student_ids": ["rahul-id", "priya-id"],
    "valid_until": "2026-02-10T05:00:00Z",
    "is_used": false
  }
}
```

Parent shows either:

- **QR Code:** Driver scans with camera
- **4-digit OTP:** Parent tells driver, driver types it

---

## Test Mode

For development/testing:

- **Daily OTP:** Use any OTP code from the database or API response
- Parent can view their OTP via: `GET /api/daily-qr-otp/parent/trip/{tripId}`
