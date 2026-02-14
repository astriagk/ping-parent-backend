# API Usage Guide by Application

**Version:** 1.0.0  
**Last Updated:** February 2026

---

## Quick Reference: Which APIs for Which App

| Feature                 | Parent App     | Driver App  | Admin App     | School App      |
| ----------------------- | -------------- | ----------- | ------------- | --------------- |
| Authentication          | ✅             | ✅          | ✅            | ✅              |
| User Profile Management | ✅ Parent      | ✅ Driver   | ✅ Admin      | ✅ School Admin |
| Trips & Tracking        | ✅ (Track)     | ✅ (Manage) | ✅ (View All) | ✅ (Manage)     |
| Student Management      | ✅ (View Kids) | ❌          | ✅ (All)      | ✅ (All)        |
| Billing & Payments      | ✅             | ❌          | ✅ (Monitor)  | ✅              |
| Notifications           | ✅             | ✅          | ✅            | ✅              |
| Reviews & Ratings       | ✅             | ✅          | ✅ (View)     | ❌              |
| Real-time Tracking      | ✅             | ✅          | ✅            | ✅              |

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Parent App APIs](#parent-app-apis)
3. [Driver App APIs](#driver-app-apis)
4. [Admin App APIs](#admin-app-apis)
5. [School App APIs](#school-app-apis)
6. [Shared/Common APIs](#sharedcommon-apis)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Authentication Flow

### Step 1: Common for All Apps - Get Authentication Token

#### 1.1 Send OTP (Registration)

```
POST /auth/register/send-otp
Content-Type: application/json

{
  "phone_number": "+91-9876543210"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp_sent_at": "2026-02-01T10:30:00Z"
}
```

#### 1.2 Verify OTP (Registration)

```
POST /auth/register/verify-otp
Content-Type: application/json

{
  "phone_number": "+91-9876543210",
  "otp": "123456",
  "user_type": "parent" | "driver" | "student" | "school_admin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "phone_number": "+91-9876543210",
    "user_type": "parent"
  }
}
```

#### 1.3 Send OTP (Login)

```
POST /auth/login/send-otp
Content-Type: application/json

{
  "phone_number": "+91-9876543210"
}
```

#### 1.4 Verify OTP (Login)

```
POST /auth/login/verify-otp
Content-Type: application/json

{
  "phone_number": "+91-9876543210",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "phone_number": "+91-9876543210",
    "user_type": "parent"
  }
}
```

#### 1.5 Verify Token (Validate Current Session)

```
GET /auth/verify-token
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "phone_number": "+91-9876543210",
    "user_type": "parent"
  }
}
```

#### 1.6 Logout

```
POST /auth/logout
Authorization: Bearer {token}
```

---

## Parent App APIs

### Overview

Parent app allows users to:

- Manage their profile and address
- View and track their children (students)
- Manage billing and subscriptions
- View trip history and live tracking
- Receive notifications
- Rate and review drivers/trips

### Base URL

```
/parent
```

### 1. Profile Management

#### Get Parent Profile

```
GET /parent/profile
Authorization: Bearer {parent_token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "parent_123",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+91-9876543210",
    "email": "john@example.com",
    "profile_image_url": "https://...",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

#### Update Parent Profile

```
PUT /parent/profile
Authorization: Bearer {parent_token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com"
}
```

### 2. Address Management

#### Get Parent Address

```
GET /parent/address
Authorization: Bearer {parent_token}
```

#### Update Parent Address

```
PUT /parent/address
Authorization: Bearer {parent_token}
Content-Type: application/json

{
  "street": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "India",
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

### 3. Student/Child Management

#### Get All Parent's Students

```
GET /students?parent_id={parent_id}
Authorization: Bearer {parent_token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "student_456",
      "first_name": "Alice",
      "last_name": "Doe",
      "school_id": "school_789",
      "grade": "5B",
      "roll_number": "45",
      "date_of_birth": "2015-05-15"
    }
  ]
}
```

### 4. Trip Tracking & History

#### Get Live Trip Information

```
GET /tracking/live?student_id={student_id}
Authorization: Bearer {parent_token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "trip_id": "trip_001",
    "student_id": "student_456",
    "driver_id": "driver_789",
    "driver_name": "Ahmed Khan",
    "driver_contact": "+91-7654321098",
    "current_location": {
      "latitude": 19.076,
      "longitude": 72.8777,
      "timestamp": "2026-02-01T10:30:00Z"
    },
    "estimated_arrival": "2026-02-01T10:45:00Z",
    "trip_status": "in_transit"
  }
}
```

#### Get Trip History

```
GET /trips?student_id={student_id}&limit=10&offset=0
Authorization: Bearer {parent_token}
```

### 5. Billing & Subscriptions

#### Get Active Subscription

```
GET /parent-subscriptions/active
Authorization: Bearer {parent_token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "parent_id": "parent_123",
    "plan_id": "plan_456",
    "plan_name": "Premium",
    "status": "active",
    "start_date": "2026-01-01",
    "end_date": "2026-02-01",
    "renewal_date": "2026-02-01",
    "amount": 2000,
    "currency": "INR"
  }
}
```

#### Get Available Plans

```
GET /subscription-plans
Authorization: Bearer {parent_token}
```

#### Create Payment

```
POST /payments
Authorization: Bearer {parent_token}
Content-Type: application/json

{
  "parent_id": "parent_123",
  "plan_id": "plan_456",
  "amount": 2000,
  "currency": "INR",
  "payment_method": "razorpay"
}
```

### 6. Notifications

#### Get Parent Notifications

```
GET /notifications?user_id={parent_id}&user_type=parent
Authorization: Bearer {parent_token}
```

#### Mark Notification as Read

```
PATCH /notifications/{notification_id}/read
Authorization: Bearer {parent_token}
```

### 7. Ratings & Reviews

#### Rate a Driver

```
POST /ratings-reviews
Authorization: Bearer {parent_token}
Content-Type: application/json

{
  "driver_id": "driver_789",
  "rating": 4.5,
  "comment": "Great driver, very safe",
  "trip_id": "trip_001"
}
```

#### Get Reviews for a Driver

```
GET /ratings-reviews?driver_id={driver_id}
Authorization: Bearer {parent_token}
```

---

## Driver App APIs

### Overview

Driver app allows:

- Profile and onboarding completion
- Document uploads (license, vehicle, insurance)
- Accept/manage trips and assignments
- Track real-time locations
- Manage availability
- View ratings and reviews
- Handle QR/OTP verification

### Base URL

```
/driver
```

### 1. Onboarding & Profile

#### Get Driver Onboarding Screen Status

```
GET /driver/profile?step=1
Authorization: Bearer {driver_token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "onboarding_steps": [
      {
        "step": 1,
        "name": "Profile Information",
        "status": "completed"
      },
      {
        "step": 2,
        "name": "Documents Upload",
        "status": "pending"
      },
      {
        "step": 3,
        "name": "Vehicle Information",
        "status": "pending"
      }
    ]
  }
}
```

#### Create Driver Profile

```
POST /driver/profile
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "first_name": "Ahmed",
  "last_name": "Khan",
  "email": "ahmed@example.com",
  "date_of_birth": "1990-05-15",
  "gender": "male"
}
```

#### Update Driver Profile

```
PUT /driver/profile
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "first_name": "Ahmed",
  "email": "ahmed@example.com"
}
```

#### Update Onboarding Screen Progress

```
PATCH /driver/onboarding
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "current_step": 2,
  "status": "completed"
}
```

### 2. Document Management

#### Get Driver Documents

```
GET /driver/documents
Authorization: Bearer {driver_token}
```

#### Upload Documents

```
POST /driver/documents
Authorization: Bearer {driver_token}
Content-Type: multipart/form-data

Form Fields:
- driving_license_photo: File
- vehicle_license_photo: File
- insurance_photo: File
- license_expiry_date: "2027-05-15"
- vehicle_registration_number: "DL01AB1234"
```

#### Update Documents

```
PUT /driver/documents
Authorization: Bearer {driver_token}
Content-Type: multipart/form-data
```

### 3. Address Management

#### Get Driver Address

```
GET /driver/address
Authorization: Bearer {driver_token}
```

#### Create/Update Driver Address

```
POST /driver/address
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "street": "456 Park Ave",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

### 4. Availability Management

#### Set Driver Availability

```
PATCH /driver/availability
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "is_available": true,
  "availability_status": "available" | "on_duty" | "off_duty"
}
```

### 5. Trip Management

#### Get Driver's Assigned Trips

```
GET /trips?driver_id={driver_id}&status=assigned
Authorization: Bearer {driver_token}
```

#### Get Active Trip

```
GET /trips/active
Authorization: Bearer {driver_token}
```

#### Accept Trip Assignment

```
PATCH /driver-student-assignments/{assignment_id}/accept
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "driver_id": "driver_789",
  "status": "accepted"
}
```

#### Reject Trip Assignment

```
PATCH /driver-student-assignments/{assignment_id}/reject
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "reason": "Not available at that time"
}
```

#### Start Trip

```
PATCH /trips/{trip_id}/start
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "start_time": "2026-02-01T08:00:00Z",
  "start_location": {
    "latitude": 19.0760,
    "longitude": 72.8777
  }
}
```

#### End Trip

```
PATCH /trips/{trip_id}/end
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "end_time": "2026-02-01T09:00:00Z",
  "end_location": {
    "latitude": 19.0780,
    "longitude": 72.8800
  }
}
```

### 6. Student Attendance & QR/OTP

#### Get Daily QR Code/OTP for Trip

```
GET /daily-qr-otp/{trip_id}
Authorization: Bearer {driver_token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "qr_code": "data:image/png;base64,...",
    "otp": "123456",
    "expires_at": "2026-02-01T09:30:00Z",
    "students": [
      {
        "id": "student_456",
        "name": "Alice Doe"
      }
    ]
  }
}
```

#### Mark Student Attendance

```
POST /trip-students/{trip_id}/attendance
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "student_id": "student_456",
  "otp": "123456",
  "attendance_status": "present" | "absent",
  "timestamp": "2026-02-01T08:15:00Z"
}
```

### 7. Real-time Location Tracking

#### Send Driver Location Update

```
POST /tracking/update-location
Authorization: Bearer {driver_token}
Content-Type: application/json

