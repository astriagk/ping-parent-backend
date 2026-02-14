# School Transport System - Testing Guide

This guide provides step-by-step instructions to test all new school transport endpoints with dummy data.

---

## Prerequisites

1. **API Base URL**: `http://localhost:3000`
2. **Postman Collection**: Import `School_Transport_System.postman_collection.json`
3. **Database**: Ensure test data exists (see Dummy Data section)
4. **Authentication Tokens**: Save tokens in Postman variables after login

---

## Dummy Data Setup

### 1. School Admin Account (Create in Database)

```json
{
  "admin_id": "SCHADM-001",
  "school_id": "SCHOOL-001",
  "name": "John Manager",
  "email": "admin@springfield.school",
  "phone_number": "+919876543210",
  "password_hash": "hashed_password_here",
  "is_active": true,
  "created_at": "2026-02-01T00:00:00Z",
  "updated_at": "2026-02-01T00:00:00Z"
}
```

### 2. School (Must Exist)

```json
{
  "school_id": "SCHOOL-001",
  "school_name": "Springfield Elementary School",
  "address": "123 School Street",
  "city": "Springfield",
  "state": "Illinois",
  "latitude": 40.7128,
  "longitude": -74.006,
  "contact_number": "+919999888777",
  "email": "info@springfield.school",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### 3. Subscription Plan (Must Exist)

```json
{
  "plan_id": "PLAN-001",
  "plan_name": "Monthly Transport Pass",
  "plan_type": "monthly",
  "price": 5000,
  "features": {
    "pickup_drop": true,
    "realtime_tracking": true,
    "sms_notifications": true
  },
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### 4. Parents (For School Subscriptions)

```json
{
  "parent_id": "PARENT-001",
  "user_id": "USER-001",
  "name": "Homer Simpson",
  "email": "homer@example.com",
  "phone_number": "+919111222333",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### 5. Drivers (For School Assignment)

```json
{
  "driver_id": "DRIVER-001",
  "user_id": "USER-002",
  "driver_unique_id": "DRV-ABC123",
  "name": "Barney Gumble",
  "email": "barney@example.com",
  "vehicle_type": "van",
  "vehicle_number": "MH-01-AA-1234",
  "vehicle_capacity": 10,
  "school_id": "SCHOOL-001",
  "approval_status": "approved",
  "is_available": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### 6. Students (For Assignment)

```json
{
  "student_id": "STUDENT-001",
  "parent_id": "PARENT-001",
  "school_id": "SCHOOL-001",
  "student_name": "Bart Simpson",
  "class": "4th",
  "section": "A",
  "pickup_address_id": "ADDR-001",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

---

## Test Cases

### Test 1: School Admin Authentication

#### 1.1 Register School Admin

**Endpoint**: `POST /api/v1/school/auth/register`

**Request Body**:

```json
{
  "email": "newadmin@springfield.school",
  "password": "SecurePass123",
  "school_id": "SCHOOL-001",
  "phone_number": "+919876543210",
  "name": "New Admin"
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "School admin registered successfully",
  "data": {
    "admin_id": "SCHADM-002",
    "school_id": "SCHOOL-001",
    "email": "newadmin@springfield.school",
    "name": "New Admin"
  }
}
```

**✅ Test Result**: Record the `admin_id` for later tests

---

#### 1.2 Login School Admin

**Endpoint**: `POST /api/v1/school/auth/login`

**Request Body**:

```json
{
  "email": "admin@springfield.school",
  "password": "SecurePass123"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "admin_id": "SCHADM-001",
      "school_id": "SCHOOL-001",
      "email": "admin@springfield.school",
      "name": "John Manager"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

**✅ Test Result**: Save `access_token` to `SCHOOL_ADMIN_TOKEN` variable in Postman

---

#### 1.3 Logout School Admin

**Endpoint**: `POST /api/v1/school/auth/logout`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Test 2: School Driver Management

#### 2.1 Assign Driver to School

**Endpoint**: `POST /api/v1/school/drivers/:driverId/assign`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
Content-Type: application/json
```

**URL Parameters**:

```
driverId = DRIVER-001
```

**Request Body**:

```json
{
  "driver_id": "DRIVER-001"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Driver assigned to school successfully",
  "data": {
    "driver_id": "DRIVER-001",
    "school_id": "SCHOOL-001",
    "name": "Barney Gumble",
    "vehicle_number": "MH-01-AA-1234"
  }
}
```

---

#### 2.2 List School Drivers

**Endpoint**: `GET /api/v1/school/drivers`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Drivers retrieved successfully",
  "data": [
    {
      "driver_id": "DRIVER-001",
      "name": "Barney Gumble",
      "vehicle_type": "van",
      "vehicle_number": "MH-01-AA-1234",
      "vehicle_capacity": 10,
      "is_available": true
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### 2.3 Remove Driver from School

**Endpoint**: `POST /api/v1/school/drivers/:driverId/remove`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**URL Parameters**:

```
driverId = DRIVER-001
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Driver removed from school successfully"
}
```

---

### Test 3: School Student Management

#### 3.1 List School Students

**Endpoint**: `GET /api/v1/school/students?subscription_status=active&limit=20&offset=0`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Query Parameters**:

```
subscription_status = active
limit = 20
offset = 0
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": [
    {
      "student_id": "STUDENT-001",
      "student_name": "Bart Simpson",
      "class": "4th",
      "section": "A",
      "parent_id": "PARENT-001",
      "parent_name": "Homer Simpson",
      "is_active": true
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### 3.2 Get Student Details

**Endpoint**: `GET /api/v1/school/students/:studentId`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**URL Parameters**:

```
studentId = STUDENT-001
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Student retrieved successfully",
  "data": {
    "student_id": "STUDENT-001",
    "student_name": "Bart Simpson",
    "class": "4th",
    "section": "A",
    "parent_id": "PARENT-001",
    "parent_name": "Homer Simpson",
    "school_id": "SCHOOL-001",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### Test 4: School Assignment Management

**Important**: School assignments are **immediately active** upon creation. No approval/rejection needed.
School admin assigns drivers directly since they are employed by the school.

#### 4.1 Assign Driver to Student (School Assignment - Immediate Activation)

**Endpoint**: `POST /api/v1/school/students/:studentId/assign-driver`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
Content-Type: application/json
```

**URL Parameters**:

```
studentId = STUDENT-001
```

**Request Body**:

```json
{
  "driver_id": "DRIVER-001",
  "monthly_fee": 5000
}
```

**Note**: `monthly_fee` is **optional** - use for tracking only (school handles actual payments outside system)

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Driver assigned to student successfully",
  "data": {
    "assignment_id": "ASSIGN-001",
    "driver_id": "DRIVER-001",
    "student_id": "STUDENT-001",
    "monthly_fee": 5000,
    "assignment_source": "school",
    "assignment_status": "active",
    "assigned_date": "2026-02-01"
  }
}
```

**✅ Test Result**: Assignment is **active immediately** (no approval needed)

---

#### 4.2 Get School Assignments

**Endpoint**: `GET /api/v1/school/assignments?assignment_status=active&limit=20&offset=0`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Query Parameters**:

```
assignment_status = active
limit = 20
offset = 0
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Assignments retrieved successfully",
  "data": [
    {
      "assignment_id": "ASSIGN-001",
      "driver_id": "DRIVER-001",
      "driver_name": "Barney Gumble",
      "student_id": "STUDENT-001",
      "student_name": "Bart Simpson",
      "assignment_source": "school",
      "assignment_status": "active",
      "monthly_fee": 5000
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

**URL Parameters**:

```
assignmentId = ASSIGN-001
```

**Request Body**:

```json
{
  "reason": "Driver not available for this route"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Assignment rejected successfully",
  "data": {
    "assignment_id": "ASSIGN-001",
    "assignment_status": "rejected",
    "rejection_reason": "Driver not available for this route"
  }
}
```

---

### Test 5: School Subscription Code Management

#### 5.1 Generate Subscription Codes

**Endpoint**: `POST /api/v1/school/subscriptions/generate-code`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "plan_id": "PLAN-001",
  "parent_list": ["PARENT-001", "PARENT-002"],
  "start_date": "2026-02-01",
  "end_date": "2026-03-01"
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Subscription codes generated successfully",
  "data": [
    {
      "subscription_id": "SUB-001",
      "subscription_code": "SCH-ABC123XYZ",
      "plan_id": "PLAN-001",
      "validity_period": "2026-02-01 to 2026-03-01",
      "is_redeemed": false,
      "parent_id": "PARENT-001"
    },
    {
      "subscription_id": "SUB-002",
      "subscription_code": "SCH-DEF456UVW",
      "plan_id": "PLAN-001",
      "validity_period": "2026-02-01 to 2026-03-01",
      "is_redeemed": false,
      "parent_id": "PARENT-002"
    }
  ]
}
```

**✅ Test Result**: Record `subscription_code` for parent redemption test

---

#### 5.2 List Subscription Codes

**Endpoint**: `GET /api/v1/school/subscriptions?limit=20&offset=0`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Query Parameters**:

```
limit = 20
offset = 0
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Subscription codes retrieved successfully",
  "data": [
    {
      "subscription_id": "SUB-001",
      "subscription_code": "SCH-ABC123XYZ",
      "plan_id": "PLAN-001",
      "school_id": "SCHOOL-001",
      "parent_id": "PARENT-001",
      "status": "active",
      "is_redeemed": false,
      "start_date": "2026-02-01",
      "end_date": "2026-03-01",
      "created_at": "2026-02-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### 5.3 Get Subscription Analytics

**Endpoint**: `GET /api/v1/school/subscriptions/analytics`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "total_codes_generated": 2,
    "total_codes_redeemed": 0,
    "active_subscriptions": 2,
    "expired_subscriptions": 0,
    "cancelled_subscriptions": 0,
    "redemption_rate": 0,
    "pending_redemptions": 2
  }
}
```

---

### Test 6: Parent School Subscription Redemption

#### 6.1 Parent Login (Create Parent Account First)

**Endpoint**: `POST /api/v1/auth/parent/login` (Use existing parent auth)

**Request Body**:

```json
{
  "phone_number": "+919111222333",
  "otp": "123456"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**✅ Test Result**: Save `access_token` to `PARENT_TOKEN` variable

---

#### 6.2 Redeem Subscription Code

**Endpoint**: `POST /api/v1/parent/school-subscriptions/redeem`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "subscription_code": "SCH-ABC123XYZ"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Subscription code redeemed successfully",
  "data": {
    "subscription_id": "SUB-001",
    "school_id": "SCHOOL-001",
    "school_name": "Springfield Elementary School",
    "plan_id": "PLAN-001",
    "subscription_status": "active",
    "is_redeemed": true,
    "redeemed_at": "2026-02-01T12:00:00Z",
    "start_date": "2026-02-01",
    "end_date": "2026-03-01"
  }
}
```

---

#### 6.3 Get Parent School Subscriptions

**Endpoint**: `GET /api/v1/parent/school-subscriptions`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "School subscriptions retrieved successfully",
  "data": [
    {
      "subscription_id": "SUB-001",
      "school_id": "SCHOOL-001",
      "school_name": "Springfield Elementary School",
      "subscription_status": "active",
      "start_date": "2026-02-01",
      "end_date": "2026-03-01",
      "redeemed_at": "2026-02-01T12:00:00Z"
    }
  ]
}
```

---

#### 6.4 Cancel School Subscription

**Endpoint**: `POST /api/v1/parent/school-subscriptions/:subscriptionId/cancel`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
```

**URL Parameters**:

```
subscriptionId = SUB-001
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription_id": "SUB-001",
    "subscription_status": "cancelled",
    "cancelled_at": "2026-02-01T14:00:00Z"
  }
}
```

---

### Test 7: Modified Assignment Endpoints (Parent Assignment)

#### 7.1 Parent Assign Driver to Student

**Endpoint**: `POST /api/v1/students/:studentId/assign-driver`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
Content-Type: application/json
```

**URL Parameters**:

```
studentId = STUDENT-002
```

**Request Body**:

```json
{
  "driver_unique_id": "DRV-ABC123",
  "monthly_fee": 5500
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Driver assigned to student successfully",
  "data": {
    "assignment_id": "ASSIGN-002",
    "driver_id": "DRIVER-002",
    "student_id": "STUDENT-002",
    "monthly_fee": 5500,
    "assignment_source": "parent",
    "assignment_status": "pending",
    "assigned_date": "2026-02-01"
  }
}
```

---

#### 7.2 Get Student Assignments

**Endpoint**: `GET /api/v1/students/:studentId/assignments`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
```

**URL Parameters**:

```
studentId = STUDENT-002
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Student assignments retrieved successfully",
  "data": [
    {
      "assignment_id": "ASSIGN-002",
      "driver_id": "DRIVER-002",
      "driver_name": "Barney Gumble",
      "assignment_source": "parent",
      "assignment_status": "active",
      "monthly_fee": 5500,
      "assigned_date": "2026-02-01"
    }
  ]
}
```

---

### Test 8: Trip Generation

#### 8.1 Generate Daily Trips

**Endpoint**: `POST /api/v1/trips/generate-daily`

**Headers**:

```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "trip_date": "2026-02-02",
  "assignment_source": "both"
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Daily trips generated successfully",
  "data": {
    "trips_generated": 2,
    "trips": [
      {
        "trip_id": "TRIP-001",
        "driver_id": "DRIVER-001",
        "driver_name": "Barney Gumble",
        "school_id": "SCHOOL-001",
        "trip_type": "pickup",
        "trip_date": "2026-02-02",
        "trip_status": "scheduled",
        "students_count": 2,
        "assignment_source": "school"
      },
      {
        "trip_id": "TRIP-002",
        "driver_id": "DRIVER-002",
        "driver_name": "Homer Simpson",
        "school_id": "SCHOOL-001",
        "trip_type": "drop",
        "trip_date": "2026-02-02",
        "trip_status": "scheduled",
        "students_count": 1,
        "assignment_source": "parent"
      }
    ]
  }
}
```

---

## Error Test Cases

### Error 1: Unauthorized Access

**Endpoint**: `GET /api/v1/school/drivers`

**Headers** (No Authorization):

```
Content-Type: application/json
```

**Expected Response** (401):

```json
{
  "success": false,
  "error": "Authorization header missing"
}
```

---

### Error 2: Invalid Subscription Code

**Endpoint**: `POST /api/v1/parent/school-subscriptions/redeem`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
```

