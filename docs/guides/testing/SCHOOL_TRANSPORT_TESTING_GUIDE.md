# School Transport System - Testing Guide

This guide provides step-by-step instructions to test all school transport endpoints with dummy data.

---

## Prerequisites

1. **API Base URL**: `http://localhost:3000/api`
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

**Endpoint**: `POST /api/school-admin/register`

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

**Test Result**: Record the `admin_id` for later tests

---

#### 1.2 Login School Admin

**Endpoint**: `POST /api/school-admin/login`

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
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Test Result**: Save `token` to `SCHOOL_ADMIN_TOKEN` variable in Postman

---

#### 1.3 Get Current School Admin Profile

**Endpoint**: `GET /api/school-admin/me`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": {
    "admin_id": "SCHADM-001",
    "school_id": "SCHOOL-001",
    "name": "John Manager",
    "email": "admin@springfield.school",
    "phone_number": "+919876543210",
    "is_active": true
  }
}
```

---

#### 1.4 Change School Admin Password

**Endpoint**: `POST /api/school-admin/change-password`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "current_password": "SecurePass123",
  "new_password": "NewSecurePass456"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Test 2: School Driver Management

#### 2.1 Assign Driver to School

**Endpoint**: `POST /api/school-driver/assign`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "driver_id": "DRIVER-001",
  "school_id": "SCHOOL-001"
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

**Endpoint**: `GET /api/school-driver/SCHOOL-001`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "driver_id": "DRIVER-001",
      "name": "Barney Gumble",
      "vehicle_type": "van",
      "vehicle_number": "MH-01-AA-1234",
      "vehicle_capacity": 10,
      "is_available": true
    }
  ]
}
```

---

#### 2.3 Get Driver Details

**Endpoint**: `GET /api/school-driver/DRIVER-001/details`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": {
    "driver_id": "DRIVER-001",
    "name": "Barney Gumble",
    "vehicle_type": "van",
    "vehicle_number": "MH-01-AA-1234",
    "vehicle_capacity": 10,
    "school_id": "SCHOOL-001",
    "is_available": true
  }
}
```

---

#### 2.4 Remove Driver from School

**Endpoint**: `POST /api/school-driver/DRIVER-001/remove`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Driver removed from school successfully"
}
```

---

### Test 3: School Assignment Management

**Important**: School assignments are **immediately active** upon creation. No approval/rejection needed.
School admin assigns drivers directly since they are employed by the school.

#### 3.1 Create School Assignment (Immediate Activation)

**Endpoint**: `POST /api/school-assignments/SCHOOL-001/create`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "driver_id": "DRIVER-001",
  "student_id": "STUDENT-001",
  "monthly_fee": 5000,
  "start_date": "2026-02-01"
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "assignment_id": "DSA-XXXXXX",
    "driver_id": "DRIVER-001",
    "student_id": "STUDENT-001",
    "school_id": "SCHOOL-001",
    "monthly_fee": 5000,
    "assignment_source": "school_admin",
    "assignment_status": "active",
    "assigned_date": "2026-02-01"
  }
}
```

**Test Result**: Assignment is **active immediately** (no approval needed). Record `assignment_id`.

---

#### 3.2 Get School Assignments

**Endpoint**: `GET /api/school-assignments/SCHOOL-001`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "assignment_id": "DSA-XXXXXX",
      "driver_id": "DRIVER-001",
      "student_id": "STUDENT-001",
      "school_id": "SCHOOL-001",
      "assignment_source": "school_admin",
      "assignment_status": "active",
      "monthly_fee": 5000
    }
  ]
}
```

---

#### 3.3 Get Pending Assignments

**Endpoint**: `GET /api/school-assignments/SCHOOL-001/pending`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": []
}
```

**Note**: School-created assignments are immediately active, so this returns parent-requested assignments awaiting school approval.

---

#### 3.4 Get Assignments by Driver

**Endpoint**: `GET /api/school-assignments/SCHOOL-001/driver/DRIVER-001`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "assignment_id": "DSA-XXXXXX",
      "driver_id": "DRIVER-001",
      "student_id": "STUDENT-001",
      "assignment_status": "active"
    }
  ]
}
```