{
  "driver_id": "driver_789",
  "trip_id": "trip_001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "speed": 25,
  "accuracy": 5,
  "timestamp": "2026-02-01T10:30:00Z"
}
```

### 8. Ratings & Reviews

#### Get Driver Reviews

```
GET /ratings-reviews?driver_id={driver_id}
Authorization: Bearer {driver_token}
```

---

## Admin App APIs

### Overview

Admin app enables:

- User and role management
- School management
- View all trips and statistics
- Billing and payment monitoring
- System-wide notifications
- Audit logs and compliance
- Subscription oversight

### Base URL Prefix

```
/admin for admin operations
```

### 1. User Management

#### Get All Users

```
GET /auth/admin/users
Authorization: Bearer {admin_token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "phone_number": "+91-9876543210",
      "user_type": "parent",
      "status": "active",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

#### Activate User

```
PATCH /auth/admin/users/{user_id}/activate
Authorization: Bearer {admin_token}
```

#### Deactivate User

```
PATCH /auth/admin/users/{user_id}/deactivate
Authorization: Bearer {admin_token}
```

### 2. School Management

#### Get All Schools

```
GET /schools
Authorization: Bearer {admin_token}
```

#### Get School Details

```
GET /schools/{school_id}
Authorization: Bearer {admin_token}
```

#### Create School

```
POST /schools/admin
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "St. Mary's School",
  "email": "admin@stmarys.com",
  "phone_number": "+91-2222222222",
  "address": {
    "street": "123 Education Lane",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001"
  },
  "principal_name": "Dr. Sharma"
}
```

#### Update School

```
PUT /schools/admin/{school_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "St. Mary's School",
  "email": "admin@stmarys.com"
}
```

#### Delete School

```
DELETE /schools/admin/{school_id}
Authorization: Bearer {admin_token}
```

### 3. Role Management

#### Get All Roles

```
GET /roles
Authorization: Bearer {admin_token}
```

#### Create Role

```
POST /admin/role-management
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Super Admin",
  "permissions": ["user_manage", "school_manage", "billing_manage"]
}
```

### 4. Billing & Subscription Monitoring

#### Get All School Subscriptions

```
GET /school-subscriptions?status=active
Authorization: Bearer {admin_token}
```

#### Get All Parent Subscriptions

```
GET /parent-subscriptions?status=active
Authorization: Bearer {admin_token}
```

#### View Payment Records

```
GET /payments?limit=50&offset=0
Authorization: Bearer {admin_token}
```

### 5. Trip & Assignment Management

#### Get All Assignments

```
GET /driver-student-assignments
Authorization: Bearer {admin_token}
```

#### Get All Trips

```
GET /trips?school_id={school_id}&limit=50
Authorization: Bearer {admin_token}
```

### 6. Audit Logs

#### Get Audit Logs

```
GET /audit-logs?user_id={user_id}&action={action}&limit=50
Authorization: Bearer {admin_token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "log_123",
      "user_id": "admin_001",
      "action": "USER_DEACTIVATED",
      "resource_type": "user",
      "resource_id": "user_456",
      "timestamp": "2026-02-01T10:30:00Z",
      "details": {
        "reason": "Compliance issue"
      }
    }
  ]
}
```

### 7. System Notifications

#### Send System Notification

```
POST /notifications/admin/broadcast
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "Server maintenance scheduled...",
  "recipient_type": "all" | "parents" | "drivers" | "schools",
  "priority": "high"
}
```

---

## School App APIs

### Overview

School app allows:

- School profile management
- Student enrollment management
- Trip and transport assignment management
- School subscription and billing
- Driver assignment to routes
- Notifications to parents/drivers
- Attendance and trip tracking

### Base URL Prefixes

```
/school-admin for school admin operations
/schools for school profile
```

### 1. School Profile & Admin Management

#### Get School Profile

```
GET /schools/{school_id}
Authorization: Bearer {school_admin_token}
```

#### Update School Profile

```
PUT /schools/admin/{school_id}
Authorization: Bearer {school_admin_token}
Content-Type: application/json

{
  "name": "St. Mary's School",
  "phone_number": "+91-2222222222",
  "principal_name": "Dr. Sharma",
  "email": "admin@stmarys.com"
}
```

### 2. Student Management

#### Get All School Students

```
GET /students?school_id={school_id}
Authorization: Bearer {school_admin_token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "student_456",
      "first_name": "Alice",
      "last_name": "Doe",
      "grade": "5B",
      "roll_number": "45",
      "parent_id": "parent_123",
      "status": "active"
    }
  ]
}
```

#### Get Student Details

```
GET /students/{student_id}
Authorization: Bearer {school_admin_token}
```

#### Create/Enroll Student

```
POST /school-admin/students
Authorization: Bearer {school_admin_token}
Content-Type: application/json

{
  "first_name": "Alice",
  "last_name": "Doe",
  "date_of_birth": "2015-05-15",
  "grade": "5B",
  "roll_number": "45",
  "parent_id": "parent_123",
  "school_id": "school_789"
}
```

#### Update Student Information

```
PUT /school-admin/students/{student_id}
Authorization: Bearer {school_admin_token}
Content-Type: application/json

{
  "grade": "5B",
  "roll_number": "45"
}
```

### 3. Trip Management

#### Get All School Trips

```
GET /trips?school_id={school_id}
Authorization: Bearer {school_admin_token}
```

#### Create Trip/Route

```
POST /school-admin/trips
Authorization: Bearer {school_admin_token}
Content-Type: application/json

{
  "school_id": "school_789",
  "route_name": "North Route",
  "pickup_time": "08:00",
  "dropoff_time": "09:00",
  "stops": [
    {
      "location_name": "Stop 1",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "estimated_time": "08:10"
    }
  ]
}
```

#### Update Trip Details

```
PUT /trips/{trip_id}
Authorization: Bearer {school_admin_token}
Content-Type: application/json
```

### 4. Driver Assignment

#### Get All School Drivers

```
GET /school-driver?school_id={school_id}
Authorization: Bearer {school_admin_token}
```

#### Assign Driver to Route/Trip

```
POST /school-admin/driver-assignments
Authorization: Bearer {school_admin_token}
Content-Type: application/json

{
  "driver_id": "driver_789",
  "trip_id": "trip_001",
  "school_id": "school_789",
  "status": "active"
}
```

#### Assign Students to Trip

```
POST /school-assignments
Authorization: Bearer {school_admin_token}
Content-Type: application/json

{
  "trip_id": "trip_001",
  "student_ids": ["student_456", "student_457"],
  "school_id": "school_789"
}
```

### 5. School Subscription & Billing

#### Get School Subscription

```
GET /school-subscriptions/{school_id}
Authorization: Bearer {school_admin_token}
```

#### Upgrade/Modify Subscription

```
PATCH /school-subscriptions/{subscription_id}
Authorization: Bearer {school_admin_token}
Content-Type: application/json

{
  "plan_id": "plan_premium",
  "billing_cycle": "monthly" | "quarterly" | "yearly"
}
```

#### View Payment History

```
GET /payments?school_id={school_id}&limit=50
Authorization: Bearer {school_admin_token}
```

### 6. Attendance & Tracking

#### Get Trip Attendance

```
GET /trip-students?trip_id={trip_id}
Authorization: Bearer {school_admin_token}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "trip_student_123",
      "student_id": "student_456",
      "student_name": "Alice Doe",
      "status": "present",
      "check_in_time": "2026-02-01T08:15:00Z",
      "check_out_time": "2026-02-01T09:00:00Z"
    }
  ]
}
```

#### Get Live Trip Tracking

```
GET /tracking/live?trip_id={trip_id}
Authorization: Bearer {school_admin_token}
```

### 7. Notifications

#### Send Notification to Parents

```
POST /notifications/school
Authorization: Bearer {school_admin_token}
Content-Type: application/json

{
  "title": "Trip Delay",
  "message": "Trip 001 is delayed by 15 minutes",
  "recipient_ids": ["parent_123", "parent_124"],
  "trip_id": "trip_001"
}
```

---

## Shared/Common APIs

### These APIs are available to all authenticated users:

#### Get Current Roles

```
GET /auth/roles
```

#### Get All Schools (Read-only)

```
GET /schools
Authorization: Bearer {token}
```

#### Get Notifications

```
GET /notifications?user_id={user_id}&user_type={user_type}
Authorization: Bearer {token}
```

#### Get Ratings & Reviews

```
GET /ratings-reviews?driver_id={driver_id}
Authorization: Bearer {token}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {
      "field": "token",
      "reason": "Token expired"
    }
  }
}
```

### Common Error Codes

| Code                    | Meaning                      | HTTP Status |
| ----------------------- | ---------------------------- | ----------- |
| `INVALID_CREDENTIALS`   | Wrong phone/OTP              | 401         |
| `UNAUTHORIZED`          | Missing/expired token        | 401         |
| `FORBIDDEN`             | User doesn't have permission | 403         |
| `NOT_FOUND`             | Resource not found           | 404         |
| `VALIDATION_ERROR`      | Invalid input data           | 400         |
| `INTERNAL_SERVER_ERROR` | Server error                 | 500         |

---

## Best Practices

### 1. Authentication & Security

- ✅ Store token securely (encrypted local storage or secure storage)
- ✅ Always include `Authorization: Bearer {token}` header
- ✅ Refresh token before expiration
- ✅ Clear token on logout
- ✅ Validate token on app startup

### 2. Real-time Updates

- ✅ Use WebSocket for live tracking (location updates)
- ✅ Poll for notifications every 30 seconds if WebSocket unavailable
- ✅ Update location every 10-15 seconds during active trips (driver)

### 3. Data Synchronization

- ✅ Cache user profile locally with timestamp
- ✅ Sync with server on app resume
- ✅ Handle offline mode gracefully
- ✅ Queue requests while offline, sync when connection returns

### 4. Error Handling

- ✅ Always check `success` field in response
- ✅ Handle 401 Unauthorized → redirect to login
- ✅ Handle 403 Forbidden → show permission error
- ✅ Implement retry logic for network errors (max 3 retries)
- ✅ Log errors for debugging

### 5. Performance

- ✅ Use pagination for list endpoints (limit/offset)
- ✅ Cache images from S3 URLs locally
- ✅ Batch requests when possible
- ✅ Don't call endpoints too frequently (implement debounce)

### 6. API Consumption Pattern

```
1. App Start
   └─ GET /auth/verify-token  → Check if logged in
      ├─ If Valid → Show home screen
      └─ If Invalid → Show login screen

2. Login Flow
   ├─ POST /auth/login/send-otp
   ├─ (User enters OTP)
   └─ POST /auth/login/verify-otp → Get token

3. Home Screen (Parent App Example)
   ├─ GET /parent/profile
   ├─ GET /students?parent_id={parent_id}
   └─ GET /notifications?user_id={parent_id}

4. Trip Tracking
   └─ GET /tracking/live?student_id={student_id}  (Every 5 seconds)

5. Background Task (Driver App)
   └─ POST /tracking/update-location  (Every 10 seconds during trip)

6. Logout
   └─ POST /auth/logout
```

### 7. Rate Limiting

- Location updates: Max once per 5 seconds per driver
- Notifications: Check max every 30 seconds
- Profile updates: Max 1 request per 2 seconds

---

## Testing with Postman

1. **Import Postman Collection**
   - Files available: `docs/api/postman/collections/PP_API_3_0_0.postman_collection.json`
   - Import in Postman → Collections → Import

2. **Setup Environment**
   - Import: `docs/api/postman/environments/PP_API_3_0_0.postman_environment.json`
   - Set variables: `PARENT_TOKEN`, `DRIVER_TOKEN`, `ADMIN_TOKEN`, `SCHOOL_TOKEN`

3. **Test Sequence**
   - Start with `/auth/register/send-otp`
   - Then `/auth/register/verify-otp`
   - Then use returned token for subsequent requests

---

## WebSocket Events (Real-time Tracking)

### Driver Location Updates

```javascript
// Emit from Driver App
socket.emit("driver:location", {
  driver_id: "driver_789",
  trip_id: "trip_001",
  latitude: 19.076,
  longitude: 72.8777,
  speed: 25,
});

// Listen in Parent/School App
socket.on("driver:location-update", (data) => {
  // Update map with new location
});
```

---

**For more details, see:**

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Changelog](./api/CHANGELOG.md)
- [Testing Guide](./api/SCHOOL_TRANSPORT_TESTING_GUIDE.md)
- [WebSocket Integration](./websocket/WEBSOCKET.md)