**Request Body**:

```json
{
  "subscription_code": "INVALID-CODE"
}
```

**Expected Response** (404):

```json
{
  "success": false,
  "error": "Subscription code not found"
}
```

---

### Error 3: Assignment Already Active

**Endpoint**: `POST /api/v1/school/assignments/:assignmentId/approve`

**Request**: Try to approve an already approved assignment

**Expected Response** (400):

```json
{
  "success": false,
  "error": "Assignment is already active"
}
```

---

### Error 4: Code Already Redeemed

**Endpoint**: `POST /api/v1/parent/school-subscriptions/redeem`

**Request**: Try to redeem same code twice

**Expected Response** (400):

```json
{
  "success": false,
  "error": "This subscription code has already been redeemed"
}
```

---

## Test Execution Checklist

- [ ] **Test 1.1**: Register School Admin
- [ ] **Test 1.2**: Login School Admin (Save Token)
- [ ] **Test 1.3**: Logout School Admin
- [ ] **Test 2.1**: Assign Driver to School
- [ ] **Test 2.2**: List School Drivers
- [ ] **Test 2.3**: Remove Driver from School
- [ ] **Test 3.1**: List School Students
- [ ] **Test 3.2**: Get Student Details
- [ ] **Test 4.1**: Assign Driver to Student (School - Immediate Activation)
- [ ] **Test 4.2**: Get School Assignments
- [ ] **Test 5.1**: Generate Subscription Codes
- [ ] **Test 5.2**: List Subscription Codes
- [ ] **Test 5.3**: Get Subscription Analytics
- [ ] **Test 6.1**: Parent Login (Save Token)
- [ ] **Test 6.2**: Redeem Subscription Code
- [ ] **Test 6.3**: Get Parent School Subscriptions
- [ ] **Test 6.4**: Cancel School Subscription
- [ ] **Test 7.1**: Parent Assign Driver to Student (Requires Approval)
- [ ] **Test 7.2**: Get Student Assignments
- [ ] **Test 7.3**: Approve Parent Assignment
- [ ] **Test 7.4**: Reject Parent Assignment
- [ ] **Test 8.1**: Generate Daily Trips
- [ ] **Error Test 1**: Unauthorized Access
- [ ] **Error Test 2**: Invalid Subscription Code
- [ ] **Error Test 3**: Assignment Already Active
- [ ] **Error Test 4**: Code Already Redeemed

