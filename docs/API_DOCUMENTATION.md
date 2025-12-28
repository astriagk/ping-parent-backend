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