---

#### 3.5 Approve Assignment (For Parent-Requested Assignments)

**Endpoint**: `POST /api/school-assignments/DSA-XXXXXX/approve`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Assignment approved successfully",
  "data": {
    "assignment_id": "DSA-XXXXXX",
    "assignment_status": "active"
  }
}
```

---

#### 3.6 Reject Assignment

**Endpoint**: `POST /api/school-assignments/DSA-XXXXXX/reject`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "rejection_reason": "Driver not available for this route"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Assignment rejected successfully",
  "data": {
    "assignment_id": "DSA-XXXXXX",
    "assignment_status": "rejected"
  }
}
```

---

### Test 4: School Subscription Management

#### 4.1 Create School Subscription

**Endpoint**: `POST /api/school-subscriptions`

**Headers**:

```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "school_id": "SCHOOL-001",
  "plan_id": "PLAN-001",
  "start_date": "2026-02-01",
  "end_date": "2026-03-01",
  "auto_renew": false,
  "max_drivers": 10,
  "max_students": 50,
  "billing_contact": "billing@springfield.school"
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "School subscription created successfully",
  "data": {
    "subscription_id": "SCHSUB-XXXXXX",
    "school_id": "SCHOOL-001",
    "plan_id": "PLAN-001",
    "start_date": "2026-02-01",
    "end_date": "2026-03-01",
    "subscription_status": "active",
    "auto_renew": false,
    "max_drivers": 10,
    "max_students": 50
  }
}
```

**Test Result**: Record `subscription_id` for code generation test

---

#### 4.2 Get Subscriptions for School