---

## Quick Postman Setup

1. **Import Collection**: `School_Transport_System.postman_collection.json`
2. **Set Environment Variables**:
   - `BASE_URL` = `http://localhost:3000`
   - `SCHOOL_ADMIN_TOKEN` = (Fill after login test)
   - `PARENT_TOKEN` = (Fill after parent login)
   - `ADMIN_TOKEN` = (Fill after admin login)
3. **Run Tests**: Execute in order from Test 1 to Test 8

---

## Troubleshooting

### Issue: "Unauthorized" Error

- **Cause**: Token expired or not set in header
- **Solution**: Re-run login test and update token variable

### Issue: "Resource Not Found"

- **Cause**: Dummy data IDs don't match
- **Solution**: Update request IDs to match your database

### Issue: "Validation Error"

- **Cause**: Missing required fields
- **Solution**: Check request body against examples provided

### Issue: "Assignment Source Must Be 'parent' or 'school'"

- **Cause**: Database schema issue
- **Solution**: Ensure `assignment_source` enum is created in migrations

---

## Performance Notes

- **Bulk Operations**: Test with 50+ students for trip generation performance
- **Concurrent Requests**: Test multiple school admins accessing same endpoints
- **Code Expiry**: Test code redemption after expiry date (should fail)
- **Rate Limiting**: Test login attempts (should be rate-limited after 5 attempts)
