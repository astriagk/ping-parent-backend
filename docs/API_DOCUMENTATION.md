# Ping Parent Backend - API Documentation

Complete API reference with request payloads, response formats, and error messages.

**Base URL**: `http://localhost:3000/api`

---

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
  - [Get Roles](#get-roles)
  - [Phone Registration (2-Step)](#phone-based-registration-2-step-process)
  - [Phone Login (2-Step)](#phone-based-login-2-step-process)
  - [Verify Token](#verify-token)
  - [Logout](#logout)
- [Parent Endpoints](#parent-endpoints)
  - [Get Profile](#get-parent-profile)
  - [Update Profile](#update-parent-profile)
  - [Get Address](#get-parent-address)
  - [Update Address](#update-parent-address)
- [Driver Endpoints](#driver-endpoints)
  - [Get Driver Profile](#get-driver-profile)
  - [Create Driver Profile](#create-driver-profile)
  - [Update Driver Profile](#update-driver-profile)
  - [Upload/Update Driver Documents](#uploadupdate-driver-documents)
- [School Endpoints](#school-endpoints)
  - [Create School](#create-school)
  - [Get All Schools](#get-all-schools)
  - [Get School by ID](#get-school-by-id)
  - [Update School](#update-school)
  - [Delete School](#delete-school)
- [Student Endpoints](#student-endpoints)
  - [Create Student](#create-student)
  - [Get My Students](#get-my-students)
  - [Get My Active Students](#get-my-active-students)
  - [Get Student by ID](#get-student-by-id)
  - [Get Student by Student ID](#get-student-by-student-id)
  - [Update Student](#update-student)
  - [Update Student by Student ID](#update-student-by-student-id)
  - [Delete Student](#delete-student-soft-delete)
  - [Delete Student by Student ID](#delete-student-by-student-id-soft-delete)
- [Driver-Student Assignment Endpoints](#driver-student-assignment-endpoints)
  - [Create Assignment](#create-driver-student-assignment)
  - [Get Assignment by ID](#get-assignment-by-id)
  - [Get My Assignments](#get-my-assignments-driver)
  - [Get My Active Assignments](#get-my-active-assignments-driver)
  - [Get My Pending Assignments](#get-my-pending-assignments-driver)
  - [Get Assignments by Student](#get-assignments-by-student)
  - [Update Assignment](#update-driver-student-assignment)
  - [Approve Assignment](#approve-driver-student-assignment)
  - [Reject Assignment](#reject-driver-student-assignment)
  - [Deactivate Assignment](#deactivate-driver-student-assignment)
  - [Delete Assignment](#delete-driver-student-assignment)
- [Trip Endpoints](#trip-endpoints)
  - [Create Trip](#create-trip)
  - [Get My Trips](#get-my-trips)
  - [Get My Trips by Date](#get-my-trips-by-date)
  - [Get My Active Trips](#get-my-active-trips)
  - [Get Trip by ID](#get-trip-by-id)
  - [Update Trip](#update-trip)
  - [Update Trip Status](#update-trip-status)
  - [Delete Trip](#delete-trip)
- [Trip Student Endpoints](#trip-student-endpoints)
  - [Get Trip Student by ID](#get-trip-student-by-id)
  - [Get Trip Students by Trip](#get-trip-students-by-trip)
  - [Get Trip Students by Student](#get-trip-students-by-student)
  - [Get Trip Student by Trip and Student](#get-trip-student-by-trip-and-student)
  - [Get Trip Students by Attendance Status](#get-trip-students-by-attendance-status)
  - [Get Trip Students by Pickup Status](#get-trip-students-by-pickup-status)
  - [Mark Student Attendance](#mark-student-attendance)
  - [Record Student Pickup](#record-student-pickup)
  - [Record Student Drop](#record-student-drop)
  - [Update Trip Student Record](#update-trip-student-record)
- [Daily QR/OTP Endpoints](#daily-qrotp-endpoints)
  - [Generate QR Code and OTP](#generate-qr-code-and-otp)
  - [Get QR/OTP by Student and Trip](#get-qrotp-by-student-and-trip)
  - [Verify QR Code or OTP](#verify-qr-code-or-otp)
- [Notification Endpoints](#notification-endpoints)
  - [Get All Notifications](#get-all-notifications)
  - [Get Unread Notifications](#get-unread-notifications)
  - [Get Unread Count](#get-unread-count)
  - [Mark Notification as Read](#mark-notification-as-read)
  - [Mark All Notifications as Read](#mark-all-notifications-as-read)
- [Subscription Plan Endpoints](#subscription-plan-endpoints)
  - [Get All Subscription Plans](#get-all-subscription-plans)
  - [Get Subscription Plan by ID](#get-subscription-plan-by-id)
- [Parent Subscription Endpoints](#parent-subscription-endpoints)
  - [Create Parent Subscription](#create-parent-subscription)
  - [Get My Subscriptions](#get-my-subscriptions)
  - [Get My Active Subscription](#get-my-active-subscription)
  - [Get Subscription by ID](#get-subscription-by-id)
  - [Update Subscription](#update-subscription)
  - [Cancel Subscription](#cancel-subscription)
  - [Delete Subscription](#delete-subscription)
- [Payment Endpoints](#payment-endpoints)
  - [Create Payment](#create-payment)
  - [Get My Payments](#get-my-payments)
  - [Get My Pending Payments](#get-my-pending-payments)
  - [Get My Completed Payments](#get-my-completed-payments)
  - [Get Payment by ID](#get-payment-by-id)
  - [Update Payment](#update-payment)
  - [Complete Payment](#complete-payment)
  - [Refund Payment](#refund-payment)

---

## Authentication Endpoints

### Get Roles

Retrieves list of available user roles.

**Endpoint**: `GET /api/auth/roles`

**Authentication**: Not required

**Request**:

```http
GET /api/auth/roles
```

**Success Response** (200):

```json
{
  "success": true,
  "data": ["parent", "driver", "admin"]
}
```

**Error Responses**:

| Status | Error Message             |
| ------ | ------------------------- |
| 500    | `"Failed to fetch roles"` |

**Example**:

```json
{
  "success": false,
  "error": "Failed to fetch roles"
}
```

---

### Phone-Based Registration (2-Step Process)

#### Step 1: Send OTP

Send OTP to phone number for registration.

**Endpoint**: `POST /api/auth/register/send-otp`

**Authentication**: Not required

**Request Payload**:

```json
{
  "phone": "+1234567890",
  "role": "parent"
}
```

**Required Fields**:

- `phone` (string): Valid phone number (10-15 digits)
- `role` (string): Must be `"parent"` or `"driver"`

**Success Response** (200):

```json
{
  "success": true,
  "message": "OTP sent to phone number",
  "otp": "123456"
}
```

> Note: `otp` field is only included in development mode

**Error Responses**:

| Status | Error Message                       |
| ------ | ----------------------------------- |
| 400    | `"Phone number is required"`        |
| 400    | `"Invalid phone number"`            |
| 409    | `"Phone number already registered"` |

---

#### Step 2: Verify OTP

Verify the OTP sent to phone number and complete registration.

**Endpoint**: `POST /api/auth/register/verify-otp`

**Authentication**: Not required

**Request Payload**:

```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Required Fields**:

- `phone` (string): Phone number used in Step 1
- `otp` (string): 6-digit OTP code

**Success Response** (200):

```json
{
  "success": true,
  "message": "Phone number verified successfully. Registration complete.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "V1StGXR8_Z5jdHi6B",
      "phone_number": "+1234567890",
      "user_type": "parent",
      "is_active": true
    }
  }
}
```

**Error Responses**:

| Status | Error Message                         |
| ------ | ------------------------------------- |
| 400    | `"Phone number and OTP are required"` |
| 400    | `"Invalid phone number"`              |
| 400    | `"Invalid or expired OTP"`            |

---

### Phone-Based Login (2-Step Process)

#### Step 1: Send Login OTP

Send OTP to registered phone number for login.

**Endpoint**: `POST /api/auth/login/send-otp`

**Authentication**: Not required

**Request Payload**:

```json
{
  "phone": "+1234567890"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Login OTP sent to phone number",
  "otp": "123456"
}
```

> Note: `otp` field is only included in development mode

**Error Responses**:

| Status | Error Message                   |
| ------ | ------------------------------- |
| 400    | `"Phone number is required"`    |
| 400    | `"Invalid phone number"`        |
| 404    | `"Phone number not registered"` |

---

#### Step 2: Verify Login OTP

Verify OTP and complete login.

**Endpoint**: `POST /api/auth/login/verify-otp`

**Authentication**: Not required

**Request Payload**:

```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "parent@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "parent",
      "phone": "+1234567890"
    }
  },
  "message": "Login successful"
}
```

**Error Responses**:

| Status | Error Message                                   |
| ------ | ----------------------------------------------- |
| 400    | `"Phone number and OTP are required for login"` |
| 400    | `"Invalid phone number"`                        |
| 400    | `"Invalid or expired OTP"`                      |
| 404    | `"User not found"`                              |

---

### Verify Token

Verify if the current JWT token is valid.

**Endpoint**: `GET /api/auth/verify-token`

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Optional Headers** (for token refresh):

```http
x-refresh-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "parent@example.com",
    "role": "parent",
    "tokenValid": true
  }
}
```

**Success Response with Token Refresh** (200):

```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "parent@example.com",
    "role": "parent",
    "tokenValid": true,
    "newToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:

| Status | Error Message                      |
| ------ | ---------------------------------- |
| 401    | `"Missing Authorization header"`   |
| 401    | `"Malformed Authorization header"` |
| 401    | `"User not found"`                 |
| 401    | `"Token expired"`                  |
| 401    | `"Invalid token"`                  |
| 401    | `"Invalid refresh token"`          |

---

### Logout

Logout the current user.

**Endpoint**: `POST /api/auth/logout`

**Authentication**: Required

**Request Headers**:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses**:

| Status | Error Message    |
| ------ | ---------------- |
| 500    | `"Server error"` |

---

## Parent Endpoints

All parent endpoints require authentication via JWT token in the `Authorization` header.

**Request Headers**:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Get Parent Profile

Retrieve the authenticated parent's profile.

**Endpoint**: `GET /api/parent/profile`

**Authentication**: Required (Parent role)

**Request**:

```http
GET /api/parent/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "parent@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "parent",
    "emailVerified": true,
    "phoneVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

> Note: `passwordHash` and `verificationToken` are excluded from response

**Error Responses**:

| Status | Error Message                      |
| ------ | ---------------------------------- |
| 401    | `"User not authenticated"`         |
| 404    | `"Parent profile not found"`       |
| 500    | `"Failed to fetch parent profile"` |

---

### Update Parent Profile

Update the authenticated parent's profile information.

**Endpoint**: `PUT /api/parent/profile`

**Authentication**: Required (Parent role)

**Request Payload**:

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com",
  "phone": "+9876543210"
}
```

**Updatable Fields**:

- `firstName` (string)
- `lastName` (string)
- `email` (string): Valid email address
- `phone` (string): Valid phone number
- Any other user profile fields (except `_id`, `passwordHash`, `verificationToken`)

> Note: You can update any combination of fields. All fields are optional.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "newemail@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+9876543210",
    "role": "parent",
    "emailVerified": true,
    "phoneVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-21T09:15:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

**Error Responses**:

| Status | Error Message                                   |
| ------ | ----------------------------------------------- |
| 400    | `"No updates provided"`                         |
| 401    | `"User not authenticated"`                      |
| 404    | `"Parent profile not found or no changes made"` |
| 500    | `"Failed to update parent profile"`             |

---

### Get Parent Address

Retrieve the authenticated parent's address.

**Endpoint**: `GET /api/parent/address`

**Authentication**: Required (Parent role)

**Request**:

```http
GET /api/parent/address
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860ea",
    "userId": "507f1f77bcf86cd799439011",
    "street": "123 Main Street",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "coordinates": {
      "lat": 39.7817,
      "lng": -89.6501
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

**Error Responses**:

| Status | Error Message               |
| ------ | --------------------------- |
| 401    | `"User not authenticated"`  |
| 404    | `"Address not found"`       |
| 500    | `"Failed to fetch address"` |

---

### Update Parent Address

Update or create the authenticated parent's address.

**Endpoint**: `PUT /api/parent/address`

**Authentication**: Required (Parent role)

**Request Payload**:

```json
{
  "street": "456 Oak Avenue",
  "city": "Chicago",
  "state": "IL",
  "zipCode": "60601",
  "coordinates": {
    "lat": 41.8781,
    "lng": -87.6298
  }
}
```

**Required Fields**:

- `street` (string)
- `city` (string)
- `state` (string)
- `zipCode` (string)

**Optional Fields**:

- `coordinates` (object):
  - `lat` (number): Latitude
  - `lng` (number): Longitude

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860ea",
    "userId": "507f1f77bcf86cd799439011",
    "street": "456 Oak Avenue",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "coordinates": {
      "lat": 41.8781,
      "lng": -87.6298
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-21T09:20:00.000Z"
  },
  "message": "Address updated successfully"
}
```

**Error Responses**:

| Status | Error Message                                     |
| ------ | ------------------------------------------------- |
| 400    | `"Street, city, state, and zipCode are required"` |
| 401    | `"User not authenticated"`                        |
| 500    | `"Failed to update address"`                      |

---

## Driver Endpoints

All driver endpoints require authentication via JWT token with driver role in the `Authorization` header.

**Request Headers**:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Note**: Driver data is now normalized across three separate tables:
> - `drivers`: Basic profile and vehicle information
> - `driver_addresses`: Driver home address (separate table)
> - `driver_documents`: License and insurance documents (separate table)

---

### Get Driver Profile

Retrieve the authenticated driver's profile (basic information and vehicle details only).

**Endpoint**: `GET /api/driver/profile`

**Authentication**: Required (Driver role)

**Request**:

```http
GET /api/driver/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "driver_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "driver_unique_id": "DRV12345",
    "name": "John Driver",
    "email": "driver@example.com",
    "photo_url": "https://example.com/photo.jpg",
    "vehicle_type": "van",
    "vehicle_number": "ABC-1234",
    "vehicle_capacity": 6,
    "current_student_count": 3,
    "approval_status": "approved",
    "is_available": true,
    "rating": 4.75,
    "total_trips": 142,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z",
    "user": {
      "phone_number": "+1234567890",
      "user_type": "driver",
      "is_active": true,
      "fcm_token": "fcm_token_here",
      "last_login": "2024-01-20T14:45:00.000Z"
    }
  }
}
```

**Error Responses**:

| Status | Error Message                            |
| ------ | ---------------------------------------- |
| 401    | `"User not authenticated"`               |
| 403    | `"Access denied. Driver role required."` |
| 404    | `"Driver profile not found"`             |
| 500    | `"Failed to fetch driver profile"`       |

---

### Create Driver Profile

Create a new driver profile (typically during registration). Only creates basic profile - use separate endpoints for address and documents.

**Endpoint**: `POST /api/driver/profile`

**Authentication**: Required (Driver role)

**Request Payload**:

```json
{
  "name": "John Driver",
  "email": "driver@example.com",
  "photo_url": "https://example.com/photo.jpg",
  "vehicle_type": "van",
  "vehicle_number": "ABC-1234",
  "vehicle_capacity": 6,
  "is_available": true
}
```

**Required Fields**:

- `name` (string): Driver's full name
- `vehicle_type` (string): Must be one of: `"van"`, `"auto"`, `"bus"`
- `vehicle_number` (string): Vehicle plate number
- `vehicle_capacity` (number): Number of students the vehicle can carry (must be > 0)

**Optional Fields**:

- `email` (string): Driver's email address
- `photo_url` (string): URL to driver's photo
- `is_available` (boolean): Driver availability status (defaults to `true`)

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "driver_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "driver_unique_id": "DRV12345",
    "name": "John Driver",
    "email": "driver@example.com",
    "photo_url": "https://example.com/photo.jpg",
    "vehicle_type": "van",
    "vehicle_number": "ABC-1234",
    "vehicle_capacity": 6,
    "current_student_count": 0,
    "approval_status": "pending",
    "is_available": true,
    "rating": 0.0,
    "total_trips": 0,
    "created_at": "2024-01-20T14:45:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  },
  "message": "Driver profile created successfully"
}
```

> Note: A unique `driver_unique_id` (format: DRVxxxxx) is automatically generated for parent search functionality

**Error Responses**:

| Status | Error Message                                  |
| ------ | ---------------------------------------------- |
| 400    | `"Required fields are missing"`                |
| 400    | `"Vehicle type must be van, auto, or bus"`     |
| 400    | `"Vehicle capacity must be a positive number"` |
| 401    | `"User not authenticated"`                     |
| 403    | `"Access denied. Driver role required."`       |
| 500    | `"Failed to create driver profile"`            |

---

### Update Driver Profile

Update the authenticated driver's profile information.

**Endpoint**: `PUT /api/driver/profile`

**Authentication**: Required (Driver role)

**Request Payload**:

```json
{
  "name": "John Updated Driver",
  "email": "newemail@example.com",
  "photo_url": "https://example.com/new-photo.jpg",
  "vehicle_type": "bus",
  "vehicle_number": "XYZ-5678",
  "vehicle_capacity": 12,
  "is_available": false
}
```

**Updatable Fields**:

- `name` (string)
- `email` (string)
- `photo_url` (string)
- `vehicle_type` (string): Must be `"van"`, `"auto"`, or `"bus"`
- `vehicle_number` (string)
- `vehicle_capacity` (number): Must be > 0
- `is_available` (boolean)

> Note: You can update any combination of fields. All fields are optional.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "driver_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "driver_unique_id": "DRV12345",
    "name": "John Updated Driver",
    "email": "newemail@example.com",
    "photo_url": "https://example.com/new-photo.jpg",
    "vehicle_type": "bus",
    "vehicle_number": "XYZ-5678",
    "vehicle_capacity": 12,
    "is_available": false,
    "updated_at": "2024-01-21T09:15:00.000Z"
  },
  "message": "Driver profile updated successfully"
}
```

**Error Responses**:

| Status | Error Message                                  |
| ------ | ---------------------------------------------- |
| 400    | `"No updates provided"`                        |
| 400    | `"Vehicle type must be van, auto, or bus"`     |
| 400    | `"Vehicle capacity must be a positive number"` |
| 401    | `"User not authenticated"`                     |
| 403    | `"Access denied. Driver role required."`       |
| 404    | `"Driver profile not found"`                   |
| 500    | `"Failed to update driver profile"`            |

---

### Get Driver Address

Retrieve the authenticated driver's primary home address.

**Endpoint**: `GET /api/driver/address`

**Authentication**: Required (Driver role)

**Request**:

```http
GET /api/driver/address
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "address_id": "507f1f77bcf86cd799439013",
    "driver_id": "507f1f77bcf86cd799439011",
    "address_line1": "123 Main St",
    "address_line2": "Apt 4B",
    "city": "Springfield",
    "state": "Illinois",
    "pincode": "62701",
    "latitude": 39.7817,
    "longitude": -89.6501,
    "is_primary": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  }
}
```

**Error Responses**:

| Status | Error Message                            |
| ------ | ---------------------------------------- |
| 401    | `"User not authenticated"`               |
| 403    | `"Access denied. Driver role required."` |
| 404    | `"Driver address not found"`             |
| 500    | `"Failed to fetch driver address"`       |

---

### Create/Update Driver Address

Create or update the authenticated driver's primary home address (upsert operation).

**Endpoint**: `POST /api/driver/address`

**Authentication**: Required (Driver role)

**Request Payload**:

```json
{
  "address_line1": "456 Oak Avenue",
  "address_line2": "Suite 200",
  "city": "Chicago",
  "state": "Illinois",
  "pincode": "60601",
  "latitude": 41.8781,
  "longitude": -87.6298,
  "is_primary": true
}
```

**Required Fields**:

- `address_line1` (string): Primary address line
- `city` (string): City name
- `state` (string): State name
- `latitude` (number): Latitude coordinate
- `longitude` (number): Longitude coordinate

**Optional Fields**:

- `address_line2` (string): Secondary address line (apartment, suite, etc.)
- `pincode` (string): Postal/ZIP code
- `is_primary` (boolean): Whether this is the primary address (defaults to `true`)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "address_id": "507f1f77bcf86cd799439013",
    "driver_id": "507f1f77bcf86cd799439011",
    "address_line1": "456 Oak Avenue",
    "address_line2": "Suite 200",
    "city": "Chicago",
    "state": "Illinois",
    "pincode": "60601",
    "latitude": 41.8781,
    "longitude": -87.6298,
    "is_primary": true,
    "updated_at": "2024-01-21T11:20:00.000Z"
  },
  "message": "Driver address updated successfully"
}
```

**Error Responses**:

| Status | Error Message                                                              |
| ------ | -------------------------------------------------------------------------- |
| 400    | `"Required fields are missing"`                                            |
| 400    | `"Latitude and longitude are required and must be valid numbers"`          |
| 401    | `"User not authenticated"`                                                 |
| 403    | `"Access denied. Driver role required."`                                   |
| 500    | `"Failed to update driver address"`                                        |

---

### Get Driver Documents

Retrieve the authenticated driver's license and insurance documents.

**Endpoint**: `GET /api/driver/documents`

**Authentication**: Required (Driver role)

**Request**:

```http
GET /api/driver/documents
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "document_id": "507f1f77bcf86cd799439014",
    "driver_id": "507f1f77bcf86cd799439011",
    "driving_license_number": "DL123456789",
    "driving_license_photo_url": "https://example.com/dl.jpg",
    "vehicle_license_number": "VL987654321",
    "vehicle_license_photo_url": "https://example.com/vl.jpg",
    "insurance_number": "INS123456",
    "insurance_photo_url": "https://example.com/ins.jpg",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  }
}
```

**Error Responses**:

| Status | Error Message                            |
| ------ | ---------------------------------------- |
| 401    | `"User not authenticated"`               |
| 403    | `"Access denied. Driver role required."` |
| 404    | `"Driver documents not found"`           |
| 500    | `"Failed to fetch driver documents"`     |

---

### Create/Update Driver Documents (Full)

Create or fully update driver and vehicle documents (upsert operation).

**Endpoint**: `POST /api/driver/documents`

**Authentication**: Required (Driver role)

**Request Payload**:

```json
{
  "driving_license_number": "DL987654321",
  "driving_license_photo_url": "https://example.com/new-dl.jpg",
  "vehicle_license_number": "VL123456789",
  "vehicle_license_photo_url": "https://example.com/new-vl.jpg",
  "insurance_number": "INS987654",
  "insurance_photo_url": "https://example.com/new-ins.jpg"
}
```

**Required Fields**:

- `driving_license_number` (string): Driving license number
- `vehicle_license_number` (string): Vehicle registration number

**Optional Fields**:

- `driving_license_photo_url` (string): URL to driving license photo
- `vehicle_license_photo_url` (string): URL to vehicle license photo
- `insurance_number` (string): Insurance policy number
- `insurance_photo_url` (string): URL to insurance document photo

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "document_id": "507f1f77bcf86cd799439014",
    "driver_id": "507f1f77bcf86cd799439011",
    "driving_license_number": "DL987654321",
    "driving_license_photo_url": "https://example.com/new-dl.jpg",
    "vehicle_license_number": "VL123456789",
    "vehicle_license_photo_url": "https://example.com/new-vl.jpg",
    "insurance_number": "INS987654",
    "insurance_photo_url": "https://example.com/new-ins.jpg",
    "updated_at": "2024-01-21T10:30:00.000Z"
  },
  "message": "Driver documents updated successfully"
}
```

**Error Responses**:

| Status | Error Message                            |
| ------ | ---------------------------------------- |
| 400    | `"Required fields are missing"`          |
| 401    | `"User not authenticated"`               |
| 403    | `"Access denied. Driver role required."` |
| 500    | `"Failed to update driver documents"`    |

---

### Update Driver Documents (Partial)

Partially update specific driver document fields.

**Endpoint**: `PUT /api/driver/documents`

**Authentication**: Required (Driver role)

**Request Payload**:

```json
{
  "driving_license_photo_url": "https://example.com/updated-dl.jpg",
  "insurance_number": "INS999888"
}
```

**Updatable Fields**:

- `driving_license_number` (string)
- `driving_license_photo_url` (string)
- `vehicle_license_number` (string)
- `vehicle_license_photo_url` (string)
- `insurance_number` (string)
- `insurance_photo_url` (string)

> Note: You can update any combination of document fields. All fields are optional.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "document_id": "507f1f77bcf86cd799439014",
    "driver_id": "507f1f77bcf86cd799439011",
    "driving_license_number": "DL987654321",
    "driving_license_photo_url": "https://example.com/updated-dl.jpg",
    "vehicle_license_number": "VL123456789",
    "vehicle_license_photo_url": "https://example.com/new-vl.jpg",
    "insurance_number": "INS999888",
    "insurance_photo_url": "https://example.com/new-ins.jpg",
    "updated_at": "2024-01-21T12:15:00.000Z"
  },
  "message": "Driver documents updated successfully"
}
```

**Error Responses**:

| Status | Error Message                            |
| ------ | ---------------------------------------- |
| 400    | `"No updates provided"`                  |
| 401    | `"User not authenticated"`               |
| 403    | `"Access denied. Driver role required."` |
| 500    | `"Failed to update driver documents"`    |

---

## Common Error Response Format

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Some errors include an error code:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message describing what went wrong"
  }
}
```

---

## HTTP Status Codes

| Status Code | Description                                         |
| ----------- | --------------------------------------------------- |
| 200         | OK - Request successful                             |
| 201         | Created - Resource created successfully             |
| 400         | Bad Request - Invalid request payload or parameters |
| 401         | Unauthorized - Authentication required or failed    |
| 404         | Not Found - Resource not found                      |
| 409         | Conflict - Resource already exists                  |
| 500         | Internal Server Error - Server error occurred       |

---

## Authentication

Most endpoints require a JWT token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are obtained through:

- Phone-based registration (`/api/auth/register/verify-otp`)
- Phone-based login (`/api/auth/login/verify-otp`)

Tokens expire based on the `JWT_EXPIRES_IN` environment variable (default: 7 days).

---

## Development Mode Features

In development mode (`NODE_ENV=development`), some endpoints include additional debugging information:

- OTP codes are returned in the response for phone-based authentication
- More detailed error messages may be logged to console

**Important**: These features are disabled in production for security.

---

## Rate Limiting

Authentication endpoints (`/api/auth/login/send-otp`, `/api/auth/login/verify-otp`, `/api/auth/register/send-otp`, `/api/auth/register/verify-otp`) have rate limiting enabled to prevent brute-force attacks and abuse.

---

## School Endpoints

All school endpoints require authentication via JWT token in the `Authorization` header.

**Request Headers**:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Create School

Create a new school record.

**Endpoint**: `POST /api/schools`

**Authentication**: Required

**Request Payload**:

```json
{
  "school_name": "Springfield Elementary School",
  "address": "742 Evergreen Terrace, Springfield",
  "city": "Springfield",
  "state": "Illinois",
  "latitude": 39.7817,
  "longitude": -89.6501,
  "contact_number": "+1234567890",
  "email": "admin@springfield-school.edu"
}
```

**Required Fields**:

- `school_name` (string): School name (3-200 characters)
- `address` (string): Full address (max 255 characters)
- `city` (string): City name (max 100 characters)
- `state` (string): State name (max 100 characters)
- `latitude` (number): Latitude coordinate (-90 to 90)
- `longitude` (number): Longitude coordinate (-180 to 180)

**Optional Fields**:

- `contact_number` (string): School contact number (10-15 digits)
- `email` (string): School email address

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "school_id": "W2TuHYS9_A6keIj7C",
    "school_name": "Springfield Elementary School",
    "address": "742 Evergreen Terrace, Springfield",
    "city": "Springfield",
    "state": "Illinois",
    "latitude": 39.7817,
    "longitude": -89.6501,
    "contact_number": "+1234567890",
    "email": "admin@springfield-school.edu",
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z"
  },
  "message": "School created successfully"
}
```

> Note: A unique `school_id` (format: nanoid) is automatically generated

**Error Responses**:

| Status | Error Message                                                           |
| ------ | ----------------------------------------------------------------------- |
| 400    | Validation errors (e.g., `"School name must be between 3-200 characters"`) |
| 401    | `"User not authenticated"`                                              |
| 500    | `"Failed to create school"`                                             |

---

### Get All Schools

Retrieve all schools, with optional filtering by city, state, or search query.

**Endpoint**: `GET /api/schools`

**Authentication**: Required

**Query Parameters** (all optional):

- `city` (string): Filter schools by city name
- `state` (string): Filter schools by state name
- `search` (string): Search schools by name (partial match)

**Request Examples**:

```http
GET /api/schools
GET /api/schools?city=Springfield
GET /api/schools?state=Illinois
GET /api/schools?search=elementary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "school_id": "W2TuHYS9_A6keIj7C",
      "school_name": "Springfield Elementary School",
      "address": "742 Evergreen Terrace, Springfield",
      "city": "Springfield",
      "state": "Illinois",
      "latitude": 39.7817,
      "longitude": -89.6501,
      "contact_number": "+1234567890",
      "email": "admin@springfield-school.edu",
      "created_at": "2024-01-20T10:30:00.000Z",
      "updated_at": "2024-01-20T10:30:00.000Z"
    },
    {
      "school_id": "X3UvIZT0_B7lfJk8D",
      "school_name": "Springfield High School",
      "address": "500 Main Street, Springfield",
      "city": "Springfield",
      "state": "Illinois",
      "latitude": 39.7920,
      "longitude": -89.6440,
      "contact_number": "+1234567891",
      "email": "info@springfield-high.edu",
      "created_at": "2024-01-15T08:20:00.000Z",
      "updated_at": "2024-01-15T08:20:00.000Z"
    }
  ],
  "message": "Schools list fetched successfully"
}
```

**Error Responses**:

| Status | Error Message                  |
| ------ | ------------------------------ |
| 401    | `"User not authenticated"`     |
| 500    | `"Failed to fetch schools"`    |

---

### Get School by ID

Retrieve a specific school by its ID.

**Endpoint**: `GET /api/schools/:school_id`

**Authentication**: Required

**URL Parameters**:

- `school_id` (string): School ID

**Request**:

```http
GET /api/schools/W2TuHYS9_A6keIj7C
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "school_id": "W2TuHYS9_A6keIj7C",
    "school_name": "Springfield Elementary School",
    "address": "742 Evergreen Terrace, Springfield",
    "city": "Springfield",
    "state": "Illinois",
    "latitude": 39.7817,
    "longitude": -89.6501,
    "contact_number": "+1234567890",
    "email": "admin@springfield-school.edu",
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z"
  },
  "message": "School fetched successfully"
}
```

**Error Responses**:

| Status | Error Message              |
| ------ | -------------------------- |
| 401    | `"User not authenticated"` |
| 404    | `"School not found"`       |
| 500    | `"Failed to fetch school"` |

---

### Update School

Update a school's information by ID.

**Endpoint**: `PUT /api/schools/:school_id`

**Authentication**: Required

**URL Parameters**:

- `school_id` (string): School ID

**Request Payload**:

```json
{
  "school_name": "Springfield Elementary & Middle School",
  "contact_number": "+1234567899",
  "email": "contact@springfield-school.edu"
}
```

**Updatable Fields**:

- `school_name` (string): 3-200 characters
- `address` (string): Max 255 characters
- `city` (string): Max 100 characters
- `state` (string): Max 100 characters
- `latitude` (number): -90 to 90
- `longitude` (number): -180 to 180
- `contact_number` (string): 10-15 digits
- `email` (string): Valid email address

> Note: All fields are optional. Update any combination of fields.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "school_id": "W2TuHYS9_A6keIj7C",
    "school_name": "Springfield Elementary & Middle School",
    "address": "742 Evergreen Terrace, Springfield",
    "city": "Springfield",
    "state": "Illinois",
    "latitude": 39.7817,
    "longitude": -89.6501,
    "contact_number": "+1234567899",
    "email": "contact@springfield-school.edu",
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-21T14:45:00.000Z"
  },
  "message": "School updated successfully"
}
```

**Error Responses**:

| Status | Error Message                                                             |
| ------ | ------------------------------------------------------------------------- |
| 400    | Validation errors (e.g., `"School name must be between 3-200 characters"`) |
| 401    | `"User not authenticated"`                                                |
| 404    | `"School not found"`                                                      |
| 500    | `"Failed to update school"`                                               |

---

### Delete School

Delete a school by ID.

**Endpoint**: `DELETE /api/schools/:school_id`

**Authentication**: Required

**URL Parameters**:

- `school_id` (string): School ID

**Request**:

```http
DELETE /api/schools/W2TuHYS9_A6keIj7C
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "School deleted successfully"
}
```

> Note: This permanently deletes the school record from the database.

**Error Responses**:

| Status | Error Message              |
| ------ | -------------------------- |
| 401    | `"User not authenticated"` |
| 404    | `"School not found"`       |
| 500    | `"Failed to delete school"` |

---

## Student Endpoints

All student endpoints require parent authentication via JWT token in the `Authorization` header.

**Request Headers**:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Create Student

Create a new student record for the authenticated parent.

**Endpoint**: `POST /api/students`

**Authentication**: Required (Parent role)

**Request Payload**:

```json
{
  "school_id": "school_xyz789",
  "student_name": "Emma Johnson",
  "class": "5th",
  "section": "A",
  "roll_number": "25",
  "photo_url": "https://example.com/students/emma.jpg",
  "date_of_birth": "2015-06-15",
  "gender": "female",
  "pickup_address_id": "addr_def456",
  "emergency_contact": "+1234567890",
  "medical_info": "Allergic to peanuts"
}
```

> **Note**: `parent_id` is automatically derived from the authenticated user's JWT token. Do not include it in the request body.

**Required Fields**:

- `school_id` (string): School's ID
- `student_name` (string): Student's full name (2-100 characters)
- `class` (string): Class/grade (max 20 characters)
- `pickup_address_id` (string): Address ID for pickup location

**Optional Fields**:

- `section` (string): Section/division (max 10 characters)
- `roll_number` (string): Roll number (max 20 characters)
- `photo_url` (string): URL to student's photo
- `date_of_birth` (date): Student's date of birth
- `gender` (string): Must be `"male"`, `"female"`, or `"other"`
- `emergency_contact` (string): Emergency contact number (10-15 digits)
- `medical_info` (string): Medical information/notes (max 500 characters)

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "student_id": "stu_abc123xyz",
    "parent_id": "parent_abc123",
    "school_id": "school_xyz789",
    "student_name": "Emma Johnson",
    "class": "5th",
    "section": "A",
    "roll_number": "25",
    "photo_url": "https://example.com/students/emma.jpg",
    "date_of_birth": "2015-06-15T00:00:00.000Z",
    "gender": "female",
    "pickup_address_id": "addr_def456",
    "emergency_contact": "+1234567890",
    "medical_info": "Allergic to peanuts",
    "is_active": true,
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z"
  },
  "message": "Student created successfully"
}
```

> Note: A unique `student_id` (format: nanoid) is automatically generated

**Error Responses**:

| Status | Error Message                                                                              |
| ------ | ------------------------------------------------------------------------------------------ |
| 400    | `"Student name is required"` / `"Parent ID is required"` / Other validation errors         |
| 401    | `"User not authenticated"`                                                                 |
| 409    | `"A student with the same name, school, and class already exists for this parent"`         |
| 500    | `"Failed to create student"`                                                               |

**Example Duplicate Error**:

```json
{
  "success": false,
  "error": "A student with the same name, school, and class already exists for this parent"
}
```

---

### Get My Students

Retrieve all students (active and inactive) for the authenticated parent.

**Endpoint**: `GET /api/students/my-students`

**Authentication**: Required (Parent role)

**Request**:

```http
GET /api/students/my-students
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "student_id": "stu_abc123xyz",
      "parent_id": "parent_abc123",
      "school_id": "school_xyz789",
      "student_name": "Emma Johnson",
      "class": "5th",
      "section": "A",
      "roll_number": "25",
      "is_active": true,
      "created_at": "2024-01-20T10:30:00.000Z",
      "updated_at": "2024-01-20T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "student_id": "stu_def456uvw",
      "parent_id": "parent_abc123",
      "school_id": "school_xyz789",
      "student_name": "Oliver Johnson",
      "class": "3rd",
      "section": "B",
      "is_active": true,
      "created_at": "2024-01-15T08:20:00.000Z",
      "updated_at": "2024-01-15T08:20:00.000Z"
    }
  ],
  "message": "Students list fetched successfully"
}
```

**Error Responses**:

| Status | Error Message                  |
| ------ | ------------------------------ |
| 401    | `"User not authenticated"`     |
| 500    | `"Failed to fetch students"`   |

---

### Get My Active Students

Retrieve only active students for the authenticated parent.

**Endpoint**: `GET /api/students/my-active-students`

**Authentication**: Required (Parent role)

**Request**:

```http
GET /api/students/my-active-students
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "student_id": "stu_abc123xyz",
      "parent_id": "parent_abc123",
      "school_id": "school_xyz789",
      "student_name": "Emma Johnson",
      "class": "5th",
      "is_active": true,
      "created_at": "2024-01-20T10:30:00.000Z"
    }
  ],
  "message": "Students list fetched successfully"
}
```

> Note: Only returns students where `is_active: true`

**Error Responses**:

| Status | Error Message                  |
| ------ | ------------------------------ |
| 401    | `"User not authenticated"`     |
| 500    | `"Failed to fetch students"`   |

---

### Get Student by ID

Retrieve a specific student by MongoDB `_id`.

**Endpoint**: `GET /api/students/:id`

**Authentication**: Required (Parent role)

**URL Parameters**:

- `id` (string): MongoDB ObjectId of the student

**Request**:

```http
GET /api/students/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "student_id": "stu_abc123xyz",
    "parent_id": "parent_abc123",
    "school_id": "school_xyz789",
    "student_name": "Emma Johnson",
    "class": "5th",
    "section": "A",
    "roll_number": "25",
    "photo_url": "https://example.com/students/emma.jpg",
    "date_of_birth": "2015-06-15T00:00:00.000Z",
    "gender": "female",
    "pickup_address_id": "addr_def456",
    "emergency_contact": "+1234567890",
    "medical_info": "Allergic to peanuts",
    "is_active": true,
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z"
  },
  "message": "Student fetched successfully"
}
```

**Error Responses**:

| Status | Error Message              |
| ------ | -------------------------- |
| 401    | `"User not authenticated"` |
| 404    | `"Student not found"`      |
| 500    | `"Failed to fetch student"`|

---

### Get Student by Student ID

Retrieve a specific student by `student_id` (nanoid).

**Endpoint**: `GET /api/students/by-student-id/:student_id`

**Authentication**: Required (Parent role)

**URL Parameters**:

- `student_id` (string): The unique student_id generated during creation

**Request**:

```http
GET /api/students/by-student-id/stu_abc123xyz
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "student_id": "stu_abc123xyz",
    "parent_id": "parent_abc123",
    "student_name": "Emma Johnson",
    "class": "5th",
    "is_active": true,
    "created_at": "2024-01-20T10:30:00.000Z"
  },
  "message": "Student fetched successfully"
}
```

**Error Responses**:

| Status | Error Message              |
| ------ | -------------------------- |
| 401    | `"User not authenticated"` |
| 404    | `"Student not found"`      |
| 500    | `"Failed to fetch student"`|

---

### Update Student

Update a student's information by MongoDB `_id`.

**Endpoint**: `PUT /api/students/:id`

**Authentication**: Required (Parent role)

**URL Parameters**:

- `id` (string): MongoDB ObjectId of the student

**Request Payload**:

```json
{
  "student_name": "Emma Jane Johnson",
  "class": "6th",
  "section": "B",
  "roll_number": "12",
  "photo_url": "https://example.com/students/emma-updated.jpg",
  "emergency_contact": "+9876543210"
}
```

**Updatable Fields**:

- `student_name` (string): 2-100 characters
- `class` (string): Max 20 characters
- `section` (string): Max 10 characters
- `roll_number` (string): Max 20 characters
- `photo_url` (string): Valid URL
- `date_of_birth` (date)
- `gender` (string): `"male"`, `"female"`, or `"other"`
- `pickup_address_id` (string)
- `emergency_contact` (string): 10-15 digits
- `medical_info` (string): Max 500 characters

> Note: All fields are optional. Update any combination of fields.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "student_id": "stu_abc123xyz",
    "parent_id": "parent_abc123",
    "school_id": "school_xyz789",
    "student_name": "Emma Jane Johnson",
    "class": "6th",
    "section": "B",
    "roll_number": "12",
    "is_active": true,
    "updated_at": "2024-01-21T14:45:00.000Z"
  },
  "message": "Student updated successfully"
}
```

**Error Responses**:

| Status | Error Message                                                                              |
| ------ | ------------------------------------------------------------------------------------------ |
| 401    | `"User not authenticated"`                                                                 |
| 404    | `"Student not found"`                                                                      |
| 409    | `"A student with the same name, school, and class already exists for this parent"`         |
| 500    | `"Failed to update student"`                                                               |

> Note: Duplicate checking is performed if updating `student_name`, `school_id`, `class`, or `parent_id`

---

### Update Student by Student ID

Update a student's information by `student_id`.

**Endpoint**: `PUT /api/students/by-student-id/:student_id`

**Authentication**: Required (Parent role)

**URL Parameters**:

- `student_id` (string): The unique student_id

**Request Payload**:

```json
{
  "class": "6th",
  "section": "A"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "student_id": "stu_abc123xyz",
    "student_name": "Emma Johnson",
    "class": "6th",
    "section": "A",
    "updated_at": "2024-01-21T15:30:00.000Z"
  },
  "message": "Student updated successfully"
}
```

**Error Responses**: Same as Update Student by ID

---

### Delete Student (Soft Delete)

Soft delete a student by setting `is_active: false`. Does not permanently remove the record.

**Endpoint**: `DELETE /api/students/:id`

**Authentication**: Required (Parent role)

**URL Parameters**:

- `id` (string): MongoDB ObjectId of the student

**Request**:

```http
DELETE /api/students/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

> Note: This is a soft delete. The record is marked as `is_active: false` but remains in the database.

**Error Responses**:

| Status | Error Message              |
| ------ | -------------------------- |
| 401    | `"User not authenticated"` |
| 404    | `"Student not found"`      |
| 500    | `"Failed to delete student"`|

---

### Delete Student by Student ID (Soft Delete)

Soft delete a student by `student_id`.

**Endpoint**: `DELETE /api/students/by-student-id/:student_id`

**Authentication**: Required (Parent role)

**URL Parameters**:

- `student_id` (string): The unique student_id

**Request**:

```http
DELETE /api/students/by-student-id/stu_abc123xyz
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

**Error Responses**: Same as Delete Student by ID

---

## Driver-Student Assignment Endpoints

### Create Driver-Student Assignment

Create a new driver-student assignment. Can be used by:
- **Driver**: To add a student to their assignment list (status: `pending`)
- **Parent**: To request assignment from a driver using `driver_unique_id` (status: `parent_requested`)

**Endpoint**: `POST /api/driver-student-assignments`

**Authentication**: Required (Driver or Parent role)

**Request Payload**:

```json
{
  "student_id": "507f1f77bcf86cd799439014",
  "driver_unique_id": "DRV123456",
  "monthly_fee": 5000.00,
  "assigned_date": "2024-01-20",
  "start_date": "2024-02-01",
  "end_date": "2024-12-31"
}
```

**Required Fields**:

- `student_id` (string): Student's MongoDB ObjectId
- `driver_unique_id` (string): Driver's unique identifier (for parent requests) or current driver's ID
- `assigned_date` (string): Date when assignment was created (ISO 8601 date format)

**Optional Fields**:

- `monthly_fee` (number): Monthly fee for the service
- `assignment_status` (string): Status - `active`, `inactive`, `pending`, `parent_requested` (auto-set based on role)
- `start_date` (string): Assignment start date (ISO 8601 date format)
- `end_date` (string): Assignment end date (ISO 8601 date format)

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "assignment_id": "DSAx7Y3m9Pq",
    "driver_id": "507f1f77bcf86cd799439011",
    "student_id": "507f1f77bcf86cd799439014",
    "driver_unique_id": "DRV123456",
    "monthly_fee": 5000.00,
    "assignment_status": "pending",
    "assigned_date": "2024-01-20T00:00:00.000Z",
    "start_date": "2024-02-01T00:00:00.000Z",
    "end_date": "2024-12-31T00:00:00.000Z",
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-20T10:30:00.000Z"
  },
  "message": "Driver-student assignment created successfully"
}
```

**Error Responses**:

| Status | Error Message                                                                 |
| ------ | ----------------------------------------------------------------------------- |
| 400    | `"End date must be after start date"`                                         |
| 401    | `"User not authenticated"`                                                    |
| 404    | `"Driver profile not found"` / `"Driver not found"`                           |
| 409    | `"An assignment for this driver and student combination already exists"`      |

---

### Get Assignment by ID

Retrieve a specific driver-student assignment by ID.

**Endpoint**: `GET /api/driver-student-assignments/:id`

**Authentication**: Required

**URL Parameters**:

- `id` (string): Assignment's MongoDB ObjectId

**Request**:

```http
GET /api/driver-student-assignments/507f1f77bcf86cd799439015
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "assignment_id": "DSAx7Y3m9Pq",
    "driver_id": "507f1f77bcf86cd799439011",
    "student_id": "507f1f77bcf86cd799439014",
    "driver_unique_id": "DRV123456",
    "monthly_fee": 5000.00,
    "assignment_status": "active",
    "assigned_date": "2024-01-20T00:00:00.000Z",
    "start_date": "2024-02-01T00:00:00.000Z",
    "created_at": "2024-01-20T10:30:00.000Z",
    "updated_at": "2024-01-21T09:15:00.000Z"
  },
  "message": "Driver-student assignment fetched successfully"
}
```

**Error Responses**:

| Status | Error Message                            |
| ------ | ---------------------------------------- |
| 401    | `"User not authenticated"`               |
| 404    | `"Driver-student assignment not found"`  |

---

### Get My Assignments (Driver)

Get all assignments for the authenticated driver.

**Endpoint**: `GET /api/driver-student-assignments/driver/my-assignments`

**Authentication**: Required (Driver role)

**Request**:

```http
GET /api/driver-student-assignments/driver/my-assignments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "assignment_id": "DSAx7Y3m9Pq",
      "driver_id": "507f1f77bcf86cd799439011",
      "student_id": "507f1f77bcf86cd799439014",
      "driver_unique_id": "DRV123456",
      "monthly_fee": 5000.00,
      "assignment_status": "active",
      "assigned_date": "2024-01-20T00:00:00.000Z",
      "start_date": "2024-02-01T00:00:00.000Z",
      "created_at": "2024-01-20T10:30:00.000Z",
      "updated_at": "2024-01-21T09:15:00.000Z"
    }
  ],
  "message": "Driver-student assignments list fetched successfully"
}
```

**Error Responses**:

| Status | Error Message                       |
| ------ | ----------------------------------- |
| 401    | `"User not authenticated"`          |
| 403    | `"Access denied. Driver role required."` |
| 404    | `"Driver profile not found"`        |

---

### Get My Active Assignments (Driver)

Get active assignments for the authenticated driver.

**Endpoint**: `GET /api/driver-student-assignments/driver/my-active-assignments`

**Authentication**: Required (Driver role)

**Success Response**: Same as [Get My Assignments](#get-my-assignments-driver)

---

### Get My Pending Assignments (Driver)

Get pending assignments (awaiting driver approval) for the authenticated driver.

**Endpoint**: `GET /api/driver-student-assignments/driver/my-pending-assignments`

**Authentication**: Required (Driver role)

**Success Response**: Same as [Get My Assignments](#get-my-assignments-driver)

---

### Get Assignments by Student

Get all assignments for a specific student.

**Endpoint**: `GET /api/driver-student-assignments/student/:studentId`

**Authentication**: Required

**URL Parameters**:

- `studentId` (string): Student's MongoDB ObjectId

**Request**:

```http
GET /api/driver-student-assignments/student/507f1f77bcf86cd799439014
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "assignment_id": "DSAx7Y3m9Pq",
      "driver_id": "507f1f77bcf86cd799439011",
      "student_id": "507f1f77bcf86cd799439014",
      "driver_unique_id": "DRV123456",
      "monthly_fee": 5000.00,
      "assignment_status": "active",
      "assigned_date": "2024-01-20T00:00:00.000Z",
      "start_date": "2024-02-01T00:00:00.000Z",
      "created_at": "2024-01-20T10:30:00.000Z"
    }
  ],
  "message": "Driver-student assignments list fetched successfully"
}
```

---

### Update Driver-Student Assignment

Update an existing driver-student assignment.

**Endpoint**: `PUT /api/driver-student-assignments/:id`

**Authentication**: Required

**URL Parameters**:

- `id` (string): Assignment's MongoDB ObjectId

**Request Payload**:

```json
{
  "monthly_fee": 5500.00,
  "assignment_status": "active",
  "start_date": "2024-02-01",
  "end_date": "2024-12-31"
}
```

**Optional Fields** (all fields are optional for update):

- `monthly_fee` (number): Updated monthly fee
- `assignment_status` (string): Updated status
- `start_date` (string): Updated start date
- `end_date` (string): Updated end date

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "assignment_id": "DSAx7Y3m9Pq",
    "driver_id": "507f1f77bcf86cd799439011",
    "student_id": "507f1f77bcf86cd799439014",
    "driver_unique_id": "DRV123456",
    "monthly_fee": 5500.00,
    "assignment_status": "active",
    "assigned_date": "2024-01-20T00:00:00.000Z",
    "start_date": "2024-02-01T00:00:00.000Z",
    "end_date": "2024-12-31T00:00:00.000Z",
    "updated_at": "2024-01-22T14:30:00.000Z"
  },
  "message": "Driver-student assignment updated successfully"
}
```

**Error Responses**:

| Status | Error Message                            |
| ------ | ---------------------------------------- |
| 400    | `"End date must be after start date"`    |
| 401    | `"User not authenticated"`               |
| 404    | `"Driver-student assignment not found"`  |

---

### Approve Driver-Student Assignment

Approve a parent-requested assignment (driver only).

**Endpoint**: `POST /api/driver-student-assignments/:id/approve`

**Authentication**: Required (Driver role)

**URL Parameters**:

- `id` (string): Assignment's MongoDB ObjectId

**Request**:

```http
POST /api/driver-student-assignments/507f1f77bcf86cd799439015/approve
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "assignment_id": "DSAx7Y3m9Pq",
    "assignment_status": "active",
    "start_date": "2024-01-22T14:30:00.000Z",
    "updated_at": "2024-01-22T14:30:00.000Z"
  },
  "message": "Assignment approved successfully"
}
```

**Error Responses**:

| Status | Error Message                                   |
| ------ | ----------------------------------------------- |
| 400    | `"Only pending assignments can be approved"`    |
| 401    | `"User not authenticated"`                      |
| 403    | `"Forbidden"` (if driver doesn't own assignment)|
| 404    | `"Driver-student assignment not found"`         |

---

### Reject Driver-Student Assignment

Reject a pending or parent-requested assignment (driver only).

**Endpoint**: `POST /api/driver-student-assignments/:id/reject`

**Authentication**: Required (Driver role)

**URL Parameters**:

- `id` (string): Assignment's MongoDB ObjectId

**Request**:

```http
POST /api/driver-student-assignments/507f1f77bcf86cd799439015/reject
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "assignment_id": "DSAx7Y3m9Pq",
    "assignment_status": "rejected",
    "updated_at": "2024-01-22T14:30:00.000Z"
  },
  "message": "Assignment rejected successfully"
}
```

**Error Responses**:

| Status | Error Message                                                      |
| ------ | ------------------------------------------------------------------ |
| 400    | `"Only pending or parent-requested assignments can be rejected"`   |
| 401    | `"User not authenticated"`                                         |
| 403    | `"Forbidden"` (if driver doesn't own assignment)                   |
| 404    | `"Driver-student assignment not found"`                            |

---

### Deactivate Driver-Student Assignment

Deactivate an assignment (sets status to `inactive` and records end_date).

**Endpoint**: `POST /api/driver-student-assignments/:id/deactivate`

**Authentication**: Required (Driver role)

**URL Parameters**:

- `id` (string): Assignment's MongoDB ObjectId

**Request**:

```http
POST /api/driver-student-assignments/507f1f77bcf86cd799439015/deactivate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "assignment_status": "inactive",
    "end_date": "2024-01-22T14:30:00.000Z",
    "updated_at": "2024-01-22T14:30:00.000Z"
  },
  "message": "Assignment deactivated successfully"
}
```

**Error Responses**: Same as Approve Assignment

---

### Delete Driver-Student Assignment

Soft delete an assignment (sets status to `inactive` and records end_date).

**Endpoint**: `DELETE /api/driver-student-assignments/:id`

**Authentication**: Required

**URL Parameters**:

- `id` (string): Assignment's MongoDB ObjectId

**Request**:

```http
DELETE /api/driver-student-assignments/507f1f77bcf86cd799439015
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Driver-student assignment deleted successfully"
}
```

> Note: This is a soft delete. The assignment is marked as `inactive` but remains in the database.

**Error Responses**:

| Status | Error Message                           |
| ------ | --------------------------------------- |
| 401    | `"User not authenticated"`              |
| 404    | `"Driver-student assignment not found"` |

---

## Trip Endpoints

### Create Trip

Create a new trip for the authenticated driver.

**Endpoint**: `POST /api/trips`

**Authentication**: Required (Driver role)

**Note**: `driver_id` is automatically derived from the authenticated driver's user ID.

**Request Payload**:

```json
{
  "school_id": "507f1f77bcf86cd799439011",
  "trip_type": "pickup",
  "trip_date": "2024-01-22T00:00:00.000Z"
}
```

**Required Fields**:

- `school_id` (string): School's MongoDB ObjectId
- `trip_type` (string): Must be `"pickup"` or `"drop"`
- `trip_date` (string): Trip date in ISO 8601 format

> **Important**: The following fields are automatically managed by the system and should NOT be included in the request:
> - `driver_id`: Automatically derived from authenticated driver
> - `trip_status`: Automatically set to `'scheduled'` on creation
> - `start_time` and `end_time`: Managed automatically by status transitions
> - `total_distance`: System-calculated from route data
> - `optimized_route_data`: System-calculated based on student locations

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "trip_id": "TRPa2B9k4Lm",
    "driver_id": "507f1f77bcf86cd799439012",
    "school_id": "507f1f77bcf86cd799439011",
    "trip_type": "pickup",
    "trip_date": "2024-01-22T00:00:00.000Z",
    "trip_status": "scheduled",
    "start_time": null,
    "end_time": null,
    "total_distance": null,
    "optimized_route_data": null,
    "created_at": "2024-01-22T10:00:00.000Z",
    "updated_at": "2024-01-22T10:00:00.000Z"
  },
  "message": "Trip created successfully"
}
```

**Error Responses**:

| Status | Error Message                                                          |
| ------ | ---------------------------------------------------------------------- |
| 400    | `"Validation error"` (missing required fields)                         |
| 401    | `"User not authenticated"`                                             |
| 404    | `"Driver profile not found"`                                           |
| 409    | `"A trip for this driver, school, type, and date already exists"`      |

---

### Get My Trips

Get all trips for the authenticated driver.

**Endpoint**: `GET /api/trips/my-trips`

**Authentication**: Required (Driver role)

**Request**:

```http
GET /api/trips/my-trips
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "trip_id": "TRPa2B9k4Lm",
      "driver_id": "507f1f77bcf86cd799439012",
      "school_id": "507f1f77bcf86cd799439011",
      "trip_type": "pickup",
      "trip_date": "2024-01-22T00:00:00.000Z",
      "trip_status": "scheduled",
      "created_at": "2024-01-22T10:00:00.000Z",
      "updated_at": "2024-01-22T10:00:00.000Z"
    }
  ],
  "message": "Trips list fetched successfully"
}
```

**Error Responses**:

| Status | Error Message                    |
| ------ | -------------------------------- |
| 401    | `"User not authenticated"`       |
| 404    | `"Driver profile not found"`     |

---

### Get My Trips by Date

Get all trips for the authenticated driver on a specific date.

**Endpoint**: `GET /api/trips/my-trips/by-date?date=YYYY-MM-DD`

**Authentication**: Required (Driver role)

**Query Parameters**:

- `date` (string, required): Date in ISO format (e.g., "2024-01-22")

**Request**:

```http
GET /api/trips/my-trips/by-date?date=2024-01-22
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "trip_id": "TRPa2B9k4Lm",
      "driver_id": "507f1f77bcf86cd799439012",
      "school_id": "507f1f77bcf86cd799439011",
      "trip_type": "pickup",
      "trip_date": "2024-01-22T00:00:00.000Z",
      "trip_status": "scheduled",
      "created_at": "2024-01-22T10:00:00.000Z",
      "updated_at": "2024-01-22T10:00:00.000Z"
    }
  ],
  "message": "Trips list fetched successfully"
}
```

**Error Responses**:

| Status | Error Message                    |
| ------ | -------------------------------- |
| 400    | `"Trip date is required"`        |
| 401    | `"User not authenticated"`       |
| 404    | `"Driver profile not found"`     |

---

### Get My Active Trips

Get all active trips (scheduled, started, or in_progress) for the authenticated driver.

**Endpoint**: `GET /api/trips/my-trips/active`

**Authentication**: Required (Driver role)

**Request**:

```http
GET /api/trips/my-trips/active
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "trip_id": "TRPa2B9k4Lm",
      "driver_id": "507f1f77bcf86cd799439012",
      "school_id": "507f1f77bcf86cd799439011",
      "trip_type": "pickup",
      "trip_date": "2024-01-22T00:00:00.000Z",
      "trip_status": "started",
      "start_time": "2024-01-22T08:00:00.000Z",
      "created_at": "2024-01-22T10:00:00.000Z",
      "updated_at": "2024-01-22T10:00:00.000Z"
    }
  ],
  "message": "Trips list fetched successfully"
}
```

**Error Responses**:

| Status | Error Message                    |
| ------ | -------------------------------- |
| 401    | `"User not authenticated"`       |
| 404    | `"Driver profile not found"`     |

---

### Get Trip by ID

Get a specific trip by its MongoDB ObjectId.

**Endpoint**: `GET /api/trips/:id`

**Authentication**: Required (Driver role)

**URL Parameters**:

- `id` (string): Trip's MongoDB ObjectId

**Request**:

```http
GET /api/trips/507f1f77bcf86cd799439013
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "trip_id": "TRPa2B9k4Lm",
    "driver_id": "507f1f77bcf86cd799439012",
    "school_id": "507f1f77bcf86cd799439011",
    "trip_type": "pickup",
    "trip_date": "2024-01-22T00:00:00.000Z",
    "trip_status": "scheduled",
    "created_at": "2024-01-22T10:00:00.000Z",
    "updated_at": "2024-01-22T10:00:00.000Z"
  }
}
```

**Error Responses**:

| Status | Error Message                    |
| ------ | -------------------------------- |
| 401    | `"User not authenticated"`       |
| 404    | `"Trip not found"`               |

---

### Update Trip

Update trip information by MongoDB ObjectId.

**Endpoint**: `PUT /api/trips/:id`

**Authentication**: Required (Driver role)

**URL Parameters**:

- `id` (string): Trip's MongoDB ObjectId

**Request Payload**:

```json
{
  "school_id": "507f1f77bcf86cd799439011",
  "trip_type": "drop",
  "trip_date": "2024-01-23T00:00:00.000Z"
}
```

**Updatable Fields**:

- `school_id` (string): Updated school ID
- `trip_type` (string): Must be `"pickup"` or `"drop"`
- `trip_date` (string): Updated trip date

> **Important**: The following fields are NOT updatable via this endpoint:
> - `trip_status`: Use `PATCH /api/trips/:id/status` endpoint instead
> - `start_time` and `end_time`: Managed automatically by status transitions
> - `total_distance`: System-calculated from route data
> - `optimized_route_data`: System-calculated based on student locations

> Note: All fields are optional. Update any combination of fields.

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "trip_id": "TRPa2B9k4Lm",
    "driver_id": "507f1f77bcf86cd799439012",
    "school_id": "507f1f77bcf86cd799439011",
    "trip_type": "drop",
    "trip_date": "2024-01-23T00:00:00.000Z",
    "trip_status": "scheduled",
    "start_time": null,
    "end_time": null,
    "total_distance": null,
    "optimized_route_data": null,
    "created_at": "2024-01-22T10:00:00.000Z",
    "updated_at": "2024-01-22T11:00:00.000Z"
  },
  "message": "Trip updated successfully"
}
```

**Error Responses**:

| Status | Error Message                                                          |
| ------ | ---------------------------------------------------------------------- |
| 400    | `"Cannot update a completed trip"`                                     |
| 401    | `"User not authenticated"`                                             |
| 404    | `"Trip not found"`                                                     |
| 409    | `"A trip for this driver, school, type, and date already exists"`      |

---

### Update Trip Status

Update the status of a trip with automatic timestamp management.

**Endpoint**: `PATCH /api/trips/:id/status`

**Authentication**: Required (Driver role)

**URL Parameters**:

- `id` (string): Trip's MongoDB ObjectId

**Request**:

```http
PATCH /api/trips/507f1f77bcf86cd799439013/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

```json
{
  "trip_status": "started"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "trip_id": "TRPa2B9k4Lm",
    "driver_id": "507f1f77bcf86cd799439012",
    "school_id": "507f1f77bcf86cd799439011",
    "trip_type": "pickup",
    "trip_date": "2024-01-22T00:00:00.000Z",
    "trip_status": "started",
    "start_time": "2024-01-22T08:00:00.000Z",
    "created_at": "2024-01-22T10:00:00.000Z",
    "updated_at": "2024-01-22T11:00:00.000Z"
  },
  "message": "Trip status updated successfully"
}
```

**Valid Status Transitions**:

- `scheduled` → `started`, `cancelled`
- `started` → `in_progress`, `cancelled`
- `in_progress` → `completed`, `cancelled`
- `completed` → (no transitions allowed)
- `cancelled` → (no transitions allowed)

**Error Responses**:

| Status | Error Message                          |
| ------ | -------------------------------------- |
| 400    | `"Invalid trip status transition"`     |
| 401    | `"User not authenticated"`             |
| 404    | `"Trip not found"`                     |

---

### Delete Trip

Hard delete a trip by MongoDB ObjectId.

**Endpoint**: `DELETE /api/trips/:id`

**Authentication**: Required (Driver role)

**URL Parameters**:

- `id` (string): Trip's MongoDB ObjectId

**Request**:

```http
DELETE /api/trips/507f1f77bcf86cd799439013
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

**Error Responses**:

| Status | Error Message                    |
| ------ | -------------------------------- |
| 401    | `"User not authenticated"`       |
| 404    | `"Trip not found"`               |

---


## Trip Student Endpoints

Trip student endpoints manage attendance tracking, pickup/drop recording, and student-trip relationships. These endpoints are primarily used by drivers during trips.

### Get Trip Student by ID

**Endpoint**: `GET /api/trip-students/:id`  
**Authentication**: Required (Driver)

Get a specific trip student record by MongoDB ObjectId.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "trip_student_id": "TPSa2B9k4Lm",
    "trip_id": "TRPx7Y3m9Pq",
    "student_id": "STUz5W2n8Ks",
    "attendance_status": "present",
    "pickup_status": "picked"
  },
  "message": "Trip student record fetched successfully"
}
```

---

### Get Trip Students by Trip

**Endpoint**: `GET /api/trip-students/trip/:tripId?ordered=true`  
**Authentication**: Required (Driver)

Get all students for a trip, optionally ordered by pickup sequence.

---

### Mark Student Attendance

**Endpoint**: `PUT /api/trip-students/trip/:tripId/student/:studentId/attendance`  
**Authentication**: Required (Driver)

Mark student attendance (present/absent/pending).

**Request Body**:
```json
{
  "attendance_status": "present",
  "notes": "Student present at pickup"
}
```

---

### Record Student Pickup

**Endpoint**: `PUT /api/trip-students/trip/:tripId/student/:studentId/pickup`  
**Authentication**: Required (Driver)

Record when driver picks up student.

**Request Body**:
```json
{
  "pickup_latitude": 40.7128,
  "pickup_longitude": -74.0060,
  "notes": "Picked up on time"
}
```

---

### Record Student Drop

**Endpoint**: `PUT /api/trip-students/trip/:tripId/student/:studentId/drop`  
**Authentication**: Required (Driver)

Record when driver drops off student.

---

## Daily QR/OTP Endpoints

Daily QR/OTP endpoints manage the generation and verification of daily QR codes and OTP codes for student trips. These codes are used for secure student identification during pickup and drop-off.

### Generate QR Code and OTP

**Endpoint**: `POST /api/daily-qr-otp/generate`
**Authentication**: Required

Generate a QR code and OTP for a student's trip. Each student-trip combination can only have one active QR/OTP.

**Request Body**:
```json
{
  "student_id": "STUz5W2n8Ks",
  "trip_id": "TRPx7Y3m9Pq",
  "trip_type": "pickup"
}
```

**Validation Rules**:
- `student_id`: Required, must be a valid student ID
- `trip_id`: Required, must be a valid trip ID
- `trip_type`: Required, must be either "pickup" or "drop"

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "qr_otp_id": "DQOa3B5k7Lm9Pq2Rs4Tv6Wx8Yz1Ab3Cd",
    "student_id": "STUz5W2n8Ks",
    "trip_id": "TRPx7Y3m9Pq",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "otp_code": "123456",
    "trip_type": "pickup",
    "valid_from": "2025-12-29T10:00:00.000Z",
    "valid_until": "2025-12-30T10:00:00.000Z",
    "is_used": false,
    "created_at": "2025-12-29T10:00:00.000Z"
  },
  "message": "QR code and OTP generated successfully"
}
```

**Error Responses**:

- **409 Conflict** - QR/OTP already exists for this trip and student:
```json
{
  "success": false,
  "message": "QR code/OTP already generated for this trip and student"
}
```

- **400 Bad Request** - Validation error:
```json
{
  "success": false,
  "message": "Student ID is required"
}
```

---

### Get QR/OTP by Student and Trip

**Endpoint**: `GET /api/daily-qr-otp/student/:studentId/trip/:tripId`
**Authentication**: Required

Retrieve the QR code and OTP for a specific student and trip combination.

**URL Parameters**:
- `studentId`: Student ID (e.g., "STUz5W2n8Ks")
- `tripId`: Trip ID (e.g., "TRPx7Y3m9Pq")

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "qr_otp_id": "DQOa3B5k7Lm9Pq2Rs4Tv6Wx8Yz1Ab3Cd",
    "student_id": "STUz5W2n8Ks",
    "trip_id": "TRPx7Y3m9Pq",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "otp_code": "123456",
    "trip_type": "pickup",
    "valid_from": "2025-12-29T10:00:00.000Z",
    "valid_until": "2025-12-30T10:00:00.000Z",
    "is_used": false,
    "created_at": "2025-12-29T10:00:00.000Z"
  },
  "message": "QR code/OTP fetched successfully"
}
```

**Error Responses**:

- **404 Not Found** - QR/OTP not found:
```json
{
  "success": false,
  "message": "QR code/OTP not found"
}
```

---

### Verify QR Code or OTP

**Endpoint**: `POST /api/daily-qr-otp/verify`
**Authentication**: Required

Verify a QR code or OTP. Either `qr_code` or `otp_code` must be provided (not both required). The code will be marked as used after successful verification.

**Request Body**:
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

OR

```json
{
  "otp_code": "123456"
}
```

**Validation Rules**:
- Either `qr_code` OR `otp_code` must be provided
- `qr_code`: Maximum 255 characters
- `otp_code`: Must be exactly 6 digits

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "qr_otp_id": "DQOa3B5k7Lm9Pq2Rs4Tv6Wx8Yz1Ab3Cd",
    "student_id": "STUz5W2n8Ks",
    "trip_id": "TRPx7Y3m9Pq",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "otp_code": "123456",
    "trip_type": "pickup",
    "valid_from": "2025-12-29T10:00:00.000Z",
    "valid_until": "2025-12-30T10:00:00.000Z",
    "is_used": true,
    "used_at": "2025-12-29T12:30:00.000Z",
    "created_at": "2025-12-29T10:00:00.000Z"
  },
  "message": "QR code/OTP verified successfully"
}
```

**Error Responses**:

- **404 Not Found** - Invalid QR code or OTP:
```json
{
  "success": false,
  "message": "Invalid QR code or OTP"
}
```

- **400 Bad Request** - QR/OTP already used:
```json
{
  "success": false,
  "message": "QR code/OTP has already been used"
}
```

- **400 Bad Request** - QR/OTP expired:
```json
{
  "success": false,
  "message": "QR code/OTP has expired"
}
```

- **400 Bad Request** - QR/OTP not valid yet:
```json
{
  "success": false,
  "message": "QR code/OTP is not valid yet"
}
```

- **400 Bad Request** - Neither provided:
```json
{
  "success": false,
  "message": "Either QR code or OTP is required"
}
```

---


## Notification Endpoints

### Get All Notifications

Retrieves all notifications for the authenticated user.

**Endpoint**: `GET /api/notifications`

**Authentication**: Required (Any user type - Parent/Driver)

**Request**:

```http
GET /api/notifications
Authorization: Bearer <token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "notification_id": "notif_abc123",
      "user_id": "user_123",
      "notification_type": "pickup_started",
      "title": "Trip Started",
      "message": "Your driver has started the pickup trip",
      "data": {
        "trip_id": "trip_123",
        "driver_name": "John Doe"
      },
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "notification_id": "notif_abc124",
      "user_id": "user_123",
      "notification_type": "general",
      "title": "System Notification",
      "message": "Welcome to Ping Parent!",
      "is_read": true,
      "read_at": "2024-01-15T11:00:00Z",
      "created_at": "2024-01-15T09:00:00Z"
    }
  ],
  "message": "Notifications fetched successfully"
}
```

**Error Responses**:

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### Get Unread Notifications

Retrieves only unread notifications for the authenticated user.

**Endpoint**: `GET /api/notifications/unread`

**Authentication**: Required (Any user type - Parent/Driver)

**Request**:

```http
GET /api/notifications/unread
Authorization: Bearer <token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "notification_id": "notif_abc123",
      "user_id": "user_123",
      "notification_type": "pickup_started",
      "title": "Trip Started",
      "message": "Your driver has started the pickup trip",
      "data": {
        "trip_id": "trip_123",
        "driver_name": "John Doe"
      },
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Notifications fetched successfully"
}
```

**Error Responses**:

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### Get Unread Count

Retrieves the count of unread notifications for the authenticated user.

**Endpoint**: `GET /api/notifications/unread-count`

**Authentication**: Required (Any user type - Parent/Driver)

**Request**:

```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "unread_count": 5
  }
}
```

**Error Responses**:

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### Mark Notification as Read

Marks a specific notification as read.

**Endpoint**: `PUT /api/notifications/:id/mark-as-read`

**Authentication**: Required (Any user type - Parent/Driver)

**Request**:

```http
PUT /api/notifications/507f1f77bcf86cd799439011/mark-as-read
Authorization: Bearer <token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "notification_id": "notif_abc123",
    "user_id": "user_123",
    "notification_type": "pickup_started",
    "title": "Trip Started",
    "message": "Your driver has started the pickup trip",
    "data": {
      "trip_id": "trip_123",
      "driver_name": "John Doe"
    },
    "is_read": true,
    "read_at": "2024-01-15T11:30:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Notification marked as read successfully"
}
```

**Error Responses**:

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

- **404 Not Found** - Notification not found:
```json
{
  "success": false,
  "error": "Notification not found"
}
```

---

### Mark All Notifications as Read

Marks all unread notifications as read for the authenticated user.

**Endpoint**: `PUT /api/notifications/mark-all-as-read`

**Authentication**: Required (Any user type - Parent/Driver)

**Request**:

```http
PUT /api/notifications/mark-all-as-read
Authorization: Bearer <token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "modified_count": 5
  },
  "message": "Notification marked as read successfully"
}
```

**Error Responses**:

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## Subscription Plan Endpoints

### Get All Subscription Plans

Retrieves all active subscription plans available for purchase.

**Endpoint**: `GET /api/subscription-plans`

**Authentication**: Not required (Public endpoint)

**Request**:

```http
GET /api/subscription-plans
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "plan_id": "SPLa2B9k4Lm",
      "plan_name": "Monthly Basic",
      "plan_type": "monthly",
      "price": 299.99,
      "features": {
        "max_students": 2,
        "live_tracking": true,
        "trip_history": "30_days",
        "notifications": true
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "plan_id": "SPLx7Y3m9Pq",
      "plan_name": "Quarterly Premium",
      "plan_type": "quarterly",
      "price": 799.99,
      "features": {
        "max_students": 5,
        "live_tracking": true,
        "trip_history": "90_days",
        "notifications": true,
        "priority_support": true
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "plan_id": "SPLm5N8p2Qr",
      "plan_name": "Yearly Premium Plus",
      "plan_type": "yearly",
      "price": 2999.99,
      "features": {
        "max_students": "unlimited",
        "live_tracking": true,
        "trip_history": "365_days",
        "notifications": true,
        "priority_support": true,
        "custom_alerts": true
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Subscription plans fetched successfully"
}
```

**Error Responses**:

- **500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Failed to fetch subscription plans"
}
```

---

### Get Subscription Plan by ID

Retrieves a specific subscription plan by its MongoDB ObjectId.

**Endpoint**: `GET /api/subscription-plans/:id`

**Authentication**: Not required (Public endpoint)

**Request**:

```http
GET /api/subscription-plans/507f1f77bcf86cd799439011
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "plan_id": "SPLa2B9k4Lm",
    "plan_name": "Monthly Basic",
    "plan_type": "monthly",
    "price": 299.99,
    "features": {
      "max_students": 2,
      "live_tracking": true,
      "trip_history": "30_days",
      "notifications": true
    },
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Subscription plan fetched successfully"
}
```

**Error Responses**:

- **404 Not Found** - Subscription plan not found:
```json
{
  "success": false,
  "error": "Subscription plan not found"
}
```

- **500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Failed to fetch subscription plans"
}
```

---

## Parent Subscription Endpoints

### Create Parent Subscription

Creates a new subscription for the authenticated parent user.

**Endpoint**: `POST /api/parent-subscriptions`

**Authentication**: Required (Parent only)

**Request Body**:

```json
{
  "plan_id": "507f1f77bcf86cd799439011",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "auto_renew": true
}
```

**Field Descriptions**:
- `plan_id` (string, required): MongoDB ObjectId of the subscription plan
- `start_date` (date, required): Start date of the subscription (YYYY-MM-DD)
- `end_date` (date, required): End date of the subscription (YYYY-MM-DD)
- `auto_renew` (boolean, optional): Whether to automatically renew (default: true)

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "subscription_id": "abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "plan_id": "507f1f77bcf86cd799439011",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z",
    "subscription_status": "active",
    "auto_renew": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Subscription created successfully"
}
```

**Error Responses**:

- **400 Bad Request** - Validation error or invalid date range:
```json
{
  "success": false,
  "error": "End date must be after start date"
}
```

- **401 Unauthorized** - User not authenticated:
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

- **404 Not Found** - Parent profile not found:
```json
{
  "success": false,
  "error": "Parent profile not found"
}
```

- **409 Conflict** - Active subscription already exists:
```json
{
  "success": false,
  "error": "An active subscription already exists for this parent"
}
```

---

### Get My Subscriptions

Retrieves all subscriptions for the authenticated parent user.

**Endpoint**: `GET /api/parent-subscriptions/my-subscriptions`

**Authentication**: Required (Parent only)

**Request**:

```http
GET /api/parent-subscriptions/my-subscriptions
Authorization: Bearer <token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "subscription_id": "abc123xyz",
      "parent_id": "507f1f77bcf86cd799439010",
      "plan_id": "507f1f77bcf86cd799439011",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-01-31T23:59:59Z",
      "subscription_status": "active",
      "auto_renew": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Subscriptions list fetched successfully"
}
```

**Error Responses**:

- **401 Unauthorized** - User not authenticated:
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

- **404 Not Found** - Parent profile not found:
```json
{
  "success": false,
  "error": "Parent profile not found"
}
```

---

### Get My Active Subscription

Retrieves the currently active subscription for the authenticated parent user.

**Endpoint**: `GET /api/parent-subscriptions/my-active-subscription`

**Authentication**: Required (Parent only)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "subscription_id": "abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "plan_id": "507f1f77bcf86cd799439011",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z",
    "subscription_status": "active",
    "auto_renew": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Subscription fetched successfully"
}
```

---

### Get Subscription by ID

Retrieves a specific parent subscription by its MongoDB ObjectId.

**Endpoint**: `GET /api/parent-subscriptions/:id`

**Authentication**: Required (Parent only)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "subscription_id": "abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "plan_id": "507f1f77bcf86cd799439011",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z",
    "subscription_status": "active",
    "auto_renew": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Subscription fetched successfully"
}
```

---

### Update Subscription

Updates an existing parent subscription.

**Endpoint**: `PUT /api/parent-subscriptions/:id`

**Authentication**: Required (Parent only)

**Request Body**:

```json
{
  "subscription_status": "active",
  "auto_renew": false,
  "end_date": "2024-02-28"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "subscription_id": "abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "plan_id": "507f1f77bcf86cd799439011",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-28T23:59:59Z",
    "subscription_status": "active",
    "auto_renew": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Subscription updated successfully"
}
```

---

### Cancel Subscription

Cancels an active parent subscription.

**Endpoint**: `POST /api/parent-subscriptions/:id/cancel`

**Authentication**: Required (Parent only)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "subscription_id": "abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "plan_id": "507f1f77bcf86cd799439011",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z",
    "subscription_status": "cancelled",
    "auto_renew": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Subscription cancelled successfully"
}
```

---

### Delete Subscription

Permanently deletes a parent subscription record.

**Endpoint**: `DELETE /api/parent-subscriptions/:id`

**Authentication**: Required (Parent only)

**Success Response** (200):

```json
{
  "success": true,
  "message": "Subscription deleted successfully"
}
```

**Error Responses**:

- **404 Not Found** - Subscription not found:
```json
{
  "success": false,
  "error": "Parent subscription not found"
}
```

---

## Payment Endpoints

### Create Payment

Creates a new payment record for the authenticated parent user.

**Endpoint**: `POST /api/payments`

**Authentication**: Required (Parent only)

**Request Body**:

```json
{
  "payment_type": "subscription",
  "amount": 599.99,
  "currency": "INR",
  "payment_method": "upi",
  "payment_status": "pending",
  "subscription_id": "507f1f77bcf86cd799439011"
}
```

**Field Descriptions**:
- `payment_type` (string, required): Type of payment - "subscription" or "penalty"
- `amount` (number, required): Payment amount (must be positive)
- `currency` (string, optional): Currency code (default: "INR")
- `payment_method` (string, required): Payment method - "card", "upi", "netbanking", "wallet", or "cash"
- `payment_status` (string, required): Payment status - "pending", "completed", "failed", or "refunded"
- `transaction_id` (string, optional): Gateway transaction ID
- `gateway_response` (object, optional): Response from payment gateway
- `subscription_id` (string, optional): Related subscription ID
- `payment_date` (date, optional): Payment date (defaults to current time)

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "payment_id": "PAY-abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "payment_type": "subscription",
    "amount": 599.99,
    "currency": "INR",
    "payment_method": "upi",
    "payment_status": "pending",
    "subscription_id": "507f1f77bcf86cd799439011",
    "payment_date": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Payment created successfully"
}
```

**Error Responses**:

- **400 Bad Request** - Validation error or invalid amount:
```json
{
  "success": false,
  "error": "Amount must be a positive number"
}
```

- **401 Unauthorized** - User not authenticated:
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

- **404 Not Found** - Parent profile not found:
```json
{
  "success": false,
  "error": "Parent profile not found"
}
```

---

### Get My Payments

Retrieves all payment history for the authenticated parent user.

**Endpoint**: `GET /api/payments/my-payments`

**Authentication**: Required (Parent only)

**Request**:

```http
GET /api/payments/my-payments
Authorization: Bearer <token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "payment_id": "PAY-abc123xyz",
      "parent_id": "507f1f77bcf86cd799439010",
      "payment_type": "subscription",
      "amount": 599.99,
      "currency": "INR",
      "payment_method": "upi",
      "payment_status": "completed",
      "transaction_id": "TXN123456789",
      "subscription_id": "507f1f77bcf86cd799439011",
      "payment_date": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:05:00Z"
    }
  ],
  "message": "Payment history fetched successfully"
}
```

**Error Responses**:

- **401 Unauthorized** - User not authenticated:
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

- **404 Not Found** - Parent profile not found:
```json
{
  "success": false,
  "error": "Parent profile not found"
}
```

---

### Get My Pending Payments

Retrieves all pending payments for the authenticated parent user.

**Endpoint**: `GET /api/payments/my-payments/pending`

**Authentication**: Required (Parent only)

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "payment_id": "PAY-abc123xyz",
      "parent_id": "507f1f77bcf86cd799439010",
      "payment_type": "subscription",
      "amount": 599.99,
      "currency": "INR",
      "payment_method": "upi",
      "payment_status": "pending",
      "payment_date": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Payment history fetched successfully"
}
```

---

### Get My Completed Payments

Retrieves all completed payments for the authenticated parent user.

**Endpoint**: `GET /api/payments/my-payments/completed`

**Authentication**: Required (Parent only)

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "payment_id": "PAY-abc123xyz",
      "parent_id": "507f1f77bcf86cd799439010",
      "payment_type": "subscription",
      "amount": 599.99,
      "currency": "INR",
      "payment_method": "upi",
      "payment_status": "completed",
      "transaction_id": "TXN123456789",
      "payment_date": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:05:00Z"
    }
  ],
  "message": "Payment history fetched successfully"
}
```

---

### Get Payment by ID

Retrieves a specific payment by its MongoDB ObjectId.

**Endpoint**: `GET /api/payments/:id`

**Authentication**: Required (Parent only)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "payment_id": "PAY-abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "payment_type": "subscription",
    "amount": 599.99,
    "currency": "INR",
    "payment_method": "upi",
    "payment_status": "completed",
    "transaction_id": "TXN123456789",
    "gateway_response": {
      "status": "success",
      "message": "Payment processed successfully"
    },
    "subscription_id": "507f1f77bcf86cd799439011",
    "payment_date": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:05:00Z"
  },
  "message": "Payment fetched successfully"
}
```

**Error Responses**:

- **404 Not Found** - Payment not found:
```json
{
  "success": false,
  "error": "Payment not found"
}
```

---

### Update Payment

Updates payment details. Cannot update completed payments.

**Endpoint**: `PUT /api/payments/:id`

**Authentication**: Required (Parent only)

**Request Body**:

```json
{
  "payment_status": "failed",
  "transaction_id": "TXN123456789",
  "gateway_response": {
    "error": "Insufficient funds"
  }
}
```

**Field Descriptions**:
- `payment_status` (string, optional): Payment status - "pending", "completed", "failed", or "refunded"
- `transaction_id` (string, optional): Gateway transaction ID
- `gateway_response` (object, optional): Response from payment gateway

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "payment_id": "PAY-abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "payment_type": "subscription",
    "amount": 599.99,
    "currency": "INR",
    "payment_method": "upi",
    "payment_status": "failed",
    "transaction_id": "TXN123456789",
    "gateway_response": {
      "error": "Insufficient funds"
    },
    "payment_date": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:05:00Z"
  },
  "message": "Payment updated successfully"
}
```

**Error Responses**:

- **400 Bad Request** - Cannot update completed payment:
```json
{
  "success": false,
  "error": "Cannot update a completed payment"
}
```

- **404 Not Found** - Payment not found:
```json
{
  "success": false,
  "error": "Payment not found"
}
```

---

### Complete Payment

Marks a payment as completed with transaction details.

**Endpoint**: `POST /api/payments/:id/complete`

**Authentication**: Required (Parent only)

**Request Body**:

```json
{
  "transaction_id": "TXN123456789",
  "gateway_response": {
    "status": "success",
    "message": "Payment processed successfully"
  }
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "payment_id": "PAY-abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "payment_type": "subscription",
    "amount": 599.99,
    "currency": "INR",
    "payment_method": "upi",
    "payment_status": "completed",
    "transaction_id": "TXN123456789",
    "gateway_response": {
      "status": "success",
      "message": "Payment processed successfully"
    },
    "payment_date": "2024-01-01T00:05:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:05:00Z"
  },
  "message": "Payment completed successfully"
}
```

**Error Responses**:

- **400 Bad Request** - Payment already completed:
```json
{
  "success": false,
  "error": "Payment is already completed"
}
```

- **404 Not Found** - Payment not found:
```json
{
  "success": false,
  "error": "Payment not found"
}
```

---

### Refund Payment

Processes a refund for a payment. Cannot refund pending payments.

**Endpoint**: `POST /api/payments/:id/refund`

**Authentication**: Required (Parent only)

**Request Body**:

```json
{
  "gateway_response": {
    "refund_id": "RFD123456789",
    "status": "refunded"
  }
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "payment_id": "PAY-abc123xyz",
    "parent_id": "507f1f77bcf86cd799439010",
    "payment_type": "subscription",
    "amount": 599.99,
    "currency": "INR",
    "payment_method": "upi",
    "payment_status": "refunded",
    "transaction_id": "TXN123456789",
    "gateway_response": {
      "refund_id": "RFD123456789",
      "status": "refunded"
    },
    "payment_date": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Payment refunded successfully"
}
```

**Error Responses**:

- **400 Bad Request** - Cannot refund pending payment:
```json
{
  "success": false,
  "error": "Cannot refund a pending payment"
}
```

- **400 Bad Request** - Payment already refunded:
```json
{
  "success": false,
  "error": "Payment is already refunded"
}
```

- **404 Not Found** - Payment not found:
```json
{
  "success": false,
  "error": "Payment not found"
}
```

---