**Endpoint**: `GET /api/school-subscriptions/school/SCHOOL-001`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "subscription_id": "SCHSUB-XXXXXX",
      "school_id": "SCHOOL-001",
      "plan_id": "PLAN-001",
      "subscription_status": "active",
      "start_date": "2026-02-01",
      "end_date": "2026-03-01"
    }
  ]
}
```

---

#### 4.3 Get Active Subscription for School

**Endpoint**: `GET /api/school-subscriptions/school/SCHOOL-001/active`

**Headers**:

```
Authorization: Bearer {{SCHOOL_ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": {
    "subscription_id": "SCHSUB-XXXXXX",
    "subscription_status": "active",
    "start_date": "2026-02-01",
    "end_date": "2026-03-01"
  }
}
```

---

#### 4.4 Renew Subscription

**Endpoint**: `POST /api/school-subscriptions/SCHSUB-XXXXXX/renew`

**Headers**:

```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "newEndDate": "2026-04-01"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "School subscription renewed successfully",
  "data": {
    "subscription_id": "SCHSUB-XXXXXX",
    "end_date": "2026-04-01",
    "subscription_status": "active"
  }
}
```

---

#### 4.5 Cancel Subscription

**Endpoint**: `POST /api/school-subscriptions/SCHSUB-XXXXXX/cancel`

**Headers**:

```
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "School subscription cancelled successfully",
  "data": {
    "subscription_id": "SCHSUB-XXXXXX",
    "subscription_status": "cancelled"
  }
}
```

---

### Test 5: Student Code Generation & Redemption

#### 5.1 Generate Per-Student Codes

**Endpoint**: `POST /api/school-subscriptions/SCHSUB-XXXXXX/generate-codes`

**Headers**:

```
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "student_ids": ["STUDENT-001", "STUDENT-002"]
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Student codes generated successfully",
  "data": [
    {
      "code_id": "SSC-XXXXXX",
      "code": "SCHSTDCD-ABC123",
      "school_subscription_id": "SCHSUB-XXXXXX",
      "school_id": "SCHOOL-001",
      "student_id": "STUDENT-001",
      "plan_id": "PLAN-001",
      "is_redeemed": false
    },
    {
      "code_id": "SSC-YYYYYY",
      "code": "SCHSTDCD-DEF456",
      "school_subscription_id": "SCHSUB-XXXXXX",
      "school_id": "SCHOOL-001",
      "student_id": "STUDENT-002",
      "plan_id": "PLAN-001",
      "is_redeemed": false
    }
  ]
}
```

**Test Result**: Record `code` values for parent redemption test

---

#### 5.2 List Codes for Subscription

**Endpoint**: `GET /api/school-subscriptions/SCHSUB-XXXXXX/codes`

**Headers**:

```
Authorization: Bearer {{ADMIN_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "code_id": "SSC-XXXXXX",
      "code": "SCHSTDCD-ABC123",
      "student_id": "STUDENT-001",
      "is_redeemed": false,
      "created_at": "2026-02-01T10:00:00Z"
    },
    {
      "code_id": "SSC-YYYYYY",
      "code": "SCHSTDCD-DEF456",
      "student_id": "STUDENT-002",
      "is_redeemed": false,
      "created_at": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

### Test 6: Parent Redemption

#### 6.1 Parent Login (Create Parent Account First)

**Endpoint**: `POST /api/auth/login/verify-otp` (Use existing parent auth)

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
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Test Result**: Save `token` to `PARENT_TOKEN` variable

---

#### 6.2 Redeem Subscription Code

**Endpoint**: `POST /api/redemptions/redeem`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "subscription_code": "SCHSTDCD-ABC123"
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Subscription code redeemed successfully",
  "data": {
    "subscription_id": "SUB-XXXXXX",
    "school_id": "SCHOOL-001",
    "plan_id": "PLAN-001",
    "subscription_status": "active",
    "start_date": "2026-02-01",
    "end_date": "2026-03-01"
  }
}
```

---

#### 6.3 Get Active Subscription

**Endpoint**: `GET /api/redemptions/active`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": {
    "subscription_id": "SUB-XXXXXX",
    "subscription_status": "active",
    "start_date": "2026-02-01",
    "end_date": "2026-03-01"
  }
}
```

---

#### 6.4 Get All Parent Subscriptions

**Endpoint**: `GET /api/redemptions/`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "subscription_id": "SUB-XXXXXX",
      "subscription_status": "active",
      "start_date": "2026-02-01",
      "end_date": "2026-03-01"
    }
  ]
}
```

---

#### 6.5 Check Subscription Status

**Endpoint**: `GET /api/redemptions/status/check`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": {
    "has_active_subscription": true
  }
}
```

---

#### 6.6 Cancel Subscription

**Endpoint**: `POST /api/redemptions/cancel`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "subscription_id": "SUB-XXXXXX"
}
```

**Expected Response** (200):

```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription_id": "SUB-XXXXXX",
    "subscription_status": "cancelled"
  }
}
```

---

### Test 7: Parent Assignment Endpoints

#### 7.1 Parent Assign Driver to Student

**Endpoint**: `POST /api/driver-student-assignments`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "driver_id": "DRIVER-002",
  "student_id": "STUDENT-002",
  "driver_unique_id": "DRV-XYZ789",
  "monthly_fee": 5500,
  "assignment_source": "parent"
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "assignment_id": "DSA-YYYYYY",
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

**Endpoint**: `GET /api/driver-student-assignments/student/STUDENT-002`

**Headers**:

```
Authorization: Bearer {{PARENT_TOKEN}}
```

**Expected Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "assignment_id": "DSA-YYYYYY",
      "driver_id": "DRIVER-002",
      "assignment_source": "parent",
      "assignment_status": "pending",
      "monthly_fee": 5500,
      "assigned_date": "2026-02-01"
    }
  ]
}
```

---

### Test 8: Trip Generation

#### 8.1 Create Trip

