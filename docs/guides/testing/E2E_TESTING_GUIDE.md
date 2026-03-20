# End-to-End Testing Guide

**Version:** 1.0.0  
**Last Updated:** 2026-02-08  
**Purpose:** Complete step-by-step API testing before frontend integration

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Screen-to-API Mapping](#user-roles--screen-to-api-mapping)
   - [Driver App APIs](#-driver-app)
   - [Parent App APIs](#-parent-app)
   - [Admin Panel APIs](#️-admin-panel-web)
   - [School Admin Panel APIs](#-school-admin-panel-web)
   - [Quick Cheatsheet](#quick-screen-to-api-cheatsheet)
3. [API Access by Role (Token Reference)](#api-access-by-role)
4. [Environment Setup](#environment-setup)
5. [Phase 1: Admin Setup](#phase-1-admin-setup)
6. [Phase 2: School Management](#phase-2-school-management)
7. [Phase 3: Subscription Plans](#phase-3-subscription-plans)
8. [Phase 4: Parent Registration](#phase-4-parent-registration)
9. [Phase 5: Driver Registration](#phase-5-driver-registration)
10. [Phase 6: Student Management](#phase-6-student-management)
11. [Phase 7: Driver-Student Assignments](#phase-7-driver-student-assignments)
12. [Phase 8: Trip Management](#phase-8-trip-management)
13. [Phase 9: QR/OTP Verification](#phase-9-qrotp-verification)
14. [Phase 10: Tracking](#phase-10-tracking)
15. [Phase 11: Payments & Subscriptions](#phase-11-payments--subscriptions)
16. [Phase 12: Reviews & Ratings](#phase-12-reviews--ratings)
17. [Phase 13: Notifications](#phase-13-notifications)
18. [Complete Flow Summary](#complete-flow-summary)

---

## Overview

This guide provides **endpoint, payload, response, and error** documentation to test the complete Skolo API flow from scratch. Follow each phase in order for successful testing.

### Prerequisites

- Node.js and npm installed
- Backend server running on `http://localhost:3000`
- Database set up and migrations run
- `.env` configured with required variables

### Base URL

```
http://localhost:3000/api
```

### Authentication Headers

```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

### Test Data Variables (Save these as you proceed)

| Variable             | Description                       |
| -------------------- | --------------------------------- |
| `ADMIN_TOKEN`        | Token from admin login            |
| `PARENT_TOKEN`       | Token from parent login           |
| `DRIVER_TOKEN`       | Token from driver login           |
| `SCHOOL_ADMIN_TOKEN` | Token from school admin login     |
| `ADMIN_ID`           | Admin UUID                        |
| `PARENT_ID`          | Parent UUID                       |
| `DRIVER_ID`          | Driver UUID                       |
| `DRIVER_UNIQUE_ID`   | Driver's unique ID (e.g., DRV123) |
| `SCHOOL_ID`          | School UUID                       |
| `SCHOOL_ADMIN_ID`    | School Admin UUID                 |
| `STUDENT_ID`         | Student UUID                      |
| `ASSIGNMENT_ID`      | Assignment UUID                   |
| `TRIP_ID`            | Trip UUID                         |
| `PLAN_ID`            | Subscription Plan UUID            |
| `SUBSCRIPTION_ID`    | Subscription UUID                 |
| `ADDRESS_ID`         | Address UUID                      |
| `REVIEW_ID`          | Review UUID                       |
| `QR_OTP_ID`          | QR/OTP UUID                       |

---

## User Roles & Screen-to-API Mapping

This section maps **each app screen/feature to the exact APIs** you need to call for frontend integration.

---

### 📱 DRIVER APP

#### 🔐 Authentication Screens

| Screen       | Action            | API Endpoint                | Method |
| ------------ | ----------------- | --------------------------- | ------ |
| **Login**    | Send OTP          | `/auth/login/send-otp`      | POST   |
| **Login**    | Verify OTP        | `/auth/login/verify-otp`    | POST   |
| **Register** | Send OTP          | `/auth/register/send-otp`   | POST   |
| **Register** | Verify & Complete | `/auth/register/verify-otp` | POST   |
| **Splash**   | Check Token       | `/auth/verify-token`        | GET    |
| **Logout**   | Logout            | `/auth/logout`              | POST   |

**Login Request:**

```json
POST /auth/login/send-otp
{ "phone_number": "+1234567893" }

POST /auth/login/verify-otp
{ "phone_number": "+1234567893", "otp": "123456" }
```

**Register Request:**

```json
POST /auth/register/send-otp
{ "phone_number": "+1234567893", "user_type": "driver" }

POST /auth/register/verify-otp
{
  "phone_number": "+1234567893",
  "otp": "123456",
  "user_type": "driver",
  "name": "Jane Smith",
  "email": "jane@driver.com"
}
```

---

#### 👤 Profile & Settings

| Screen           | Action             | API Endpoint            | Method |
| ---------------- | ------------------ | ----------------------- | ------ |
| **Profile**      | Get Profile        | `/driver/profile`       | GET    |
| **Edit Profile** | Update Profile     | `/driver/profile`       | PUT    |
| **Address**      | Add Address        | `/driver/address`       | POST   |
| **Address**      | Get Addresses      | `/driver/addresses`     | GET    |
| **Address**      | Update Address     | `/driver/address/:id`   | PUT    |
| **Documents**    | Upload Documents   | `/driver/documents`     | POST   |
| **Documents**    | Get Documents      | `/driver/documents`     | GET    |
| **Documents**    | Update Documents   | `/driver/documents/:id` | PUT    |
| **Availability** | Set Online/Offline | `/driver/availability`  | PATCH  |

**Update Profile:**

```json
PUT /driver/profile
{
  "name": "Jane Smith",
  "email": "jane@driver.com",
  "vehicle_type": "van",
  "vehicle_number": "NY-ABC-1234",
  "vehicle_capacity": 10
}
```

**Add Address:**

```json
POST /driver/address
{
  "address_line1": "111 Driver Lane",
  "city": "New York",
  "state": "NY",
  "pincode": "10002",
  "latitude": 40.7200,
  "longitude": -74.0100,
  "is_primary": true
}
```

---

#### 📋 Assignment Management

| Screen                | Action               | API Endpoint                                          | Method |
| --------------------- | -------------------- | ----------------------------------------------------- | ------ |
| **Requests**          | Get Pending Requests | `/driver-student-assignments/driver/pending`          | GET    |
| **Requests**          | Get Parent Requests  | `/driver-student-assignments/driver/parent-requested` | GET    |
| **My Students**       | Get My Assignments   | `/driver-student-assignments/driver/my-assignments`   | GET    |
| **Assignment Detail** | View Details         | `/driver-student-assignments/:id`                     | GET    |
| **Approve**           | Accept Request       | `/driver-student-assignments/:id/approve`             | POST   |
| **Reject**            | Decline Request      | `/driver-student-assignments/:id/reject`              | POST   |

---

#### 🚐 Trip Management

| Screen             | Action               | API Endpoint                                  | Method |
| ------------------ | -------------------- | --------------------------------------------- | ------ |
| **Home/Dashboard** | Get Today's Trips    | `/trips/driver/my-trips?trip_date=2026-02-10` | GET    |
| **Create Trip**    | Create New Trip      | `/trips`                                      | POST   |
| **Trip Detail**    | Get Trip Info        | `/trips/:tripId`                              | GET    |
| **Trip Detail**    | Get Students in Trip | `/trip-students/trip/:tripId`                 | GET    |
| **Start Trip**     | Start                | `/trips/:tripId/status`                       | PATCH  |
| **During Trip**    | Update Status        | `/trips/:tripId/status`                       | PATCH  |
| **Complete Trip**  | End Trip             | `/trips/:tripId/status`                       | PATCH  |
| **Cancel Trip**    | Cancel               | `/trips/:tripId`                              | DELETE |

**Create Trip:**

```json
POST /trips
{
  "school_id": "uuid-school-id",
  "trip_type": "pickup",
  "trip_date": "2026-02-10"
}
```

**Update Status:**

```json
PATCH /trips/:tripId/status
{ "trip_status": "started" }  // or "in_progress", "completed", "cancelled"
```

---

#### ✅ Pickup/Drop & Attendance

| Screen         | Action             | API Endpoint                                     | Method |
| -------------- | ------------------ | ------------------------------------------------ | ------ |
| **At Stop**    | Verify Parent OTP  | `/daily-qr-otp/verify`                           | POST   |
| **At Stop**    | Bulk Pickup/Drop   | `/trip-students/trip/:tripId/bulk-stop-action`   | POST   |
| **At School**  | Bulk School Action | `/trip-students/trip/:tripId/bulk-school-action` | POST   |
| **Individual** | Mark Attendance    | `/trip-students/:id/attendance`                  | PATCH  |
| **Individual** | Record Pickup      | `/trip-students/:id/pickup`                      | PUT    |
| **Individual** | Record Drop        | `/trip-students/:id/drop`                        | PUT    |
| **Get OTP**    | Get Student OTP    | `/daily-qr-otp/student/:studentId/trip/:tripId`  | GET    |

**Verify OTP:**

```json
POST /daily-qr-otp/verify
{
  "trip_id": "uuid-trip-id",
  "otp_code": "123456"
}
```

**Bulk Stop Action (at home):**

```json
POST /trip-students/trip/:tripId/bulk-stop-action
{
  "student_ids": ["student-1", "student-2"],
  "absent_student_ids": [],
  "otp_code": "123456",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Bulk School Action (at school):**

```json
POST /trip-students/trip/:tripId/bulk-school-action
{
  "student_ids": ["student-1", "student-2"],
  "latitude": 40.7589,
  "longitude": -73.9851
}
```

---

#### 📍 Navigation & Tracking

| Screen             | Action             | API Endpoint                       | Method |
| ------------------ | ------------------ | ---------------------------------- | ------ |
| **Route Planning** | Calculate Route    | `/tracking/calculate-route`        | POST   |
| **Route Planning** | TomTom Matrix      | `/tracking/calculate-route-matrix` | POST   |
| **During Trip**    | Update My Position | `/tracking/update-position`        | POST   |
| **Reroute**        | Recalculate Route  | `/tracking/recalculate-route`      | POST   |
| **Route View**     | Get Route Details  | `/tracking/trip/:tripId/route`     | GET    |

**Update Position (call every 10-30 seconds):**

```json
POST /tracking/update-position
{
  "trip_id": "uuid-trip-id",
  "latitude": 40.7150,
  "longitude": -74.0050,
  "speed": 35.5,
  "heading": 45.0,
  "accuracy": 10.0
}
```

---

#### 🔔 Notifications

| Screen            | Action     | API Endpoint                  | Method |
| ----------------- | ---------- | ----------------------------- | ------ |
| **Notifications** | Get All    | `/notifications`              | GET    |
| **Notifications** | Get Unread | `/notifications/unread`       | GET    |
| **Badge Count**   | Get Count  | `/notifications/unread/count` | GET    |
| **Mark Read**     | Single     | `/notifications/:id/read`     | PATCH  |
| **Mark All Read** | All        | `/notifications/read-all`     | PATCH  |

---

### 📱 PARENT APP

#### 🔐 Authentication Screens

| Screen       | Action            | API Endpoint                | Method |
| ------------ | ----------------- | --------------------------- | ------ |
| **Login**    | Send OTP          | `/auth/login/send-otp`      | POST   |
| **Login**    | Verify OTP        | `/auth/login/verify-otp`    | POST   |
| **Register** | Send OTP          | `/auth/register/send-otp`   | POST   |
| **Register** | Verify & Complete | `/auth/register/verify-otp` | POST   |
| **Splash**   | Check Token       | `/auth/verify-token`        | GET    |
| **Logout**   | Logout            | `/auth/logout`              | POST   |

**Register Request:**

```json
POST /auth/register/send-otp
{ "phone_number": "+1234567890", "user_type": "parent" }

POST /auth/register/verify-otp
{
  "phone_number": "+1234567890",
  "otp": "123456",
  "user_type": "parent",
  "name": "John Doe",
  "email": "john@parent.com"
}
```

---

#### 👤 Profile & Address

| Screen           | Action         | API Endpoint          | Method |
| ---------------- | -------------- | --------------------- | ------ |
| **Profile**      | Get Profile    | `/parent/profile`     | GET    |
| **Edit Profile** | Update Profile | `/parent/profile`     | PUT    |
| **Address**      | Add Address    | `/parent/address`     | POST   |
| **Address**      | Get Addresses  | `/parent/addresses`   | GET    |
| **Address**      | Update Address | `/parent/address/:id` | PUT    |
| **Address**      | Delete Address | `/parent/address/:id` | DELETE |

---

#### 👧 Student Management

| Screen              | Action           | API Endpoint           | Method |
| ------------------- | ---------------- | ---------------------- | ------ |
| **My Kids**         | Get All Students | `/students`            | GET    |
| **Add Student**     | Add New          | `/students`            | POST   |
| **Student Profile** | Get Details      | `/students/:studentId` | GET    |
| **Edit Student**    | Update           | `/students/:studentId` | PUT    |
| **Delete Student**  | Remove           | `/students/:studentId` | DELETE |
| **Schools List**    | Browse Schools   | `/schools`             | GET    |
| **School Detail**   | View School      | `/schools/:schoolId`   | GET    |

**Add Student:**

```json
POST /students
{
  "school_id": "uuid-school-id",
  "student_name": "Emily Johnson",
  "class": "5th Grade",
  "section": "A",
  "roll_number": "STU001",
  "date_of_birth": "2016-03-15",
  "gender": "female",
  "pickup_address_id": "uuid-address-id",
  "emergency_contact": "+1987654320"
}
```

---

#### 🚐 Driver & Assignment

| Screen                  | Action            | API Endpoint                                                  | Method |
| ----------------------- | ----------------- | ------------------------------------------------------------- | ------ |
| **Find Driver**         | Search by ID      | `/driver-student-assignments/drivers?driver_unique_id=DRV123` | GET    |
| **Request Driver**      | Create Assignment | `/driver-student-assignments`                                 | POST   |
| **My Drivers**          | Get Assignments   | `/driver-student-assignments/parent/my-assignments`           | GET    |
| **Assignment Detail**   | View Details      | `/driver-student-assignments/:id`                             | GET    |
| **Student Assignments** | By Student        | `/driver-student-assignments/student/:studentId`              | GET    |
| **Cancel Assignment**   | Deactivate        | `/driver-student-assignments/:id/deactivate`                  | PATCH  |
| **Driver Reviews**      | View Reviews      | `/reviews/driver/:driverId`                                   | GET    |
| **Driver Rating**       | View Rating       | `/reviews/driver/:driverId/rating`                            | GET    |

**Request Driver:**

```json
POST /driver-student-assignments
{
  "driver_id": "uuid-driver-id",
  "student_id": "uuid-student-id",
  "driver_unique_id": "DRV123",
  "monthly_fee": 2500.00,
  "assignment_source": "parent"
}
```

---

#### 📍 Live Tracking

| Screen           | Action              | API Endpoint                     | Method |
| ---------------- | ------------------- | -------------------------------- | ------ |
| **Track Driver** | Get Latest Position | `/tracking/trip/:tripId/latest`  | GET    |
| **Track Driver** | Get Route           | `/tracking/trip/:tripId/route`   | GET    |
| **History**      | Get Track History   | `/tracking/trip/:tripId/history` | GET    |

---

#### 🔑 QR/OTP for Pickup

| Screen           | Action          | API Endpoint                                  | Method |
| ---------------- | --------------- | --------------------------------------------- | ------ |
| **Generate OTP** | For Trip        | `/daily-qr-otp/generate`                      | POST   |
| **View OTP**     | Get My OTP      | `/daily-qr-otp/parent/:parentId/trip/:tripId` | GET    |
| **All OTPs**     | Get Parent OTPs | `/daily-qr-otp/parent/:parentId`              | GET    |

**Generate OTP:**

```json
POST /daily-qr-otp/generate
{
  "trip_id": "uuid-trip-id",
  "trip_type": "pickup"
}
```

---

#### 💳 Subscription & Payments

| Screen              | Action              | API Endpoint                       | Method |
| ------------------- | ------------------- | ---------------------------------- | ------ |
| **Plans**           | View Plans          | `/subscription-plans`              | GET    |
| **Plan Detail**     | Plan Info           | `/subscription-plans/:planId`      | GET    |
| **Subscribe**       | Create Subscription | `/parent-subscriptions`            | POST   |
| **My Subscription** | Get Active          | `/parent-subscriptions/active`     | GET    |
| **History**         | All Subscriptions   | `/parent-subscriptions`            | GET    |
| **Cancel**          | Cancel Sub          | `/parent-subscriptions/:id/cancel` | POST   |
| **Redeem Code**     | Use School Code     | `/redemptions/redeem`              | POST   |
| **Payment**         | Create Order        | `/razorpay/create-order`           | POST   |
| **Payment**         | Verify Payment      | `/razorpay/verify-payment`         | POST   |
| **Payment History** | Get Payments        | `/payments/history`                | GET    |

**Subscribe:**

```json
POST /parent-subscriptions
{
  "plan_id": "uuid-plan-id",
  "start_date": "2026-02-10",
  "end_date": "2026-03-10",
  "auto_renew": true
}
```

**Create Razorpay Order:**

```json
POST /razorpay/create-order
{
  "amount": 9999,
  "currency": "INR",
  "plan_id": "uuid-plan-id"
}
```

---

#### ⭐ Reviews

| Screen            | Action  | API Endpoint          | Method |
| ----------------- | ------- | --------------------- | ------ |
| **Write Review**  | Submit  | `/reviews`            | POST   |
| **My Reviews**    | Get All | `/reviews/my-reviews` | GET    |
| **Edit Review**   | Update  | `/reviews/:reviewId`  | PUT    |
| **Delete Review** | Remove  | `/reviews/:reviewId`  | DELETE |

**Submit Review:**

```json
POST /reviews
{
  "driver_id": "uuid-driver-id",
  "trip_id": "uuid-trip-id",
  "rating": 5,
  "review_text": "Excellent service!"
}
```

---

#### 🔔 Notifications

| Screen            | Action     | API Endpoint                  | Method |
| ----------------- | ---------- | ----------------------------- | ------ |
| **Notifications** | Get All    | `/notifications`              | GET    |
| **Notifications** | Get Unread | `/notifications/unread`       | GET    |
| **Badge Count**   | Get Count  | `/notifications/unread/count` | GET    |
| **Mark Read**     | Single     | `/notifications/:id/read`     | PATCH  |
| **Mark All Read** | All        | `/notifications/read-all`     | PATCH  |

---

### 🖥️ ADMIN PANEL (Web)

#### 🔐 Authentication

| Screen          | Action             | API Endpoint                     | Method |
| --------------- | ------------------ | -------------------------------- | ------ |
| **Login**       | Admin Login        | `/admin/login`                   | POST   |
| **First Setup** | Create Super Admin | `/admin/setup/create-superadmin` | POST   |
| **Verify**      | Check Token        | `/admin/verify-admin-token`      | GET    |

**Admin Login:**

```json
POST /admin/login
{
  "email": "admin@pingparent.com",
  "password": "Admin@123456"
}
```

---

#### 👥 User Management

| Screen          | Action       | API Endpoint                      | Method |
| --------------- | ------------ | --------------------------------- | ------ |
| **All Users**   | List Users   | `/admin/users`                    | GET    |
| **User Detail** | Get User     | `/admin/users/:userId`            | GET    |
| **Edit User**   | Update       | `/admin/users/:userId`            | PUT    |
| **Activate**    | Enable User  | `/admin/users/:userId/activate`   | PATCH  |
| **Deactivate**  | Disable User | `/admin/users/:userId/deactivate` | PATCH  |
| **Delete**      | Remove User  | `/admin/users/:userId`            | DELETE |

---

#### 👨‍💼 Admin Management

| Screen           | Action      | API Endpoint                        | Method |
| ---------------- | ----------- | ----------------------------------- | ------ |
| **All Admins**   | List Admins | `/admin/admins`                     | GET    |
| **Admin Detail** | Get Admin   | `/admin/admins/:adminId`            | GET    |
| **Edit Admin**   | Update      | `/admin/admins/:adminId`            | PUT    |
| **Activate**     | Enable      | `/admin/admins/:adminId/activate`   | PATCH  |
| **Deactivate**   | Disable     | `/admin/admins/:adminId/deactivate` | PATCH  |

---

#### 🚗 Driver Management

| Screen             | Action           | API Endpoint                               | Method |
| ------------------ | ---------------- | ------------------------------------------ | ------ |
| **All Drivers**    | List (via users) | `/admin/users?user_type=driver`            | GET    |
| **Driver Detail**  | Full Details     | `/admin/drivers/:driverId`                 | GET    |
| **Approve/Reject** | Change Status    | `/admin/drivers/:driverId/approval-status` | PUT    |

**Approve Driver:**

```json
PUT /admin/drivers/:driverId/approval-status
{ "approval_status": "approved" }
```

**Reject Driver:**

```json
PUT /admin/drivers/:driverId/approval-status
{
  "approval_status": "rejected",
  "rejection_reason": "Invalid documents"
}
```

---

#### 👨‍👩‍👧 Parent Management

| Screen            | Action           | API Endpoint                    | Method |
| ----------------- | ---------------- | ------------------------------- | ------ |
| **All Parents**   | List (via users) | `/admin/users?user_type=parent` | GET    |
| **Parent Detail** | Full Details     | `/admin/parents/:parentId`      | GET    |

---

#### 🏫 School Management

| Screen            | Action       | API Endpoint               | Method |
| ----------------- | ------------ | -------------------------- | ------ |
| **All Schools**   | List Schools | `/schools`                 | GET    |
| **Add School**    | Create       | `/schools/admin`           | POST   |
| **School Detail** | View         | `/schools/:schoolId`       | GET    |
| **Edit School**   | Update       | `/schools/admin/:schoolId` | PUT    |
| **Delete School** | Remove       | `/schools/admin/:schoolId` | DELETE |

**Create School:**

```json
POST /schools/admin
{
  "school_name": "Springfield Elementary",
  "address": "100 School Street",
  "city": "New York",
  "state": "NY",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "contact_number": "+1234567896",
  "email": "info@springfield.edu"
}
```

---

#### 📋 Subscription Plans

| Screen          | Action     | API Endpoint                             | Method |
| --------------- | ---------- | ---------------------------------------- | ------ |
| **All Plans**   | List Plans | `/subscription-plans`                    | GET    |
| **Add Plan**    | Create     | `/subscription-plans`                    | POST   |
| **Plan Detail** | View       | `/subscription-plans/:planId`            | GET    |
| **Edit Plan**   | Update     | `/subscription-plans/:planId`            | PUT    |
| **Activate**    | Enable     | `/subscription-plans/:planId/activate`   | PATCH  |
| **Deactivate**  | Disable    | `/subscription-plans/:planId/deactivate` | PATCH  |

**Create Plan:**

```json
POST /subscription-plans
{
  "plan_name": "Monthly Basic",
  "plan_type": "monthly",
  "price": 99.99,
  "features": {
    "tracking": true,
    "qr_attendance": true,
    "max_students": 1
  },
  "is_active": true
}
```

---

#### 🔐 Role Management

| Screen          | Action     | API Endpoint           | Method |
| --------------- | ---------- | ---------------------- | ------ |
| **All Roles**   | List Roles | `/admin/roles`         | GET    |
| **Add Role**    | Create     | `/admin/roles`         | POST   |
| **Edit Role**   | Update     | `/admin/roles/:roleId` | PUT    |
| **Delete Role** | Remove     | `/admin/roles/:roleId` | DELETE |

---

#### 📊 Audit Logs

| Screen         | Action   | API Endpoint               | Method |
| -------------- | -------- | -------------------------- | ------ |
| **Audit Logs** | List All | `/admin/audit-logs`        | GET    |
| **Log Detail** | View Log | `/admin/audit-logs/:logId` | GET    |

---

#### 🧹 Maintenance

| Screen      | Action              | API Endpoint        | Method |
| ----------- | ------------------- | ------------------- | ------ |
| **Cleanup** | Clean Tracking Data | `/tracking/cleanup` | POST   |

---

### 🏫 SCHOOL ADMIN PANEL (Web)

#### 🔐 Authentication

| Screen       | Action  | API Endpoint             | Method |
| ------------ | ------- | ------------------------ | ------ |
| **Register** | Sign Up | `/school-admin/register` | POST   |
| **Login**    | Sign In | `/school-admin/login`    | POST   |

**Register:**

```json
POST /school-admin/register
{
  "school_id": "uuid-school-id",
  "name": "John Principal",
  "email": "principal@school.edu",
  "phone_number": "+1234567800",
  "password": "SchoolAdmin@123"
}
```

**Login:**

```json
POST /school-admin/login
{
  "email": "principal@school.edu",
  "password": "SchoolAdmin@123"
}
```

---

#### 👤 Profile

| Screen               | Action          | API Endpoint                        | Method |
| -------------------- | --------------- | ----------------------------------- | ------ |
| **My Profile**       | Get Profile     | `/school-admin/me`                  | GET    |
| **Edit Profile**     | Update          | `/school-admin/update`              | PATCH  |
| **Change Password**  | Update Password | `/school-admin/change-password`     | POST   |
| **School Admins**    | List All        | `/school-admin/:schoolId`           | GET    |
| **Deactivate Admin** | Disable         | `/school-admin/:adminId/deactivate` | POST   |

---

#### 🚗 School Drivers

| Screen            | Action           | API Endpoint                       | Method |
| ----------------- | ---------------- | ---------------------------------- | ------ |
| **All Drivers**   | List Drivers     | `/school-driver/:schoolId`         | GET    |
| **Driver Detail** | View Driver      | `/school-driver/:driverId/details` | GET    |
| **Add Driver**    | Assign to School | `/school-driver/assign`            | POST   |
| **Remove Driver** | Unassign         | `/school-driver/:driverId/remove`  | POST   |

---

#### 📋 Student Assignments

| Screen              | Action         | API Endpoint                                     | Method |
| ------------------- | -------------- | ------------------------------------------------ | ------ |
| **All Assignments** | List           | `/school-assignments/:schoolId`                  | GET    |
| **Pending**         | Pending List   | `/school-assignments/:schoolId/pending`          | GET    |
| **By Driver**       | Driver List    | `/school-assignments/:schoolId/driver/:driverId` | GET    |
| **Create**          | New Assignment | `/school-assignments/:schoolId/create`           | POST   |
| **Approve**         | Accept         | `/school-assignments/:id/approve`                | POST   |
| **Reject**          | Decline        | `/school-assignments/:id/reject`                 | POST   |

---

#### 💳 School Subscriptions

| Screen                | Action           | API Endpoint                                    | Method |
| --------------------- | ---------------- | ----------------------------------------------- | ------ |
| **Create**            | New Subscription | `/school-subscriptions`                         | POST   |
| **All Subscriptions** | List             | `/school-subscriptions/school/:schoolId`        | GET    |
| **Active**            | Current Sub      | `/school-subscriptions/school/:schoolId/active` | GET    |
| **Detail**            | View             | `/school-subscriptions/:id`                     | GET    |
| **Edit**              | Update           | `/school-subscriptions/:id`                     | PATCH  |
| **Renew**             | Extend           | `/school-subscriptions/:id/renew`               | POST   |
| **Cancel**            | End              | `/school-subscriptions/:id/cancel`              | POST   |
| **Expired**           | Past Subs        | `/school-subscriptions/expired/list`            | GET    |
| **Generate Codes**    | Student Codes    | `/school-subscriptions/:id/generate-codes`      | POST   |
| **List Codes**        | View Codes       | `/school-subscriptions/:id/codes`               | GET    |

**Create School Subscription:**

```json
POST /school-subscriptions
{
  "school_id": "uuid-school-id",
  "plan_id": "uuid-plan-id",
  "start_date": "2026-02-01",
  "end_date": "2026-08-01",
  "auto_renew": false,
  "max_drivers": 10,
  "max_students": 50,
  "billing_contact": "billing@school.edu"
}
```

**Generate Student Codes:**

```json
POST /school-subscriptions/:subscriptionId/generate-codes
{
  "student_ids": ["uuid-student-1", "uuid-student-2"]
}
```

---

## Quick Screen-to-API Cheatsheet

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DRIVER APP                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Login/Register    → /auth/login/send-otp, /auth/login/verify-otp      │
│  My Profile        → GET /driver/profile                                │
│  My Students       → GET /driver-student-assignments/driver/my-assignments │
│  Pending Requests  → GET /driver-student-assignments/driver/pending     │
│  Accept Request    → POST /driver-student-assignments/:id/approve       │
│  Today's Trips     → GET /trips/driver/my-trips?trip_date=YYYY-MM-DD   │
│  Create Trip       → POST /trips                                        │
│  Start Trip        → PATCH /trips/:id/status { "trip_status": "started" } │
│  Update Location   → POST /tracking/update-position                     │
│  Verify OTP        → POST /daily-qr-otp/verify                         │
│  Pickup Students   → POST /trip-students/trip/:id/bulk-stop-action     │
│  Drop at School    → POST /trip-students/trip/:id/bulk-school-action   │
│  Complete Trip     → PATCH /trips/:id/status { "trip_status": "completed" } │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PARENT APP                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Login/Register    → /auth/login/send-otp, /auth/login/verify-otp      │
│  My Profile        → GET /parent/profile                                │
│  My Kids           → GET /students                                      │
│  Add Kid           → POST /students                                     │
│  Find Driver       → GET /driver-student-assignments/drivers            │
│  Request Driver    → POST /driver-student-assignments                   │
│  My Assignments    → GET /driver-student-assignments/parent/my-assignments │
│  Track Driver      → GET /tracking/trip/:id/latest                     │
│  Get OTP           → POST /daily-qr-otp/generate                       │
│  View Plans        → GET /subscription-plans                            │
│  Subscribe         → POST /parent-subscriptions                         │
│  Pay               → POST /razorpay/create-order                       │
│  Submit Review     → POST /reviews                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN PANEL                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  Login             → POST /admin/login                                  │
│  All Users         → GET /admin/users                                   │
│  All Drivers       → GET /admin/users?user_type=driver                 │
│  Approve Driver    → PUT /admin/drivers/:id/approval-status            │
│  All Parents       → GET /admin/users?user_type=parent                 │
│  Parent Details    → GET /admin/parents/:id                            │
│  All Schools       → GET /schools                                       │
│  Create School     → POST /schools/admin                                │
│  All Plans         → GET /subscription-plans                            │
│  Create Plan       → POST /subscription-plans                           │
│  All Admins        → GET /admin/admins                                  │
│  Audit Logs        → GET /admin/audit-logs                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SCHOOL ADMIN PANEL                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Register          → POST /school-admin/register                        │
│  Login             → POST /school-admin/login                           │
│  My Profile        → GET /school-admin/me                               │
│  School Drivers    → GET /school-driver/:schoolId                       │
│  Add Driver        → POST /school-driver/assign                         │
│  Assignments       → GET /school-assignments/:schoolId                  │
│  Pending           → GET /school-assignments/:schoolId/pending          │
│  Approve           → POST /school-assignments/:id/approve               │
│  Subscriptions     → GET /school-subscriptions/school/:schoolId        │
│  Create Sub        → POST /school-subscriptions                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Access by Role

> **💡 For Frontend Integration:** Refer to the [User Roles & Screen-to-API Mapping](#user-roles--screen-to-api-mapping) section above for screen-by-screen API guides with request examples.

This section provides the **complete API access matrix** by role, useful for understanding permissions and building middleware.

The system has **5 user roles** defined in `src/shared/constants/enums.ts`:

```typescript
enum UserRole {
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
  SCHOOL_ADMIN = "school_admin",
  PARENT = "parent",
  DRIVER = "driver",
}
```

### Role Hierarchy & Token Usage

| Role             | Token Variable       | Login Endpoint                | Description                                  |
| ---------------- | -------------------- | ----------------------------- | -------------------------------------------- |
| **SUPERADMIN**   | `ADMIN_TOKEN`        | `POST /admin/login`           | Full system access, can create other admins  |
| **ADMIN**        | `ADMIN_TOKEN`        | `POST /admin/login`           | System management, limited admin creation    |
| **SCHOOL_ADMIN** | `SCHOOL_ADMIN_TOKEN` | `POST /school-admin/login`    | Manages single school, drivers, assignments  |
| **PARENT**       | `PARENT_TOKEN`       | `POST /auth/login/verify-otp` | Manages students, assignments, subscriptions |
| **DRIVER**       | `DRIVER_TOKEN`       | `POST /auth/login/verify-otp` | Manages trips, pickups/drops, tracking       |

### Quick Token Reference

When making API calls, use the appropriate token based on which user is logged in:

```bash
# For Admin/Superadmin APIs:
-H "Authorization: Bearer $ADMIN_TOKEN"

# For School Admin APIs:
-H "Authorization: Bearer $SCHOOL_ADMIN_TOKEN"

# For Parent APIs:
-H "Authorization: Bearer $PARENT_TOKEN"

# For Driver APIs:
-H "Authorization: Bearer $DRIVER_TOKEN"

# For Public APIs:
# No Authorization header needed
```

---

### 📋 Complete API Access Matrix by Role

#### 🔴 SUPERADMIN / ADMIN APIs (Use `ADMIN_TOKEN`)

| Category     | Endpoint                             | Method | Description                          |
| ------------ | ------------------------------------ | ------ | ------------------------------------ |
| **Auth**     | `/admin/setup/create-superadmin`     | POST   | Create initial super admin (no auth) |
| **Auth**     | `/admin/login`                       | POST   | Admin login                          |
| **Auth**     | `/admin/verify-admin-token`          | GET    | Verify admin token                   |
| **Users**    | `/admin/users`                       | GET    | Get all users                        |
| **Users**    | `/admin/users/:id`                   | GET    | Get user by ID                       |
| **Users**    | `/admin/users/:id`                   | PUT    | Update user                          |
| **Users**    | `/admin/users/:id/activate`          | PATCH  | Activate user                        |
| **Users**    | `/admin/users/:id/deactivate`        | PATCH  | Deactivate user                      |
| **Users**    | `/admin/users/:id`                   | DELETE | Delete user                          |
| **Admins**   | `/admin/admins`                      | GET    | Get all admins                       |
| **Admins**   | `/admin/admins/:id`                  | GET    | Get admin by ID                      |
| **Admins**   | `/admin/admins/:id`                  | PUT    | Update admin                         |
| **Admins**   | `/admin/admins/:id/activate`         | PATCH  | Activate admin                       |
| **Admins**   | `/admin/admins/:id/deactivate`       | PATCH  | Deactivate admin                     |
| **Drivers**  | `/admin/drivers/:id`                 | GET    | Get complete driver details          |
| **Drivers**  | `/admin/drivers/:id/approval-status` | PUT    | Approve/reject driver                |
| **Parents**  | `/admin/parents/:id`                 | GET    | Get complete parent details          |
| **Schools**  | `/schools/admin`                     | POST   | Create school                        |
| **Schools**  | `/schools/admin/:id`                 | PUT    | Update school                        |
| **Schools**  | `/schools/admin/:id`                 | DELETE | Delete school                        |
| **Plans**    | `/subscription-plans`                | POST   | Create subscription plan             |
| **Plans**    | `/subscription-plans/:id`            | PUT    | Update subscription plan             |
| **Plans**    | `/subscription-plans/:id/activate`   | PATCH  | Activate plan                        |
| **Plans**    | `/subscription-plans/:id/deactivate` | PATCH  | Deactivate plan                      |
| **Roles**    | `/admin/roles`                       | GET    | Get all roles                        |
| **Roles**    | `/admin/roles`                       | POST   | Create role                          |
| **Roles**    | `/admin/roles/:id`                   | PUT    | Update role                          |
| **Roles**    | `/admin/roles/:id`                   | DELETE | Delete role                          |
| **Audit**    | `/admin/audit-logs`                  | GET    | Get audit logs                       |
| **Audit**    | `/admin/audit-logs/:id`              | GET    | Get audit log by ID                  |
| **Tracking** | `/tracking/cleanup`                  | POST   | Clean old tracking data              |

---

#### 🟠 SCHOOL_ADMIN APIs (Use `SCHOOL_ADMIN_TOKEN`)

| Category          | Endpoint                                         | Method | Description                     |
| ----------------- | ------------------------------------------------ | ------ | ------------------------------- |
| **Auth**          | `/school-admin/register`                         | POST   | Register school admin (no auth) |
| **Auth**          | `/school-admin/login`                            | POST   | School admin login              |
| **Profile**       | `/school-admin/me`                               | GET    | Get current admin profile       |
| **Profile**       | `/school-admin/update`                           | PATCH  | Update admin profile            |
| **Profile**       | `/school-admin/change-password`                  | POST   | Change password                 |
| **Admins**        | `/school-admin/:schoolId`                        | GET    | Get all admins for school       |
| **Admins**        | `/school-admin/:adminId/deactivate`              | POST   | Deactivate admin                |
| **Drivers**       | `/school-driver/:schoolId`                       | GET    | Get school's drivers            |
| **Drivers**       | `/school-driver/:driverId/details`               | GET    | Get school driver details       |
| **Drivers**       | `/school-driver/assign`                          | POST   | Add driver to school            |
| **Drivers**       | `/school-driver/:driverId/remove`                | POST   | Remove driver from school       |
| **Assignments**   | `/school-assignments/:schoolId`                  | GET    | Get all school assignments      |
| **Assignments**   | `/school-assignments/:schoolId/pending`          | GET    | Get pending assignments         |
| **Assignments**   | `/school-assignments/:schoolId/driver/:driverId` | GET    | Get assignments by driver       |
| **Assignments**   | `/school-assignments/:schoolId/create`           | POST   | Create assignment               |
| **Assignments**   | `/school-assignments/:id/approve`                | POST   | Approve assignment              |
| **Assignments**   | `/school-assignments/:id/reject`                 | POST   | Reject assignment               |
| **Subscriptions** | `/school-subscriptions`                          | POST   | Create school subscription      |
| **Subscriptions** | `/school-subscriptions/school/:schoolId`         | GET    | Get school subscriptions        |
| **Subscriptions** | `/school-subscriptions/school/:schoolId/active`  | GET    | Get active subscription         |
| **Subscriptions** | `/school-subscriptions/:id`                      | GET    | Get subscription by ID          |
| **Subscriptions** | `/school-subscriptions/:id`                      | PATCH  | Update subscription             |
| **Subscriptions** | `/school-subscriptions/:id/renew`                | POST   | Renew subscription              |
| **Subscriptions** | `/school-subscriptions/:id/cancel`               | POST   | Cancel subscription             |
| **Subscriptions** | `/school-subscriptions/expired/list`             | GET    | Get expired subscriptions       |
| **Subscriptions** | `/school-subscriptions/:id/generate-codes`       | POST   | Generate per-student codes      |
| **Subscriptions** | `/school-subscriptions/:id/codes`                | GET    | Get student codes               |

---

#### 🟢 PARENT APIs (Use `PARENT_TOKEN`)

| Category          | Endpoint                                            | Method | Description                      |
| ----------------- | --------------------------------------------------- | ------ | -------------------------------- |
| **Auth**          | `/auth/register/send-otp`                           | POST   | Send registration OTP (no auth)  |
| **Auth**          | `/auth/register/verify-otp`                         | POST   | Verify OTP & register (no auth)  |
| **Auth**          | `/auth/login/send-otp`                              | POST   | Send login OTP (no auth)         |
| **Auth**          | `/auth/login/verify-otp`                            | POST   | Verify login OTP (no auth)       |
| **Auth**          | `/auth/verify-token`                                | GET    | Verify token                     |
| **Auth**          | `/auth/logout`                                      | POST   | Logout                           |
| **Profile**       | `/parent/profile`                                   | GET    | Get parent profile               |
| **Profile**       | `/parent/profile`                                   | PUT    | Update parent profile            |
| **Address**       | `/parent/address`                                   | POST   | Add address                      |
| **Address**       | `/parent/addresses`                                 | GET    | Get all addresses                |
| **Address**       | `/parent/address/:id`                               | PUT    | Update address                   |
| **Address**       | `/parent/address/:id`                               | DELETE | Delete address                   |
| **Students**      | `/students`                                         | GET    | Get my students                  |
| **Students**      | `/students`                                         | POST   | Add student                      |
| **Students**      | `/students/:id`                                     | GET    | Get student by ID                |
| **Students**      | `/students/:id`                                     | PUT    | Update student                   |
| **Students**      | `/students/:id`                                     | DELETE | Delete student                   |
| **Students**      | `/students/:id/activate`                            | PATCH  | Activate student                 |
| **Students**      | `/students/:id/deactivate`                          | PATCH  | Deactivate student               |
| **Assignments**   | `/driver-student-assignments`                       | POST   | Create assignment request        |
| **Assignments**   | `/driver-student-assignments/drivers`               | GET    | Search drivers                   |
| **Assignments**   | `/driver-student-assignments/parent/my-assignments` | GET    | Get my assignments               |
| **Assignments**   | `/driver-student-assignments/:id`                   | GET    | Get assignment details           |
| **Assignments**   | `/driver-student-assignments/:id`                   | PUT    | Update assignment                |
| **Assignments**   | `/driver-student-assignments/:id/deactivate`        | PATCH  | Deactivate assignment            |
| **Assignments**   | `/driver-student-assignments/student/:studentId`    | GET    | Get assignments by student       |
| **QR/OTP**        | `/daily-qr-otp/generate`                            | POST   | Generate QR/OTP for trip         |
| **QR/OTP**        | `/daily-qr-otp/parent/:parentId/trip/:tripId`       | GET    | Get OTP for trip                 |
| **QR/OTP**        | `/daily-qr-otp/parent/:parentId`                    | GET    | Get all parent OTPs              |
| **Tracking**      | `/tracking/trip/:tripId/latest`                     | GET    | Get driver's latest position     |
| **Tracking**      | `/tracking/trip/:tripId/history`                    | GET    | Get tracking history             |
| **Tracking**      | `/tracking/trip/:tripId/route`                      | GET    | Get route details                |
| **Subscriptions** | `/parent-subscriptions`                             | GET    | Get my subscriptions             |
| **Subscriptions** | `/parent-subscriptions`                             | POST   | Subscribe to plan                |
| **Subscriptions** | `/parent-subscriptions/active`                      | GET    | Get active subscription          |
| **Subscriptions** | `/parent-subscriptions/:id`                         | GET    | Get subscription by ID           |
| **Subscriptions** | `/parent-subscriptions/:id`                         | PUT    | Update subscription              |
| **Subscriptions** | `/parent-subscriptions/:id/cancel`                  | POST   | Cancel subscription              |
| **Redemption**    | `/redemptions/redeem`                               | POST   | Redeem subscription code         |
| **Redemption**    | `/redemptions/active`                               | GET    | Get active redeemed subscription |
| **Redemption**    | `/redemptions`                                      | GET    | Get all redeemed subscriptions   |
| **Redemption**    | `/redemptions/:subscriptionId`                      | GET    | Get subscription details         |
| **Redemption**    | `/redemptions/cancel`                               | POST   | Cancel subscription              |
| **Redemption**    | `/redemptions/status/check`                         | GET    | Check subscription status        |
| **Redemption**    | `/redemptions/available/codes`                      | GET    | Get available codes              |
| **Payments**      | `/payments`                                         | POST   | Initiate payment                 |
| **Payments**      | `/payments/:id/complete`                            | POST   | Complete payment                 |
| **Payments**      | `/payments/history`                                 | GET    | Get payment history              |
| **Payments**      | `/payments/completed`                               | GET    | Get completed payments           |
| **Payments**      | `/payments/:id`                                     | GET    | Get payment by ID                |
| **Razorpay**      | `/razorpay/config`                                  | GET    | Get Razorpay config (public)     |
| **Razorpay**      | `/razorpay/create-order`                            | POST   | Create Razorpay order            |
| **Razorpay**      | `/razorpay/verify-payment`                          | POST   | Verify payment                   |
| **Reviews**       | `/reviews`                                          | POST   | Submit review                    |
| **Reviews**       | `/reviews/my-reviews`                               | GET    | Get my reviews                   |
| **Reviews**       | `/reviews/:id`                                      | GET    | Get review by ID                 |
| **Reviews**       | `/reviews/:id`                                      | PUT    | Update review                    |
| **Reviews**       | `/reviews/:id`                                      | DELETE | Delete review                    |
| **Notifications** | `/notifications`                                    | GET    | Get all notifications            |
| **Notifications** | `/notifications/unread`                             | GET    | Get unread notifications         |
| **Notifications** | `/notifications/unread/count`                       | GET    | Get unread count                 |
| **Notifications** | `/notifications/:id/read`                           | PATCH  | Mark as read                     |
| **Notifications** | `/notifications/read-all`                           | PATCH  | Mark all as read                 |

---

#### 🔵 DRIVER APIs (Use `DRIVER_TOKEN`)

| Category          | Endpoint                                              | Method | Description                     |
| ----------------- | ----------------------------------------------------- | ------ | ------------------------------- |
| **Auth**          | `/auth/register/send-otp`                             | POST   | Send registration OTP (no auth) |
| **Auth**          | `/auth/register/verify-otp`                           | POST   | Verify OTP & register (no auth) |
| **Auth**          | `/auth/login/send-otp`                                | POST   | Send login OTP (no auth)        |
| **Auth**          | `/auth/login/verify-otp`                              | POST   | Verify login OTP (no auth)      |
| **Auth**          | `/auth/verify-token`                                  | GET    | Verify token                    |
| **Auth**          | `/auth/logout`                                        | POST   | Logout                          |
| **Profile**       | `/driver/profile`                                     | GET    | Get driver profile              |
| **Profile**       | `/driver/profile`                                     | PUT    | Update driver profile           |
| **Address**       | `/driver/address`                                     | POST   | Add address                     |
| **Address**       | `/driver/addresses`                                   | GET    | Get all addresses               |
| **Address**       | `/driver/address/:id`                                 | PUT    | Update address                  |
| **Address**       | `/driver/address/:id`                                 | DELETE | Delete address                  |
| **Documents**     | `/driver/documents`                                   | POST   | Upload documents                |
| **Documents**     | `/driver/documents`                                   | GET    | Get my documents                |
| **Documents**     | `/driver/documents/:id`                               | PUT    | Update documents                |
| **Availability**  | `/driver/availability`                                | PATCH  | Set availability                |
| **Assignments**   | `/driver-student-assignments/driver/pending`          | GET    | Get pending assignments         |
| **Assignments**   | `/driver-student-assignments/driver/my-assignments`   | GET    | Get my assignments              |
| **Assignments**   | `/driver-student-assignments/driver/parent-requested` | GET    | Get parent requests             |
| **Assignments**   | `/driver-student-assignments/:id`                     | GET    | Get assignment details          |
| **Assignments**   | `/driver-student-assignments/:id/approve`             | POST   | Approve assignment              |
| **Assignments**   | `/driver-student-assignments/:id/reject`              | POST   | Reject assignment               |
| **Trips**         | `/trips`                                              | POST   | Create trip                     |
| **Trips**         | `/trips/driver/my-trips`                              | GET    | Get my trips                    |
| **Trips**         | `/trips/:id`                                          | GET    | Get trip by ID                  |
| **Trips**         | `/trips/:id`                                          | PUT    | Update trip                     |
| **Trips**         | `/trips/:id/status`                                   | PATCH  | Update trip status              |
| **Trips**         | `/trips/:id`                                          | DELETE | Cancel trip                     |
| **Trip Students** | `/trip-students/trip/:tripId`                         | GET    | Get students for trip           |
| **Trip Students** | `/trip-students/:id/attendance`                       | PATCH  | Mark attendance                 |
| **Trip Students** | `/trip-students/:id/pickup`                           | PUT    | Record individual pickup        |
| **Trip Students** | `/trip-students/:id/drop`                             | PUT    | Record individual drop          |
| **Trip Students** | `/trip-students/trip/:tripId/bulk-stop-action`        | POST   | Bulk pickup/drop at stop        |
| **Trip Students** | `/trip-students/trip/:tripId/bulk-school-action`      | POST   | Bulk action at school           |
| **QR/OTP**        | `/daily-qr-otp/verify`                                | POST   | Verify QR/OTP                   |
| **QR/OTP**        | `/daily-qr-otp/verify-attendance`                     | POST   | Verify & record attendance      |
| **QR/OTP**        | `/daily-qr-otp/student/:studentId/trip/:tripId`       | GET    | Get student's QR/OTP            |
| **Tracking**      | `/tracking/calculate-route`                           | POST   | Calculate optimal route         |
| **Tracking**      | `/tracking/calculate-route-matrix`                    | POST   | Calculate route (TomTom)        |
| **Tracking**      | `/tracking/recalculate-route`                         | POST   | Recalculate from position       |
| **Tracking**      | `/tracking/update-position`                           | POST   | Update driver position          |
| **Tracking**      | `/tracking/trip/:tripId/latest`                       | GET    | Get latest position             |
| **Tracking**      | `/tracking/trip/:tripId/history`                      | GET    | Get tracking history            |
| **Tracking**      | `/tracking/trip/:tripId/route`                        | GET    | Get route details               |
| **Notifications** | `/notifications`                                      | GET    | Get all notifications           |
| **Notifications** | `/notifications/unread`                               | GET    | Get unread notifications        |
| **Notifications** | `/notifications/unread/count`                         | GET    | Get unread count                |
| **Notifications** | `/notifications/:id/read`                             | PATCH  | Mark as read                    |
| **Notifications** | `/notifications/read-all`                             | PATCH  | Mark all as read                |

---

#### ⚪ PUBLIC APIs (No Token Required)

| Category         | Endpoint                           | Method | Description                        |
| ---------------- | ---------------------------------- | ------ | ---------------------------------- |
| **Auth**         | `/auth/register/send-otp`          | POST   | Send registration OTP              |
| **Auth**         | `/auth/register/verify-otp`        | POST   | Verify OTP & complete registration |
| **Auth**         | `/auth/login/send-otp`             | POST   | Send login OTP                     |
| **Auth**         | `/auth/login/verify-otp`           | POST   | Verify login OTP                   |
| **Auth**         | `/auth/roles`                      | GET    | Get all roles                      |
| **Admin**        | `/admin/setup/create-superadmin`   | POST   | Create initial super admin         |
| **Admin**        | `/admin/login`                     | POST   | Admin login                        |
| **Admin**        | `/admin/verify-password-hash`      | POST   | Debug password hash                |
| **School Admin** | `/school-admin/register`           | POST   | Register school admin              |
| **School Admin** | `/school-admin/login`              | POST   | School admin login                 |
| **Schools**      | `/schools`                         | GET    | Get all schools                    |
| **Schools**      | `/schools/:id`                     | GET    | Get school by ID                   |
| **Plans**        | `/subscription-plans`              | GET    | Get all subscription plans         |
| **Plans**        | `/subscription-plans/:id`          | GET    | Get plan by ID                     |
| **Reviews**      | `/reviews/driver/:driverId`        | GET    | Get driver reviews                 |
| **Reviews**      | `/reviews/driver/:driverId/rating` | GET    | Get driver rating                  |
| **Razorpay**     | `/razorpay/config`                 | GET    | Get Razorpay config                |
| **Razorpay**     | `/razorpay/order/:orderId`         | GET    | Get order details                  |
| **Razorpay**     | `/razorpay/payment/:paymentId`     | GET    | Get payment details                |

---

## Environment Setup

### Start the Server

Run the following command in the project directory:

```
npm run dev
```

**Expected output:**

```
Server running on port 3000
Database connected successfully
```

### Making API Calls

All requests should include the appropriate headers:

- `Content-Type: application/json` (for POST/PUT/PATCH requests)
- `Authorization: Bearer <TOKEN>` (for authenticated endpoints)

---

## Phase 1: Admin Setup

### 1.1 Create Initial Super Admin (First Time Only)

**Endpoint:**

```
POST /api/admin/setup/create-superadmin
```

**Payload:**

```json
{
  "username": "admin_super",
  "email": "admin@pingparent.com",
  "password": "Admin@123456",
  "phone_number": "+919876543210",
  "admin_role": "superadmin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Super admin created successfully",
  "data": {
    "admin_id": "uuid-admin-id-here",
    "username": "admin_super",
    "email": "admin@pingparent.com"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Super admin already exists"
}
```

> **Save:** `ADMIN_ID` from response

---

### 1.2 Admin Login

**Endpoint:**

```
POST /api/admin/login
```

**Payload:**

```json
{
  "email": "admin@pingparent.com",
  "password": "Admin@123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "admin_id": "uuid-admin-id",
      "username": "admin_super",
      "email": "admin@pingparent.com"
    }
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

> **Save:** `ADMIN_TOKEN` from response

---

### 1.3 Verify Admin Token

**Endpoint:**

```
GET /api/admin/verify-admin-token
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Response:**

```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "admin_id": "uuid-admin-id",
    "email": "admin@pingparent.com"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Token is invalid or expired"
}
```

---

### 1.4 Get All Users (Admin)

**Endpoint:**

```
GET /api/admin/users?page=1&limit=10
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": { "page": 1, "limit": 10, "total": 50 }
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## Phase 2: School Management

### 2.1 Create School (Admin Only)

**Endpoint:**

```
POST /api/schools/admin
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Payload:**

```json
{
  "school_name": "Springfield Elementary School",
  "address": "100 School Street",
  "city": "New York",
  "state": "NY",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "contact_number": "+1234567896",
  "email": "info@springfield.edu"
}
```

**Response:**

```json
{
  "success": true,
  "message": "School created successfully",
  "data": {
    "school_id": "uuid-school-id",
    "school_name": "Springfield Elementary School",
    "address": "100 School Street",
    "city": "New York",
    "state": "NY",
    "latitude": 40.7589,
    "longitude": -73.9851
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "School with this email already exists"
}
```

> **Save:** `SCHOOL_ID` from response

---

### 2.2 Create Second School

**Endpoint:**

```
POST /api/schools/admin
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Payload:**

```json
{
  "school_name": "Lincoln High School",
  "address": "200 Education Boulevard",
  "city": "Los Angeles",
  "state": "CA",
  "latitude": 34.04,
  "longitude": -118.27,
  "contact_number": "+1234567897",
  "email": "contact@lincoln.edu"
}
```

**Response:** Same as 2.1

**Error:** Same as 2.1

---

### 2.3 Get All Schools

**Endpoint:**

```
GET /api/schools?page=1&limit=10
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "schools": [...],
    "pagination": { "page": 1, "limit": 10, "total": 2 }
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 2.4 Get School by ID

**Endpoint:**

```
GET /api/schools/:schoolId
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "school_id": "uuid-school-id",
    "school_name": "Springfield Elementary School",
    "address": "100 School Street",
    "city": "New York",
    "state": "NY"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "School not found"
}
```

---

### 2.5 Register School Admin

**Endpoint:**

```
POST /api/school-admin/register
```

**Payload:**

```json
{
  "school_id": "uuid-school-id",
  "name": "John Principal",
  "email": "principal@springfield.edu",
  "phone_number": "+1234567800",
  "password": "SchoolAdmin@123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "School admin registered successfully",
  "data": {
    "admin_id": "uuid-school-admin-id",
    "name": "John Principal",
    "email": "principal@springfield.edu"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Email already registered"
}
```

> **Save:** `SCHOOL_ADMIN_ID` from response

---

### 2.6 School Admin Login

**Endpoint:**

```
POST /api/school-admin/login
```

**Payload:**

```json
{
  "email": "principal@springfield.edu",
  "password": "SchoolAdmin@123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "admin_id": "uuid-school-admin-id",
      "name": "John Principal",
      "email": "principal@springfield.edu"
    }
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

> **Save:** `SCHOOL_ADMIN_TOKEN` from response

---

## Phase 3: Subscription Plans

### 3.1 Create Subscription Plan (Admin)

**Endpoint:**

```
POST /api/subscription-plans
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Payload:**

```json
{
  "plan_name": "Monthly Basic",
  "plan_type": "monthly",
  "price": 99.99,
  "features": {
    "tracking": true,
    "qr_attendance": true,
    "notifications": true,
    "max_students": 1,
    "trip_history_days": 30,
    "support_level": "basic"
  },
  "is_active": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription plan created successfully",
  "data": {
    "plan_id": "uuid-plan-id",
    "plan_name": "Monthly Basic",
    "plan_type": "monthly",
    "price": 99.99
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Plan with this name already exists"
}
```

> **Save:** `PLAN_ID` from response

---

### 3.2 Create Quarterly Plan

**Endpoint:**

```
POST /api/subscription-plans
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Payload:**

```json
{
  "plan_name": "Quarterly Standard",
  "plan_type": "quarterly",
  "price": 269.97,
  "features": {
    "tracking": true,
    "qr_attendance": true,
    "notifications": true,
    "max_students": 2,
    "trip_history_days": 90,
    "support_level": "priority",
    "reports": true
  },
  "is_active": true
}
```

**Response:** Same as 3.1

**Error:** Same as 3.1

---

### 3.3 Create Annual Plan

**Endpoint:**

```
POST /api/subscription-plans
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Payload:**

```json
{
  "plan_name": "Annual Ultimate",
  "plan_type": "yearly",
  "price": 899.99,
  "features": {
    "tracking": true,
    "qr_attendance": true,
    "notifications": true,
    "max_students": -1,
    "trip_history_days": 365,
    "support_level": "premium",
    "reports": true,
    "dedicated_manager": true
  },
  "is_active": true
}
```

**Response:** Same as 3.1

**Error:** Same as 3.1

---

### 3.4 Get All Subscription Plans

**Endpoint:**

```
GET /api/subscription-plans
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "plan_id": "uuid-plan-id",
        "plan_name": "Monthly Basic",
        "plan_type": "monthly",
        "price": 99.99,
        "is_active": true
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Failed to fetch plans"
}
```

---

## Phase 4: Parent Registration

### 4.1 Send OTP for Parent Registration

**Endpoint:**

```
POST /api/auth/register/send-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567890",
  "user_type": "parent"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone_number": "+1234567890",
    "otp_expires_in": 300
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Phone number already registered"
}
```

> **Note:** In development, OTP is usually `123456` or logged to console

---

### 4.2 Verify OTP and Complete Registration

**Endpoint:**

```
POST /api/auth/register/verify-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567890",
  "otp": "123456",
  "user_type": "parent",
  "name": "John Doe",
  "email": "john.doe@parent.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "uuid-user-id",
      "phone_number": "+1234567890",
      "user_type": "parent"
    },
    "parent": {
      "parent_id": "uuid-parent-id",
      "name": "John Doe",
      "email": "john.doe@parent.com"
    }
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

> **Save:** `PARENT_TOKEN` and `PARENT_ID` from response

---

### 4.3 Parent Login (Returning User)

**Send Login OTP:**

**Endpoint:**

```
POST /api/auth/login/send-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "User not found"
}
```

---

**Verify Login OTP:**

**Endpoint:**

```
POST /api/auth/login/verify-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567890",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

---

### 4.4 Get Parent Profile

**Endpoint:**

```
GET /api/parent/profile
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "parent_id": "uuid-parent-id",
    "name": "John Doe",
    "email": "john.doe@parent.com",
    "phone_number": "+1234567890"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 4.5 Update Parent Profile

**Endpoint:**

```
PUT /api/parent/profile
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "name": "John Doe",
  "email": "john.doe@parent.com",
  "photo_url": "https://storage.pingparent.com/photos/john_doe.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Validation error"
}
```

---

### 4.6 Add Parent Address (COORDINATES REQUIRED)

**Endpoint:**

```
POST /api/parent/address
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "address_line1": "123 Main Street",
  "address_line2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "pincode": "10001",
  "latitude": 40.7128,
  "longitude": -74.006,
  "is_primary": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "address_id": "uuid-address-id",
    "address_line1": "123 Main Street"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Latitude and longitude are required"
}
```

> **Save:** `ADDRESS_ID` from response

---

### 4.7 Get Parent Addresses

**Endpoint:**

```
GET /api/parent/addresses
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "address_id": "uuid-address-id",
        "address_line1": "123 Main Street",
        "city": "New York",
        "is_primary": true
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 4.8 Register Second Parent

**Endpoint:**

```
POST /api/auth/register/send-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567891",
  "user_type": "parent"
}
```

---

**Endpoint:**

```
POST /api/auth/register/verify-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567891",
  "otp": "123456",
  "user_type": "parent",
  "name": "Sarah Williams",
  "email": "sarah.williams@parent.com"
}
```

**Response:** Same as 4.2

**Error:** Same as 4.2

---

## Phase 5: Driver Registration

### 5.1 Send OTP for Driver Registration

**Endpoint:**

```
POST /api/auth/register/send-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567893",
  "user_type": "driver"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone_number": "+1234567893",
    "otp_expires_in": 300
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Phone number already registered"
}
```

---

### 5.2 Verify OTP and Complete Driver Registration

**Endpoint:**

```
POST /api/auth/register/verify-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567893",
  "otp": "123456",
  "user_type": "driver",
  "name": "Jane Smith",
  "email": "jane.smith@driver.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "uuid-user-id",
      "phone_number": "+1234567893",
      "user_type": "driver"
    },
    "driver": {
      "driver_id": "uuid-driver-id",
      "driver_unique_id": "DRV123",
      "name": "Jane Smith"
    }
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

> **Save:** `DRIVER_TOKEN`, `DRIVER_ID`, and `DRIVER_UNIQUE_ID` from response

---

### 5.3 Get Driver Profile

**Endpoint:**

```
GET /api/driver/profile
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "driver_id": "uuid-driver-id",
    "driver_unique_id": "DRV123",
    "name": "Jane Smith",
    "email": "jane.smith@driver.com",
    "approval_status": "pending"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 5.4 Update Driver Profile

**Endpoint:**

```
PUT /api/driver/profile
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@driver.com",
  "photo_url": "https://storage.pingparent.com/photos/jane_smith.jpg",
  "vehicle_type": "van",
  "vehicle_number": "NY-ABC-1234",
  "vehicle_capacity": 10
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Validation error"
}
```

---

### 5.5 Add Driver Address (COORDINATES REQUIRED)

**Endpoint:**

```
POST /api/driver/address
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "address_line1": "111 Driver Lane",
  "address_line2": "",
  "city": "New York",
  "state": "NY",
  "pincode": "10002",
  "latitude": 40.72,
  "longitude": -74.01,
  "is_primary": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "address_id": "uuid-address-id"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Latitude and longitude are required"
}
```

---

### 5.6 Upload Driver Documents

**Endpoint:**

```
POST /api/driver/documents
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "driving_license_number": "DL-NY-123456",
  "driving_license_photo_url": "https://storage.pingparent.com/docs/dl_jane.jpg",
  "vehicle_license_number": "VL-NY-789012",
  "vehicle_license_photo_url": "https://storage.pingparent.com/docs/vl_jane.jpg",
  "insurance_number": "INS-NY-345678",
  "insurance_photo_url": "https://storage.pingparent.com/docs/ins_jane.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Documents uploaded successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "All document fields are required"
}
```

---

### 5.7 Admin Approves Driver

**Endpoint:**

```
PUT /api/admin/drivers/:driverId/approval-status
```

**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Payload:**

```json
{
  "approval_status": "approved"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Driver approved successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Driver not found"
}
```

---

### 5.8 Set Driver Availability

**Endpoint:**

```
PATCH /api/driver/availability
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "is_available": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Availability updated"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 5.9 Register Second Driver

**Endpoint:**

```
POST /api/auth/register/send-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567894",
  "user_type": "driver"
}
```

---

**Endpoint:**

```
POST /api/auth/register/verify-otp
```

**Payload:**

```json
{
  "phone_number": "+1234567894",
  "otp": "123456",
  "user_type": "driver",
  "name": "Mike Johnson",
  "email": "mike.johnson@driver.com"
}
```

**Response:** Same as 5.2

**Error:** Same as 5.2

---

## Phase 6: Student Management

### 6.1 Add First Student (Parent)

**Endpoint:**

```
POST /api/students
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "school_id": "uuid-school-id",
  "student_name": "Emily Johnson",
  "class": "5th Grade",
  "section": "A",
  "roll_number": "STU001",
  "date_of_birth": "2016-03-15",
  "gender": "female",
  "pickup_address_id": "uuid-address-id",
  "emergency_contact": "+1987654320",
  "medical_info": "No known allergies"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Student added successfully",
  "data": {
    "student_id": "uuid-student-id",
    "student_name": "Emily Johnson",
    "class": "5th Grade",
    "section": "A"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "School not found"
}
```

> **Save:** `STUDENT_ID` from response

---

### 6.2 Add Second Student (Same Parent)

**Endpoint:**

```
POST /api/students
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "school_id": "uuid-school-id",
  "student_name": "Michael Johnson",
  "class": "3rd Grade",
  "section": "B",
  "roll_number": "STU002",
  "date_of_birth": "2018-07-22",
  "gender": "male",
  "pickup_address_id": "uuid-address-id",
  "emergency_contact": "+1987654320",
  "medical_info": ""
}
```

**Response:** Same as 6.1

**Error:** Same as 6.1

---

### 6.3 Get All Students (Parent)

**Endpoint:**

```
GET /api/students
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "students": [
      {
        "student_id": "uuid-student-id",
        "student_name": "Emily Johnson",
        "class": "5th Grade",
        "school": {...}
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 6.4 Get Student by ID

**Endpoint:**

```
GET /api/students/:studentId
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "student_id": "uuid-student-id",
    "student_name": "Emily Johnson",
    "class": "5th Grade",
    "section": "A",
    "school": {...},
    "pickup_address": {...}
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Student not found"
}
```

---

### 6.5 Update Student

**Endpoint:**

```
PUT /api/students/:studentId
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "class": "5th Grade",
  "section": "A",
  "photo_url": "https://storage.pingparent.com/photos/emily.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Student updated successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Student not found"
}
```

---

## Phase 7: Driver-Student Assignments

### 7.1 Parent Searches for Driver (by Unique ID)

**Endpoint:**

```
GET /api/driver-student-assignments/drivers?driver_unique_id=DRV123
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "driver_id": "uuid-driver-id",
        "driver_unique_id": "DRV123",
        "name": "Jane Smith",
        "vehicle_type": "van",
        "rating": 4.5
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "No drivers found"
}
```

---

### 7.2 Create Assignment Request (Parent → Driver)

**Endpoint:**

```
POST /api/driver-student-assignments
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "driver_id": "uuid-driver-id",
  "student_id": "uuid-student-id",
  "driver_unique_id": "DRV123",
  "monthly_fee": 2500.0,
  "assignment_source": "parent"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Assignment request created successfully",
  "data": {
    "assignment_id": "uuid-assignment-id",
    "driver_id": "uuid-driver-id",
    "student_id": "uuid-student-id",
    "assignment_status": "pending",
    "assignment_source": "parent"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Driver is not approved or unavailable"
}
```

> **Save:** `ASSIGNMENT_ID` from response

---

### 7.3 Driver Views Pending Assignments

**Endpoint:**

```
GET /api/driver-student-assignments/driver/pending
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "assignment_id": "uuid-assignment-id",
        "student": {...},
        "parent": {...},
        "monthly_fee": 2500.00,
        "assignment_status": "pending"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 7.4 Driver Approves Assignment

**Endpoint:**

```
POST /api/driver-student-assignments/:assignmentId/approve
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "message": "Assignment approved successfully",
  "data": {
    "assignment_id": "uuid-assignment-id",
    "assignment_status": "active"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Assignment not found or already processed"
}
```

---

### 7.5 Driver Views Active Assignments

**Endpoint:**

```
GET /api/driver-student-assignments/driver/my-assignments
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "assignment_id": "uuid-assignment-id",
        "student": {...},
        "parent": {...},
        "assignment_status": "active"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 7.6 Parent Views Their Assignments

**Endpoint:**

```
GET /api/driver-student-assignments/parent/my-assignments
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "assignment_id": "uuid-assignment-id",
        "driver": {...},
        "student": {...},
        "assignment_status": "active"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 7.7 Reject Assignment (Alternative Flow)

**Endpoint:**

```
POST /api/driver-student-assignments/:assignmentId/reject
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "message": "Assignment rejected successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Assignment not found"
}
```

---

## Phase 8: Trip Management

### 8.1 Create Trip (Driver)

**Endpoint:**

```
POST /api/trips
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "school_id": "uuid-school-id",
  "trip_type": "pickup",
  "trip_date": "2026-02-10"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "trip_id": "uuid-trip-id",
    "driver_id": "uuid-driver-id",
    "school_id": "uuid-school-id",
    "trip_type": "pickup",
    "trip_date": "2026-02-10",
    "trip_status": "scheduled"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "No active assignments for this school"
}
```

> **Save:** `TRIP_ID` from response

---

### 8.2 Get Driver's Trips

**Endpoint:**

```
GET /api/trips/driver/my-trips?trip_date=2026-02-10
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "trip_id": "uuid-trip-id",
        "trip_type": "pickup",
        "trip_date": "2026-02-10",
        "trip_status": "scheduled",
        "school": {...},
        "student_count": 5
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 8.3 Get Trip by ID

**Endpoint:**

```
GET /api/trips/:tripId
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "trip_id": "uuid-trip-id",
    "trip_type": "pickup",
    "trip_date": "2026-02-10",
    "trip_status": "scheduled",
    "school": {...},
    "students": [...]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Trip not found"
}
```

---

### 8.4 Get Students for Trip

**Endpoint:**

```
GET /api/trip-students/trip/:tripId
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "trip_students": [
      {
        "trip_student_id": "uuid-trip-student-id",
        "student": {...},
        "pickup_address": {...},
        "attendance_status": "pending"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Trip not found"
}
```

---

### 8.5 Start Trip

**Endpoint:**

```
PATCH /api/trips/:tripId/status
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "trip_status": "started"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Trip status updated",
  "data": {
    "trip_id": "uuid-trip-id",
    "trip_status": "started"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid status transition"
}
```

---

### 8.6 Update Trip Status to In Progress

**Endpoint:**

```
PATCH /api/trips/:tripId/status
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "trip_status": "in_progress"
}
```

**Response:** Same as 8.5

**Error:** Same as 8.5

---

### 8.7 Complete Trip

**Endpoint:**

```
PATCH /api/trips/:tripId/status
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "trip_status": "completed"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Trip completed successfully",
  "data": {
    "trip_id": "uuid-trip-id",
    "trip_status": "completed"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Cannot complete trip with pending students"
}
```

---

### 8.8 Create Drop Trip

**Endpoint:**

```
POST /api/trips
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "school_id": "uuid-school-id",
  "trip_type": "drop",
  "trip_date": "2026-02-10"
}
```

**Response:** Same as 8.1

**Error:** Same as 8.1

---

## Phase 9: QR/OTP Verification

### 9.1 Generate QR/OTP (Parent)

**Endpoint:**

```
POST /api/daily-qr-otp/generate
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "trip_id": "uuid-trip-id",
  "trip_type": "pickup"
}
```

**Response:**

```json
{
  "success": true,
  "message": "QR/OTP generated successfully",
  "data": {
    "qr_otp_id": "uuid-qr-otp-id",
    "parent_id": "uuid-parent-id",
    "student_ids": ["uuid-student-1", "uuid-student-2"],
    "qr_code": "unique-qr-code-string",
    "otp_code": "123456",
    "trip_type": "pickup",
    "valid_from": "2026-02-10T05:00:00Z",
    "valid_until": "2026-02-10T10:00:00Z"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "No active students for this trip"
}
```

> **Save:** `QR_OTP_ID`, `OTP_CODE`, and `QR_CODE` from response

---

### 9.2 Get Parent's OTP for Trip

**Endpoint:**

```
GET /api/daily-qr-otp/parent/:parentId/trip/:tripId
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "qr_otp_id": "uuid-qr-otp-id",
    "qr_code": "unique-qr-code-string",
    "otp_code": "123456",
    "valid_until": "2026-02-10T10:00:00Z"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "OTP not found or expired"
}
```

---

### 9.3 Verify OTP (Driver - At Pickup/Drop)

**Endpoint:**

```
POST /api/daily-qr-otp/verify
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "trip_id": "uuid-trip-id",
  "otp_code": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "verified": true,
    "parent_id": "uuid-parent-id",
    "student_ids": ["uuid-student-1", "uuid-student-2"]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

---

### 9.4 Verify QR Code (Driver)

**Endpoint:**

```
POST /api/daily-qr-otp/verify
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "trip_id": "uuid-trip-id",
  "qr_code": "unique-qr-code-string"
}
```

**Response:** Same as 9.3

**Error:** Same as 9.3

---

### 9.5 Record Bulk Stop Action (Pickup at Home)

**Endpoint:**

```
POST /api/trip-students/trip/:tripId/bulk-stop-action
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "student_ids": ["uuid-student-id"],
  "absent_student_ids": [],
  "otp_code": "123456",
  "latitude": 40.7128,
  "longitude": -74.006
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bulk stop action recorded",
  "data": {
    "picked_up": 2,
    "marked_absent": 0
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid OTP or student not in trip"
}
```

---

### 9.6 Record Bulk School Action (Drop at School)

**Endpoint:**

```
POST /api/trip-students/trip/:tripId/bulk-school-action
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "student_ids": ["uuid-student-id"],
  "latitude": 40.7589,
  "longitude": -73.9851
}
```

**Response:**

```json
{
  "success": true,
  "message": "Bulk school action recorded",
  "data": {
    "dropped_off": 2
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Student not picked up yet"
}
```

---

### 9.7 Mark Student Attendance

**Endpoint:**

```
PATCH /api/trip-students/trip/:tripId/student/:studentId/attendance
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "attendance_status": "present"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Attendance marked"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Student not found in trip"
}
```

---

## Phase 10: Tracking

### 10.1 Calculate Optimal Route

**Endpoint:**

```
POST /api/tracking/calculate-route
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "trip_id": "uuid-trip-id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Route calculated successfully",
  "data": {
    "optimized_route": [...],
    "total_distance_km": 15.5,
    "estimated_duration_min": 45
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Trip has no students with addresses"
}
```

---

### 10.2 Update Driver Position

**Endpoint:**

```
POST /api/tracking/update-position
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "trip_id": "uuid-trip-id",
  "latitude": 40.715,
  "longitude": -74.005,
  "speed": 35.5,
  "heading": 45.0,
  "accuracy": 10.0
}
```

**Response:**

```json
{
  "success": true,
  "message": "Position updated"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Trip not in progress"
}
```

---

### 10.3 Get Latest Driver Position (Parent View)

**Endpoint:**

```
GET /api/tracking/trip/:tripId/latest
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "latitude": 40.715,
    "longitude": -74.005,
    "speed": 35.5,
    "heading": 45.0,
    "updated_at": "2026-02-10T07:30:00Z"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "No tracking data available"
}
```

---

### 10.4 Get Tracking History

**Endpoint:**

```
GET /api/tracking/trip/:tripId/history
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "positions": [
      {
        "latitude": 40.7128,
        "longitude": -74.006,
        "timestamp": "2026-02-10T07:00:00Z"
      },
      {
        "latitude": 40.715,
        "longitude": -74.005,
        "timestamp": "2026-02-10T07:05:00Z"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Trip not found"
}
```

---

### 10.5 Get Complete Route Details

**Endpoint:**

```
GET /api/tracking/trip/:tripId/route
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "route": {
      "waypoints": [...],
      "polyline": "encoded_polyline_string",
      "total_distance_km": 15.5,
      "estimated_duration_min": 45
    }
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Route not calculated yet"
}
```

---

### 10.6 Recalculate Route (From Current Position)

**Endpoint:**

```
POST /api/tracking/recalculate-route
```

**Headers:** `Authorization: Bearer DRIVER_TOKEN`

**Payload:**

```json
{
  "trip_id": "uuid-trip-id",
  "current_latitude": 40.715,
  "current_longitude": -74.005
}
```

**Response:**

```json
{
  "success": true,
  "message": "Route recalculated",
  "data": {
    "remaining_waypoints": [...],
    "remaining_distance_km": 10.2,
    "remaining_duration_min": 30
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Trip not in progress"
}
```

---

## Phase 11: Payments & Subscriptions

### 11.1 Get Razorpay Configuration

**Endpoint:**

```
GET /api/razorpay/config
```

**Response:**

```json
{
  "success": true,
  "data": {
    "key_id": "rzp_test_xxxxxxxxxx",
    "currency": "INR"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Razorpay not configured"
}
```

---

### 11.2 Create Razorpay Order

**Endpoint:**

```
POST /api/razorpay/create-order
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "amount": 9999,
  "currency": "INR",
  "plan_id": "uuid-plan-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order_id": "order_xxxxxxxxxx",
    "amount": 9999,
    "currency": "INR",
    "key_id": "rzp_test_xxxxxxxxxx"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid plan or amount"
}
```

> **Save:** `ORDER_ID` from response

---

### 11.3 Verify Payment (After Razorpay Checkout)

**Endpoint:**

```
POST /api/razorpay/verify-payment
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "razorpay_order_id": "order_xxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxx",
  "razorpay_signature": "signature_hash_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment_id": "uuid-payment-id",
    "subscription_id": "uuid-subscription-id"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Payment verification failed"
}
```

---

### 11.4 Create Parent Subscription (Manual)

**Endpoint:**

```
POST /api/parent-subscriptions
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "plan_id": "uuid-plan-id",
  "start_date": "2026-02-10",
  "end_date": "2026-03-10",
  "auto_renew": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription_id": "uuid-subscription-id",
    "plan": {...},
    "start_date": "2026-02-10",
    "end_date": "2026-03-10",
    "status": "active"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Already have an active subscription"
}
```

> **Save:** `SUBSCRIPTION_ID` from response

---

### 11.5 Get Active Subscription

**Endpoint:**

```
GET /api/parent-subscriptions/active
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "subscription_id": "uuid-subscription-id",
    "plan": {...},
    "start_date": "2026-02-10",
    "end_date": "2026-03-10",
    "status": "active"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "No active subscription found"
}
```

---

### 11.6 Get All Parent Subscriptions

**Endpoint:**

```
GET /api/parent-subscriptions
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "subscription_id": "uuid-subscription-id",
        "plan": {...},
        "status": "active"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 11.7 Get Payment History

**Endpoint:**

```
GET /api/payments/history
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "payment_id": "uuid-payment-id",
        "amount": 99.99,
        "status": "completed",
        "created_at": "2026-02-10T10:00:00Z"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 11.8 School Subscription (School Admin)

**Endpoint:**

```
POST /api/school-subscriptions
```

**Headers:** `Authorization: Bearer SCHOOL_ADMIN_TOKEN`

**Payload:**

```json
{
  "school_id": "uuid-school-id",
  "plan_id": "uuid-plan-id",
  "subscription_code": "SPR-2026-001",
  "start_date": "2026-02-01",
  "end_date": "2026-08-01"
}
```

**Response:**

```json
{
  "success": true,
  "message": "School subscription created",
  "data": {
    "subscription_id": "uuid-subscription-id",
    "subscription_code": "SPR-2026-001"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid school or plan"
}
```

---

### 11.9 Redeem Subscription Code (Parent)

**Endpoint:**

```
POST /api/redemption/redeem
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "subscription_code": "SPR-2026-001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription code redeemed successfully",
  "data": {
    "subscription_id": "uuid-subscription-id",
    "valid_until": "2026-08-01"
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Invalid or expired code"
}
```

---

## Phase 12: Reviews & Ratings

### 12.1 Submit Review (Parent)

**Endpoint:**

```
POST /api/reviews
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "driver_id": "uuid-driver-id",
  "trip_id": "uuid-trip-id",
  "rating": 5,
  "review_text": "Excellent service! Very punctual and safe driver."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "review_id": "uuid-review-id",
    "driver_id": "uuid-driver-id",
    "rating": 5
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "You have already reviewed this trip"
}
```

> **Save:** `REVIEW_ID` from response

---

### 12.2 Get My Reviews (Parent)

**Endpoint:**

```
GET /api/reviews/my-reviews
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "review_id": "uuid-review-id",
        "driver": {...},
        "rating": 5,
        "review_text": "Excellent service!",
        "created_at": "2026-02-10T12:00:00Z"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 12.3 Get Driver Reviews (Public)

**Endpoint:**

```
GET /api/reviews/driver/:driverId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "review_id": "uuid-review-id",
        "parent": { "name": "John D." },
        "rating": 5,
        "review_text": "Excellent service!",
        "created_at": "2026-02-10T12:00:00Z"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Driver not found"
}
```

---

### 12.4 Get Driver Rating (Public)

**Endpoint:**

```
GET /api/reviews/driver/:driverId/rating
```

**Response:**

```json
{
  "success": true,
  "data": {
    "driver_id": "uuid-driver-id",
    "average_rating": 4.8,
    "total_reviews": 25
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Driver not found"
}
```

---

### 12.5 Update Review

**Endpoint:**

```
PUT /api/reviews/:reviewId
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Payload:**

```json
{
  "rating": 4,
  "review_text": "Updated review: Good service overall."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Review updated successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Review not found or not authorized"
}
```

---

### 12.6 Delete Review

**Endpoint:**

```
DELETE /api/reviews/:reviewId
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Review not found or not authorized"
}
```

---

## Phase 13: Notifications

### 13.1 Get All Notifications

**Endpoint:**

```
GET /api/notifications
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notification_id": "uuid-notification-id",
        "title": "Trip Started",
        "message": "Your driver has started the pickup trip",
        "is_read": false,
        "created_at": "2026-02-10T07:00:00Z"
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 13.2 Get Unread Notifications

**Endpoint:**

```
GET /api/notifications/unread
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notification_id": "uuid-notification-id",
        "title": "Trip Started",
        "message": "Your driver has started the pickup trip",
        "is_read": false
      }
    ]
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 13.3 Get Unread Count

**Endpoint:**

```
GET /api/notifications/unread/count
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 13.4 Mark Notification as Read

**Endpoint:**

```
PATCH /api/notifications/:notificationId/read
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Notification not found"
}
```

---

### 13.5 Mark All as Read

**Endpoint:**

```
PATCH /api/notifications/read-all
```

**Headers:** `Authorization: Bearer PARENT_TOKEN`

**Response:**

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

**Error:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## Complete Flow Summary

### Quick Reference: Complete E2E Test Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: ADMIN SETUP                                           │
│  ├── Create Super Admin                                         │
│  └── Admin Login → Get ADMIN_TOKEN                              │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: SCHOOL MANAGEMENT                                     │
│  ├── Create School → Get SCHOOL_ID                              │
│  ├── Register School Admin                                      │
│  └── School Admin Login → Get SCHOOL_ADMIN_TOKEN                │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3: SUBSCRIPTION PLANS                                    │
│  ├── Create Monthly Plan                                        │
│  ├── Create Quarterly Plan                                      │
│  └── Create Annual Plan → Get PLAN_ID                           │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 4: PARENT REGISTRATION                                   │
│  ├── Send OTP (+1234567890)                                     │
│  ├── Verify OTP → Get PARENT_TOKEN, PARENT_ID                   │
│  ├── Update Profile                                             │
│  └── Add Address (with lat/lng) → Get ADDRESS_ID                │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 5: DRIVER REGISTRATION                                   │
│  ├── Send OTP (+1234567893)                                     │
│  ├── Verify OTP → Get DRIVER_TOKEN, DRIVER_ID, DRIVER_UNIQUE_ID │
│  ├── Update Profile (vehicle details)                           │
│  ├── Add Address (with lat/lng)                                 │
│  ├── Upload Documents                                           │
│  ├── Admin Approves Driver                                      │
│  └── Set Availability                                           │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 6: STUDENT MANAGEMENT                                    │
│  ├── Add Student 1 (Emily) → Get STUDENT_ID                     │
│  └── Add Student 2 (Michael)                                    │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 7: DRIVER-STUDENT ASSIGNMENTS                            │
│  ├── Parent Searches for Driver                                 │
│  ├── Create Assignment Request → Get ASSIGNMENT_ID              │
│  ├── Driver Views Pending Assignments                           │
│  └── Driver Approves Assignment                                 │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 8: TRIP MANAGEMENT                                       │
│  ├── Create Pickup Trip → Get TRIP_ID                           │
│  ├── Start Trip                                                 │
│  ├── Update Status to In Progress                               │
│  └── Complete Trip                                              │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 9: QR/OTP VERIFICATION                                   │
│  ├── Generate QR/OTP (Parent) → Get OTP_CODE, QR_CODE           │
│  ├── Verify OTP (Driver at pickup)                              │
│  ├── Bulk Stop Action (pickup at home)                          │
│  └── Bulk School Action (drop at school)                        │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 10: TRACKING                                             │
│  ├── Calculate Optimal Route                                    │
│  ├── Update Driver Position (multiple times)                    │
│  ├── Get Latest Position (Parent view)                          │
│  └── Get Tracking History                                       │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 11: PAYMENTS & SUBSCRIPTIONS                             │
│  ├── Get Razorpay Config                                        │
│  ├── Create Order                                               │
│  ├── Verify Payment                                             │
│  └── Create Subscription → Get SUBSCRIPTION_ID                  │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 12: REVIEWS & RATINGS                                    │
│  ├── Submit Review → Get REVIEW_ID                              │
│  ├── Get Driver Rating                                          │
│  └── Update/Delete Review                                       │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 13: NOTIFICATIONS                                        │
│  ├── Get All Notifications                                      │
│  ├── Get Unread Count                                           │
│  └── Mark All as Read                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Data Quick Reference

### Phone Numbers (Use these consistently)

| Role                      | Phone       | OTP    |
| ------------------------- | ----------- | ------ |
| Parent 1 (John Doe)       | +1234567890 | 123456 |
| Parent 2 (Sarah Williams) | +1234567891 | 123456 |
| Driver 1 (Jane Smith)     | +1234567893 | 123456 |
| Driver 2 (Mike Johnson)   | +1234567894 | 123456 |

### Location Coordinates

| Entity        | Latitude | Longitude | Location             |
| ------------- | -------- | --------- | -------------------- |
| Parent 1 Home | 40.7128  | -74.0060  | Manhattan, NYC       |
| Driver 1 Home | 40.7200  | -74.0100  | Lower East Side, NYC |
| School 1      | 40.7589  | -73.9851  | Midtown, NYC         |
| Parent 2 Home | 34.0522  | -118.2437 | Downtown LA          |

### Admin Credentials

```
Email: admin@pingparent.com
Password: Admin@123456
```

### School Admin Credentials

```
Email: principal@springfield.edu
Password: SchoolAdmin@123
```

---

## Troubleshooting Common Issues

### 1. "Authentication required" Error

- Ensure you have the correct token in the Authorization header
- Check if the token has expired
- Verify you're using the correct token for the user type (PARENT_TOKEN vs DRIVER_TOKEN)

### 2. "Validation error" for Address

- Ensure latitude and longitude are provided
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180

### 3. "Driver not approved" Error

- Admin must approve the driver before they can accept assignments
- Run Phase 5.7 (Admin Approves Driver)

### 4. "Student not found" Error

- Verify the student_id exists
- Ensure the student belongs to the authenticated parent

### 5. "Trip not found" Error

- Verify the trip_id is correct
- Ensure the trip date is valid (not in the past for new trips)

### 6. "OTP expired or invalid"

- OTP is valid for 5-10 minutes
- Generate a new OTP and try again
- In development, OTP is typically `123456`

---

## Next Steps After E2E Testing

1. ✅ All endpoints return expected responses
2. ✅ Data relationships are correct (parent → students → assignments → trips)
3. ✅ Authentication flows work correctly
4. ✅ Location data is properly stored and retrieved
5. ✅ OTP verification works for pickup/drop

**Ready for Frontend Integration!**

---

**Document End**

For questions: dev-team@pingparent.com