**Endpoint**: `POST /api/trips`

**Headers**:

```
Authorization: Bearer {{DRIVER_TOKEN}}
Content-Type: application/json
```

**Request Body**:

```json
{
  "school_id": "SCHOOL-001",
  "trip_type": "pickup",
  "trip_date": "2026-02-02"
}
```

**Expected Response** (201):

```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "trip_id": "TRP-XXXXXX",
    "driver_id": "DRIVER-001",
    "school_id": "SCHOOL-001",
    "trip_type": "pickup",
    "trip_date": "2026-02-02",
    "trip_status": "scheduled"
  }
}
```

---

## Error Test Cases

### Error 1: Unauthorized Access

**Endpoint**: `GET /api/school-driver/SCHOOL-001`

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

**Endpoint**: `POST /api/redemptions/redeem`

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

**Endpoint**: `POST /api/school-assignments/DSA-XXXXXX/approve`

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

**Endpoint**: `POST /api/redemptions/redeem`

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
- [ ] **Test 1.3**: Get Current Admin Profile
- [ ] **Test 1.4**: Change Password
- [ ] **Test 2.1**: Assign Driver to School
- [ ] **Test 2.2**: List School Drivers
- [ ] **Test 2.3**: Get Driver Details
- [ ] **Test 2.4**: Remove Driver from School
- [ ] **Test 3.1**: Create School Assignment (Immediate Activation)
- [ ] **Test 3.2**: Get School Assignments
- [ ] **Test 3.3**: Get Pending Assignments
- [ ] **Test 3.4**: Get Assignments by Driver
- [ ] **Test 3.5**: Approve Assignment
- [ ] **Test 3.6**: Reject Assignment
- [ ] **Test 4.1**: Create School Subscription
- [ ] **Test 4.2**: Get Subscriptions for School
- [ ] **Test 4.3**: Get Active Subscription
- [ ] **Test 4.4**: Renew Subscription
- [ ] **Test 4.5**: Cancel Subscription
- [ ] **Test 5.1**: Generate Per-Student Codes
- [ ] **Test 5.2**: List Codes for Subscription
- [ ] **Test 6.1**: Parent Login (Save Token)
- [ ] **Test 6.2**: Redeem Subscription Code
- [ ] **Test 6.3**: Get Active Subscription
- [ ] **Test 6.4**: Get All Parent Subscriptions
- [ ] **Test 6.5**: Check Subscription Status
- [ ] **Test 6.6**: Cancel Subscription
- [ ] **Test 7.1**: Parent Assign Driver to Student (Requires Approval)
- [ ] **Test 7.2**: Get Student Assignments
- [ ] **Test 8.1**: Create Trip
- [ ] **Error Test 1**: Unauthorized Access
- [ ] **Error Test 2**: Invalid Subscription Code
- [ ] **Error Test 3**: Assignment Already Active
- [ ] **Error Test 4**: Code Already Redeemed

---

## Quick Postman Setup

1. **Import Collection**: `School_Transport_System.postman_collection.json`
2. **Set Environment Variables**:
   - `BASE_URL` = `http://localhost:3000/api`
   - `SCHOOL_ADMIN_TOKEN` = (Fill after login test)
   - `PARENT_TOKEN` = (Fill after parent login)
   - `ADMIN_TOKEN` = (Fill after admin login)
   - `DRIVER_TOKEN` = (Fill after driver login)
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

### Issue: "Assignment Source Must Be 'parent' or 'school_admin'"

- **Cause**: Invalid enum value for `assignment_source`
- **Solution**: Use `parent`, `school_admin`, or `system` as values

---

## Performance Notes

- **Bulk Operations**: Test with 50+ students for code generation performance
- **Concurrent Requests**: Test multiple school admins accessing same endpoints
- **Code Expiry**: Test code redemption after expiry date (should fail)
- **Rate Limiting**: Test login attempts (should be rate-limited after 5 attempts)
