# Ping Parent API Documentation

**Version:** 1.0.0
**Base URL (Local):** `http://localhost:3000/api`
**Base URL (Production):** `https://api.pingparent.com/api`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [Authentication & User Management](#1-authentication--user-management)
   - [Parent APIs](#2-parent-apis)
   - [Driver APIs](#3-driver-apis)
   - [Student APIs](#4-student-apis)
   - [School APIs](#5-school-apis)
   - [Assignment & Trip APIs](#6-assignment--trip-apis)
   - [Attendance & QR/OTP APIs](#7-attendance--qrotp-apis)
   - [Notification APIs](#8-notification-apis)
   - [Subscription & Payment APIs](#9-subscription--payment-apis)
   - [Ratings & Reviews APIs](#10-ratings--reviews-apis)
   - [Support & Audit APIs](#11-support--audit-apis)
   - [Admin Portal APIs](#12-admin-portal-apis)
   - [Role Management](#13-role-management)

---

## Overview

The **Ping Parent API** is a comprehensive school transportation management system that enables:

- Parent and Driver registration and authentication via OTP
- Student management and tracking
- Driver-Student assignment with approval workflows
- Trip creation, management, and real-time tracking
- QR/OTP based attendance system for secure pickup/drop-off
- Real-time push notifications
- Subscription and payment processing
- Driver rating and review system
- Complete admin portal for system management
- Comprehensive audit logging

---

## Authentication

### Authentication Methods

The API uses **JWT (JSON Web Tokens)** for authentication. After successful login, you'll receive a token that must be included in subsequent requests.

### Including the Token

Add the token to the `Authorization` header of your requests:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **Parent**: Can manage students, view trips, make payments, submit reviews
- **Driver**: Can manage profile, accept assignments, create trips, mark attendance
- **Admin**: Full system access, user management, audit logs

### Token Expiry

Tokens are valid for a configurable duration. When a token expires, you'll receive a `401 Unauthorized` response and need to login again.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    // Additional error details
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `200` | OK - Request successful |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Invalid request data |
| `401` | Unauthorized - Invalid or missing authentication |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource not found |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Server error |

### Common Error Messages

- `Invalid credentials` - Wrong username/password or OTP
- `Token expired` - JWT token has expired
- `Unauthorized access` - User doesn't have required permissions
- `Resource not found` - Requested resource doesn't exist
- `Validation error` - Request data validation failed

---

## API Endpoints

## 1. Authentication & User Management

### 1.1 Get All Roles

Get list of all available user roles in the system.

**Endpoint:** `GET /auth/roles`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": ["parent", "driver", "admin"]
  }
}
```

---

### 1.2 Send OTP for Registration

Send OTP to phone number for new user registration.

**Endpoint:** `POST /auth/register/send-otp`

**Authentication:** Not required

**Rate Limit:** Applied

**Request Body:**
```json
{
  "phone": "+1234567890",
  "role": "parent"
}
```

**Validation:**
- `phone`: Required, valid E.164 format (e.g., +1234567890)
- `role`: Required, one of: `parent`, `driver`

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to +1234567890"
}
```

**Error Responses:**
- `400`: Invalid phone number or role
- `429`: Too many OTP requests

---

### 1.3 Verify OTP and Complete Registration

Verify OTP and create a new user account.

**Endpoint:** `POST /auth/register/verify-otp`

**Authentication:** Not required

**Rate Limit:** Applied

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Validation:**
- `phone`: Required
- `otp`: Required, exactly 6 digits
- `name`: Required, minimum 2 characters
- `email`: Optional, valid email format

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "parent",
      "is_active": true,
      "created_at": "2025-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400`: Invalid OTP or validation error
- `409`: User already exists

---

### 1.4 Send OTP for Login

Send OTP to registered phone number for login.

**Endpoint:** `POST /auth/login/send-otp`

**Authentication:** Not required

**Rate Limit:** Applied

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Error Responses:**
- `404`: User not found
- `400`: Invalid phone number
- `429`: Too many requests

---

### 1.5 Verify OTP and Login

Verify OTP and authenticate user.

**Endpoint:** `POST /auth/login/verify-otp`

**Authentication:** Not required

**Rate Limit:** Applied

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+1234567890",
      "name": "John Doe",
      "role": "parent",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400`: Invalid OTP
- `401`: User is deactivated

---

### 1.6 Verify JWT Token

Verify if the provided JWT token is valid.

**Endpoint:** `GET /auth/verify-token`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+1234567890",
    "name": "John Doe",
    "role": "parent"
  }
}
```

**Error Responses:**
- `401`: Invalid or expired token

---

### 1.7 Logout

Logout and invalidate current session.

**Endpoint:** `POST /auth/logout`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 1.8 Get All Users (Admin Only)

Retrieve list of all users with pagination and filtering.

**Endpoint:** `GET /auth/admin/users`

**Authentication:** Required (Admin)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role (`parent`, `driver`)

**Example:** `GET /auth/admin/users?page=1&limit=20&role=parent`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "phone": "+1234567890",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "parent",
        "is_active": true,
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 1.9 Activate User (Admin Only)

Activate a deactivated user account.

**Endpoint:** `PATCH /auth/admin/users/:id/activate`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: User MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

---

### 1.10 Deactivate User (Admin Only)

Deactivate an active user account.

**Endpoint:** `PATCH /auth/admin/users/:id/deactivate`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: User MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## 2. Parent APIs

### 2.1 Get Parent Profile

Retrieve authenticated parent's profile.

**Endpoint:** `GET /parent/profile`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "alternate_phone": "+9876543210",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T15:45:00Z"
  }
}
```

---

### 2.2 Update Parent Profile

Update authenticated parent's profile information.

**Endpoint:** `PUT /parent/profile`

**Authentication:** Required (Parent)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "alternate_phone": "+9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "alternate_phone": "+9876543210"
  }
}
```

---

### 2.3 Get Parent Address

Retrieve authenticated parent's address.

**Endpoint:** `GET /parent/address`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

---

### 2.4 Update Parent Address

Update authenticated parent's address.

**Endpoint:** `PUT /parent/address`

**Authentication:** Required (Parent)

**Request Body:**
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "coordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully"
}
```

---

## 3. Driver APIs

### 3.1 Get Driver Profile

Retrieve authenticated driver's profile.

**Endpoint:** `GET /driver/profile`

**Authentication:** Required (Driver)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "alternate_phone": "+9876543210",
    "license_number": "DL123456",
    "vehicle_number": "ABC-1234",
    "vehicle_type": "Sedan",
    "vehicle_model": "Toyota Camry",
    "is_available": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### 3.2 Create Driver Profile

Create a new driver profile (first-time setup after registration).

**Endpoint:** `POST /driver/profile`

**Authentication:** Required (Driver)

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "alternate_phone": "+9876543210",
  "license_number": "DL123456",
  "vehicle_number": "ABC-1234",
  "vehicle_type": "Sedan",
  "vehicle_model": "Toyota Camry"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver profile created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "license_number": "DL123456",
    "vehicle_number": "ABC-1234"
  }
}
```

---

### 3.3 Update Driver Profile

Update authenticated driver's profile.

**Endpoint:** `PUT /driver/profile`

**Authentication:** Required (Driver)

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "alternate_phone": "+9876543210",
  "vehicle_type": "SUV",
  "vehicle_model": "Honda CR-V"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### 3.4 Set Driver Availability

Update driver's availability status.

**Endpoint:** `PATCH /driver/availability`

**Authentication:** Required (Driver)

**Request Body:**
```json
{
  "is_available": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availability updated successfully",
  "data": {
    "is_available": true
  }
}
```

---

### 3.5 Get Driver Address

Retrieve authenticated driver's address.

**Endpoint:** `GET /driver/address`

**Authentication:** Required (Driver)

**Response:**
```json
{
  "success": true,
  "data": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90001",
    "coordinates": {
      "latitude": 34.0522,
      "longitude": -118.2437
    }
  }
}
```

---

### 3.6 Create/Update Driver Address

Create or update driver's address (upsert operation).

**Endpoint:** `POST /driver/address`

**Authentication:** Required (Driver)

**Request Body:**
```json
{
  "street": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zip_code": "90001",
  "coordinates": {
    "latitude": 34.0522,
    "longitude": -118.2437
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address saved successfully"
}
```

---

### 3.7 Get Driver Documents

Retrieve all uploaded driver documents.

**Endpoint:** `GET /driver/documents`

**Authentication:** Required (Driver)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "document_type": "license",
      "document_url": "https://storage.example.com/documents/license.pdf",
      "expiry_date": "2026-12-31",
      "is_verified": true,
      "uploaded_at": "2025-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "document_type": "vehicle_registration",
      "document_url": "https://storage.example.com/documents/registration.pdf",
      "expiry_date": "2025-12-31",
      "is_verified": false,
      "uploaded_at": "2025-01-15T10:35:00Z"
    }
  ]
}
```

---

### 3.8 Upload Driver Documents

Upload new driver or vehicle documents.

**Endpoint:** `POST /driver/documents`

**Authentication:** Required (Driver)

**Request Body:**
```json
{
  "document_type": "license",
  "document_url": "https://storage.example.com/documents/license.pdf",
  "expiry_date": "2026-12-31"
}
```

**Document Types:**
- `license`: Driver's license
- `vehicle_registration`: Vehicle registration
- `insurance`: Insurance certificate
- `background_check`: Background check report

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "document_type": "license",
    "is_verified": false
  }
}
```

---

### 3.9 Update Driver Documents

Update existing driver documents.

**Endpoint:** `PUT /driver/documents`

**Authentication:** Required (Driver)

**Request Body:**
```json
{
  "document_id": "507f1f77bcf86cd799439011",
  "document_url": "https://storage.example.com/documents/license_new.pdf",
  "expiry_date": "2027-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document updated successfully"
}
```

---

## 4. Student APIs

### 4.1 Add New Student

Parent can add a new student to their account.

**Endpoint:** `POST /students`

**Authentication:** Required (Parent)

**Request Body:**
```json
{
  "student_id": "STU001",
  "name": "Emily Johnson",
  "school_id": "SCH001",
  "grade": "5th Grade",
  "section": "A",
  "age": 10,
  "gender": "female"
}
```

**Validation:**
- `name`: Required, minimum 2 characters
- `school_id`: Required
- `grade`: Required
- `gender`: Optional, one of: `male`, `female`, `other`

**Response:**
```json
{
  "success": true,
  "message": "Student added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "student_id": "STU001",
    "name": "Emily Johnson",
    "school_id": "SCH001",
    "grade": "5th Grade",
    "section": "A",
    "parent_id": "507f1f77bcf86cd799439012",
    "is_active": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### 4.2 Get All My Students

Retrieve all students added by authenticated parent.

**Endpoint:** `GET /students/my-students`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "student_id": "STU001",
      "name": "Emily Johnson",
      "school_id": "SCH001",
      "grade": "5th Grade",
      "section": "A",
      "age": 10,
      "is_active": true
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "student_id": "STU002",
      "name": "Michael Johnson",
      "school_id": "SCH001",
      "grade": "3rd Grade",
      "section": "B",
      "age": 8,
      "is_active": true
    }
  ]
}
```

---

### 4.3 Get Active Students

Retrieve all active students of authenticated parent.

**Endpoint:** `GET /students/my-active-students`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "student_id": "STU001",
      "name": "Emily Johnson",
      "is_active": true
    }
  ]
}
```

---

### 4.4 Get Student Details

Retrieve details of a specific student by MongoDB ObjectId.

**Endpoint:** `GET /students/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Student MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "student_id": "STU001",
    "name": "Emily Johnson",
    "school_id": "SCH001",
    "school_name": "Springfield Elementary",
    "grade": "5th Grade",
    "section": "A",
    "age": 10,
    "gender": "female",
    "parent_id": "507f1f77bcf86cd799439012",
    "is_active": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### 4.5 Update Student

Update student information by MongoDB ObjectId.

**Endpoint:** `PUT /students/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Student MongoDB ObjectId

**Request Body:**
```json
{
  "name": "Emily Jane Johnson",
  "grade": "6th Grade",
  "section": "A",
  "age": 11
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student updated successfully"
}
```

---

### 4.6 Delete Student

Delete a student by MongoDB ObjectId.

**Endpoint:** `DELETE /students/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Student MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

---

### 4.7 Get Student by Student ID

Retrieve student details using custom student_id (e.g., STU001).

**Endpoint:** `GET /students/by-student-id/:student_id`

**Authentication:** Required (Parent)

**Parameters:**
- `student_id`: Custom student ID (e.g., STU001)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "student_id": "STU001",
    "name": "Emily Johnson",
    "school_id": "SCH001"
  }
}
```

---

### 4.8 Update Student by Student ID

Update student using custom student_id.

**Endpoint:** `PUT /students/by-student-id/:student_id`

**Authentication:** Required (Parent)

**Parameters:**
- `student_id`: Custom student ID

**Request Body:**
```json
{
  "grade": "6th Grade",
  "section": "B"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student updated successfully"
}
```

---

### 4.9 Delete Student by Student ID

Delete student using custom student_id.

**Endpoint:** `DELETE /students/by-student-id/:student_id`

**Authentication:** Required (Parent)

**Parameters:**
- `student_id`: Custom student ID

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

---

## 5. School APIs

### 5.1 Get All Schools

Retrieve list of all schools (authenticated users).

**Endpoint:** `GET /schools`

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:** `GET /schools?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "school_id": "SCH001",
      "name": "Springfield Elementary",
      "address": {
        "street": "123 School St",
        "city": "Springfield",
        "state": "IL",
        "zip_code": "62701"
      },
      "phone": "+1234567890",
      "email": "info@springfield.edu",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 5.2 Get School Details

Retrieve details of a specific school.

**Endpoint:** `GET /schools/:school_id`

**Authentication:** Required

**Parameters:**
- `school_id`: School ID (e.g., SCH001)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "school_id": "SCH001",
    "name": "Springfield Elementary",
    "address": {
      "street": "123 School St",
      "city": "Springfield",
      "state": "IL",
      "zip_code": "62701"
    },
    "phone": "+1234567890",
    "email": "info@springfield.edu",
    "principal_name": "Dr. Smith",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 5.3 Create School (Admin Only)

Admin can create a new school.

**Endpoint:** `POST /schools/admin`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "school_id": "SCH002",
  "name": "Lincoln High School",
  "address": {
    "street": "456 Education Blvd",
    "city": "Chicago",
    "state": "IL",
    "zip_code": "60601"
  },
  "phone": "+1234567891",
  "email": "info@lincoln.edu"
}
```

**Response:**
```json
{
  "success": true,
  "message": "School created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "school_id": "SCH002",
    "name": "Lincoln High School"
  }
}
```

---

### 5.4 Update School (Admin Only)

Admin can update school information.

**Endpoint:** `PUT /schools/admin/:school_id`

**Authentication:** Required (Admin)

**Parameters:**
- `school_id`: School ID

**Request Body:**
```json
{
  "name": "Lincoln High School - Updated",
  "phone": "+1234567899",
  "email": "contact@lincoln.edu"
}
```

**Response:**
```json
{
  "success": true,
  "message": "School updated successfully"
}
```

---

### 5.5 Delete School (Admin Only)

Admin can delete a school.

**Endpoint:** `DELETE /schools/admin/:school_id`

**Authentication:** Required (Admin)

**Parameters:**
- `school_id`: School ID

**Response:**
```json
{
  "success": true,
  "message": "School deleted successfully"
}
```

---

## 6. Assignment & Trip APIs

### 6.1 Create Driver-Student Assignment

Parent requests to assign a driver to their student.

**Endpoint:** `POST /driver-student-assignments`

**Authentication:** Required (Parent or Driver)

**Request Body:**
```json
{
  "student_id": "507f1f77bcf86cd799439011",
  "driver_id": "507f1f77bcf86cd799439012",
  "trip_type": "both",
  "start_date": "2025-02-01",
  "end_date": "2025-06-30"
}
```

**Trip Types:**
- `pickup`: Only pickup service
- `drop`: Only drop service
- `both`: Both pickup and drop

**Response:**
```json
{
  "success": true,
  "message": "Assignment request created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "student_id": "507f1f77bcf86cd799439011",
    "driver_id": "507f1f77bcf86cd799439012",
    "status": "pending",
    "trip_type": "both",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### 6.2 Get Assignment Details

Retrieve details of a specific assignment.

**Endpoint:** `GET /driver-student-assignments/:id`

**Authentication:** Required

**Parameters:**
- `id`: Assignment MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "student_id": "507f1f77bcf86cd799439011",
    "student_name": "Emily Johnson",
    "driver_id": "507f1f77bcf86cd799439012",
    "driver_name": "Jane Smith",
    "status": "approved",
    "trip_type": "both",
    "start_date": "2025-02-01",
    "end_date": "2025-06-30",
    "created_at": "2025-01-15T10:30:00Z",
    "approved_at": "2025-01-15T11:00:00Z"
  }
}
```

---

### 6.3 Get My Assignments (Driver)

Driver retrieves all their assignments.

**Endpoint:** `GET /driver-student-assignments/driver/my-assignments`

**Authentication:** Required (Driver)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "student_name": "Emily Johnson",
      "school_name": "Springfield Elementary",
      "status": "approved",
      "trip_type": "both",
      "start_date": "2025-02-01"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "student_name": "Michael Brown",
      "school_name": "Lincoln High School",
      "status": "pending",
      "trip_type": "pickup",
      "start_date": "2025-02-01"
    }
  ]
}
```

---

### 6.4 Get Active Assignments (Driver)

Driver retrieves all active assignments.

**Endpoint:** `GET /driver-student-assignments/driver/my-active-assignments`

**Authentication:** Required (Driver)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "student_name": "Emily Johnson",
      "status": "approved",
      "trip_type": "both"
    }
  ]
}
```

---

### 6.5 Get Pending Assignments (Driver)

Driver retrieves assignments pending approval.

**Endpoint:** `GET /driver-student-assignments/driver/my-pending-assignments`

**Authentication:** Required (Driver)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "student_name": "Michael Brown",
      "parent_name": "Robert Brown",
      "status": "pending",
      "trip_type": "pickup",
      "requested_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### 6.6 Approve Assignment (Driver)

Driver approves a student assignment request.

**Endpoint:** `POST /driver-student-assignments/:id/approve`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Assignment MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Assignment approved successfully"
}
```

---

### 6.7 Reject Assignment (Driver)

Driver rejects a student assignment request.

**Endpoint:** `POST /driver-student-assignments/:id/reject`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Assignment MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Assignment rejected successfully"
}
```

---

### 6.8 Deactivate Assignment (Driver)

Driver deactivates an active assignment.

**Endpoint:** `POST /driver-student-assignments/:id/deactivate`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Assignment MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Assignment deactivated successfully"
}
```

---

### 6.9 Get Assignments by Student

Retrieve all assignments for a specific student.

**Endpoint:** `GET /driver-student-assignments/student/:studentId`

**Authentication:** Required

**Parameters:**
- `studentId`: Student MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "driver_name": "Jane Smith",
      "status": "approved",
      "trip_type": "both",
      "start_date": "2025-02-01",
      "end_date": "2025-06-30"
    }
  ]
}
```

---

### 6.10 Update Assignment

Update an existing assignment.

**Endpoint:** `PUT /driver-student-assignments/:id`

**Authentication:** Required

**Parameters:**
- `id`: Assignment MongoDB ObjectId

**Request Body:**
```json
{
  "trip_type": "pickup",
  "end_date": "2025-05-30"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assignment updated successfully"
}
```

---

### 6.11 Delete Assignment

Delete an assignment.

**Endpoint:** `DELETE /driver-student-assignments/:id`

**Authentication:** Required

**Parameters:**
- `id`: Assignment MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

---

### 6.12 Get All Assignments (Admin)

Admin retrieves all driver-student assignments.

**Endpoint:** `GET /driver-student-assignments/admin/all-assignments`

**Authentication:** Required (Admin)

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "student_name": "Emily Johnson",
      "driver_name": "Jane Smith",
      "parent_name": "John Doe",
      "status": "approved",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

### 6.13 Create Trip (Driver)

Driver creates a new trip.

**Endpoint:** `POST /trips`

**Authentication:** Required (Driver)

**Request Body:**
```json
{
  "trip_type": "pickup",
  "scheduled_date": "2025-02-01",
  "start_time": "2025-02-01T07:00:00Z",
  "route_details": {
    "starting_point": "Driver Home",
    "stops": ["Stop 1", "Stop 2", "School"]
  }
}
```

**Trip Types:**
- `pickup`: Morning pickup trip
- `drop`: Afternoon drop trip

**Response:**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "trip_id": "TRP001",
    "trip_type": "pickup",
    "status": "scheduled",
    "scheduled_date": "2025-02-01",
    "driver_id": "507f1f77bcf86cd799439012"
  }
}
```

---

### 6.14 Get My Trips (Driver)

Driver retrieves all their trips.

**Endpoint:** `GET /trips/my-trips`

**Authentication:** Required (Driver)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "trip_id": "TRP001",
      "trip_type": "pickup",
      "status": "completed",
      "scheduled_date": "2025-02-01",
      "start_time": "2025-02-01T07:00:00Z",
      "end_time": "2025-02-01T08:30:00Z",
      "total_students": 5
    }
  ]
}
```

---

### 6.15 Get Trips by Date (Driver)

Driver retrieves trips for a specific date.

**Endpoint:** `GET /trips/my-trips/by-date`

**Authentication:** Required (Driver)

**Query Parameters:**
- `date`: Date in YYYY-MM-DD format (required)

**Example:** `GET /trips/my-trips/by-date?date=2025-02-01`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "trip_type": "pickup",
      "status": "scheduled",
      "scheduled_date": "2025-02-01",
      "total_students": 5
    },
    {
      "_id": "507f1f77bcf86cd799439016",
      "trip_type": "drop",
      "status": "scheduled",
      "scheduled_date": "2025-02-01",
      "total_students": 5
    }
  ]
}
```

---

### 6.16 Get Active Trips (Driver)

Driver retrieves all active/ongoing trips.

**Endpoint:** `GET /trips/my-trips/active`

**Authentication:** Required (Driver)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "trip_type": "pickup",
      "status": "in_progress",
      "start_time": "2025-02-01T07:00:00Z",
      "students_picked": 3,
      "total_students": 5
    }
  ]
}
```

---

### 6.17 Get Trip Details

Retrieve details of a specific trip.

**Endpoint:** `GET /trips/:id`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Trip MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "trip_id": "TRP001",
    "trip_type": "pickup",
    "status": "in_progress",
    "scheduled_date": "2025-02-01",
    "start_time": "2025-02-01T07:00:00Z",
    "driver_id": "507f1f77bcf86cd799439012",
    "driver_name": "Jane Smith",
    "route_details": {
      "starting_point": "Driver Home",
      "stops": ["Stop 1", "Stop 2", "School"]
    },
    "students": [
      {
        "student_id": "507f1f77bcf86cd799439011",
        "student_name": "Emily Johnson",
        "attendance_status": "present",
        "pickup_status": "picked"
      }
    ]
  }
}
```

---

### 6.18 Update Trip (Driver)

Driver updates trip information.

**Endpoint:** `PUT /trips/:id`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Trip MongoDB ObjectId

**Request Body:**
```json
{
  "route_details": {
    "starting_point": "Driver Home",
    "stops": ["Stop 1", "Stop 2", "Stop 3", "School"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip updated successfully"
}
```

---

### 6.19 Update Trip Status (Driver)

Driver updates trip status (start/end trip).

**Endpoint:** `PATCH /trips/:id/status`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Trip MongoDB ObjectId

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Status Options:**
- `scheduled`: Trip is scheduled
- `in_progress`: Trip has started
- `completed`: Trip has ended
- `cancelled`: Trip was cancelled

**Response:**
```json
{
  "success": true,
  "message": "Trip status updated to in_progress"
}
```

---

### 6.20 Delete Trip (Driver)

Driver deletes a trip.

**Endpoint:** `DELETE /trips/:id`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Trip MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

---

### 6.21 Get All Trips (Admin)

Admin retrieves all trips in the system.

**Endpoint:** `GET /trips/admin/all-trips`

**Authentication:** Required (Admin)

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "trip_id": "TRP001",
      "driver_name": "Jane Smith",
      "trip_type": "pickup",
      "status": "completed",
      "scheduled_date": "2025-02-01",
      "total_students": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500
  }
}
```

---

## 7. Attendance & QR/OTP APIs

### 7.1 Get Trip Student Record

Get a specific trip-student record by ID.

**Endpoint:** `GET /trip-students/:id`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Trip-Student record MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "trip_id": "507f1f77bcf86cd799439015",
    "student_id": "507f1f77bcf86cd799439011",
    "student_name": "Emily Johnson",
    "attendance_status": "present",
    "pickup_status": "picked",
    "pickup_time": "2025-02-01T07:15:00Z",
    "drop_time": null,
    "sequence_order": 1
  }
}
```

---

### 7.2 Get Trip Students by Trip

Get all students for a specific trip.

**Endpoint:** `GET /trip-students/trip/:tripId`

**Authentication:** Required (Driver)

**Parameters:**
- `tripId`: Trip MongoDB ObjectId

**Query Parameters:**
- `ordered`: Boolean (optional) - Return students in pickup/drop sequence order

**Example:** `GET /trip-students/trip/507f1f77bcf86cd799439015?ordered=true`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "student_id": "507f1f77bcf86cd799439011",
      "student_name": "Emily Johnson",
      "attendance_status": "present",
      "pickup_status": "picked",
      "sequence_order": 1
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "student_id": "507f1f77bcf86cd799439012",
      "student_name": "Michael Brown",
      "attendance_status": "present",
      "pickup_status": "not_picked",
      "sequence_order": 2
    }
  ]
}
```

---

### 7.3 Get Trips by Student

Get all trips for a specific student.

**Endpoint:** `GET /trip-students/student/:studentId`

**Authentication:** Required (Driver)

**Parameters:**
- `studentId`: Student MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "trip_id": "507f1f77bcf86cd799439015",
      "trip_type": "pickup",
      "scheduled_date": "2025-02-01",
      "attendance_status": "present",
      "pickup_status": "picked"
    }
  ]
}
```

---

### 7.4 Get Trip Student by Trip and Student

Get specific trip-student record by trip ID and student ID.

**Endpoint:** `GET /trip-students/trip/:tripId/student/:studentId`

**Authentication:** Required (Driver)

**Parameters:**
- `tripId`: Trip MongoDB ObjectId
- `studentId`: Student MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "trip_id": "507f1f77bcf86cd799439015",
    "student_id": "507f1f77bcf86cd799439011",
    "attendance_status": "present",
    "pickup_status": "picked",
    "pickup_time": "2025-02-01T07:15:00Z"
  }
}
```

---

### 7.5 Get Students by Attendance Status

Filter trip students by attendance status.

**Endpoint:** `GET /trip-students/trip/:tripId/attendance`

**Authentication:** Required (Driver)

**Parameters:**
- `tripId`: Trip MongoDB ObjectId

**Query Parameters:**
- `status`: Required - one of: `present`, `absent`, `pending`

**Example:** `GET /trip-students/trip/507f1f77bcf86cd799439015/attendance?status=present`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "student_name": "Emily Johnson",
      "attendance_status": "present",
      "pickup_time": "2025-02-01T07:15:00Z"
    }
  ]
}
```

---

### 7.6 Get Students by Pickup Status

Filter trip students by pickup status.

**Endpoint:** `GET /trip-students/trip/:tripId/pickup`

**Authentication:** Required (Driver)

**Parameters:**
- `tripId`: Trip MongoDB ObjectId

**Query Parameters:**
- `status`: Required - one of: `picked`, `not_picked`, `pending`

**Example:** `GET /trip-students/trip/507f1f77bcf86cd799439015/pickup?status=picked`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "student_name": "Emily Johnson",
      "pickup_status": "picked",
      "pickup_time": "2025-02-01T07:15:00Z"
    }
  ]
}
```

---

### 7.7 Mark Student Attendance

Driver marks attendance for a student (during pickup).

**Endpoint:** `PUT /trip-students/trip/:tripId/student/:studentId/attendance`

**Authentication:** Required (Driver)

**Parameters:**
- `tripId`: Trip MongoDB ObjectId
- `studentId`: Student MongoDB ObjectId

**Request Body:**
```json
{
  "status": "present",
  "remarks": "Student arrived on time"
}
```

**Status Options:**
- `present`: Student is present
- `absent`: Student is absent

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "student_name": "Emily Johnson",
    "attendance_status": "present",
    "marked_at": "2025-02-01T07:10:00Z"
  }
}
```

---

### 7.8 Record Student Pickup

Driver records when a student is picked up.

**Endpoint:** `PUT /trip-students/trip/:tripId/student/:studentId/pickup`

**Authentication:** Required (Driver)

**Parameters:**
- `tripId`: Trip MongoDB ObjectId
- `studentId`: Student MongoDB ObjectId

**Request Body:**
```json
{
  "pickup_time": "2025-02-01T07:15:00Z",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pickup recorded successfully",
  "data": {
    "student_name": "Emily Johnson",
    "pickup_status": "picked",
    "pickup_time": "2025-02-01T07:15:00Z"
  }
}
```

---

### 7.9 Record Student Drop

Driver records when a student is dropped off.

**Endpoint:** `PUT /trip-students/trip/:tripId/student/:studentId/drop`

**Authentication:** Required (Driver)

**Parameters:**
- `tripId`: Trip MongoDB ObjectId
- `studentId`: Student MongoDB ObjectId

**Request Body:**
```json
{
  "drop_time": "2025-02-01T08:30:00Z",
  "location": {
    "latitude": 40.7589,
    "longitude": -73.9851
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Drop recorded successfully",
  "data": {
    "student_name": "Emily Johnson",
    "drop_time": "2025-02-01T08:30:00Z"
  }
}
```

---

### 7.10 Update Trip Student Record

Update a trip-student record (general update).

**Endpoint:** `PUT /trip-students/:id`

**Authentication:** Required (Driver)

**Parameters:**
- `id`: Trip-Student record MongoDB ObjectId

**Request Body:**
```json
{
  "sequence_order": 2,
  "remarks": "Updated pickup sequence"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip student record updated successfully"
}
```

---

### 7.11 Generate Daily QR/OTP

System generates QR code and OTP for a student's trip.

**Endpoint:** `POST /daily-qr-otp/generate`

**Authentication:** Required

**Request Body:**
```json
{
  "student_id": "507f1f77bcf86cd799439011",
  "trip_id": "507f1f77bcf86cd799439015"
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR/OTP generated successfully",
  "data": {
    "student_id": "507f1f77bcf86cd799439011",
    "trip_id": "507f1f77bcf86cd799439015",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "otp": "849372",
    "expires_at": "2025-02-01T23:59:59Z"
  }
}
```

---

### 7.12 Get QR/OTP for Student Trip

Retrieve QR code and OTP for a student's trip.

**Endpoint:** `GET /daily-qr-otp/student/:studentId/trip/:tripId`

**Authentication:** Required

**Parameters:**
- `studentId`: Student MongoDB ObjectId
- `tripId`: Trip MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "student_id": "507f1f77bcf86cd799439011",
    "trip_id": "507f1f77bcf86cd799439015",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "otp": "849372",
    "expires_at": "2025-02-01T23:59:59Z",
    "is_used": false
  }
}
```

---

### 7.13 Verify QR Code or OTP

Verify QR code or OTP for attendance marking.

**Endpoint:** `POST /daily-qr-otp/verify`

**Authentication:** Required

**Request Body:**
```json
{
  "student_id": "507f1f77bcf86cd799439011",
  "trip_id": "507f1f77bcf86cd799439015",
  "code": "849372",
  "type": "otp"
}
```

**Type Options:**
- `qr`: QR code verification
- `otp`: OTP verification

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification successful",
  "data": {
    "student_name": "Emily Johnson",
    "trip_type": "pickup",
    "verified_at": "2025-02-01T07:15:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## 8. Notification APIs

### 8.1 Get All Notifications

Retrieve all notifications for authenticated user.

**Endpoint:** `GET /notifications`

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Example:** `GET /notifications?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "user_id": "507f1f77bcf86cd799439011",
      "title": "Trip Started",
      "message": "Your child's pickup trip has started",
      "type": "trip",
      "is_read": false,
      "created_at": "2025-02-01T07:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439031",
      "user_id": "507f1f77bcf86cd799439011",
      "title": "Payment Received",
      "message": "Your payment of $99.99 has been received",
      "type": "payment",
      "is_read": true,
      "created_at": "2025-01-31T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Notification Types:**
- `trip`: Trip-related notifications
- `payment`: Payment-related notifications
- `assignment`: Assignment-related notifications
- `general`: General notifications

---

### 8.2 Get Unread Notifications

Retrieve all unread notifications.

**Endpoint:** `GET /notifications/unread`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "title": "Trip Started",
      "message": "Your child's pickup trip has started",
      "type": "trip",
      "created_at": "2025-02-01T07:00:00Z"
    }
  ]
}
```

---

### 8.3 Get Unread Count

Get count of unread notifications.

**Endpoint:** `GET /notifications/unread-count`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### 8.4 Mark Notification as Read

Mark a specific notification as read.

**Endpoint:** `PUT /notifications/:id/mark-as-read`

**Authentication:** Required

**Parameters:**
- `id`: Notification MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 8.5 Mark All as Read

Mark all notifications as read for authenticated user.

**Endpoint:** `PUT /notifications/mark-all-as-read`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updated_count": 12
  }
}
```

---

## 9. Subscription & Payment APIs

### 9.1 Get All Subscription Plans

Retrieve all available subscription plans (public endpoint).

**Endpoint:** `GET /subscription-plans`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "plan_id": "PLAN001",
      "name": "Monthly Plan",
      "description": "Monthly subscription for school transportation",
      "price": 99.99,
      "duration_days": 30,
      "features": [
        "Daily pickup and drop service",
        "Real-time tracking",
        "QR code attendance",
        "24/7 support"
      ],
      "is_active": true
    },
    {
      "_id": "507f1f77bcf86cd799439041",
      "plan_id": "PLAN002",
      "name": "Quarterly Plan",
      "description": "3-month subscription with 10% discount",
      "price": 269.97,
      "duration_days": 90,
      "features": [
        "Daily pickup and drop service",
        "Real-time tracking",
        "QR code attendance",
        "Priority support",
        "10% discount"
      ],
      "is_active": true
    }
  ]
}
```

---

### 9.2 Get Subscription Plan Details

Retrieve details of a specific plan.

**Endpoint:** `GET /subscription-plans/:id`

**Authentication:** Not required

**Parameters:**
- `id`: Plan MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439040",
    "plan_id": "PLAN001",
    "name": "Monthly Plan",
    "description": "Monthly subscription for school transportation",
    "price": 99.99,
    "duration_days": 30,
    "features": [
      "Daily pickup and drop service",
      "Real-time tracking",
      "QR code attendance",
      "24/7 support"
    ],
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 9.3 Update Subscription Plan (Admin)

Admin updates subscription plan details.

**Endpoint:** `PUT /subscription-plans/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Plan MongoDB ObjectId

**Request Body:**
```json
{
  "name": "Monthly Premium Plan",
  "price": 109.99,
  "description": "Updated monthly plan with premium features"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription plan updated successfully"
}
```

---

### 9.4 Activate Subscription Plan (Admin)

Admin activates a subscription plan.

**Endpoint:** `PATCH /subscription-plans/:id/activate`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Plan MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Subscription plan activated successfully"
}
```

---

### 9.5 Deactivate Subscription Plan (Admin)

Admin deactivates a subscription plan.

**Endpoint:** `PATCH /subscription-plans/:id/deactivate`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Plan MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Subscription plan deactivated successfully"
}
```

---

### 9.6 Subscribe to Plan (Parent)

Parent subscribes to a subscription plan.

**Endpoint:** `POST /parent-subscriptions`

**Authentication:** Required (Parent)

**Request Body:**
```json
{
  "plan_id": "507f1f77bcf86cd799439040",
  "start_date": "2025-02-01",
  "auto_renew": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439050",
    "parent_id": "507f1f77bcf86cd799439011",
    "plan_id": "507f1f77bcf86cd799439040",
    "plan_name": "Monthly Plan",
    "start_date": "2025-02-01",
    "end_date": "2025-03-03",
    "status": "active",
    "auto_renew": true,
    "created_at": "2025-01-31T10:00:00Z"
  }
}
```

---

### 9.7 Get My Subscriptions (Parent)

Parent retrieves all their subscriptions.

**Endpoint:** `GET /parent-subscriptions/my-subscriptions`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "plan_name": "Monthly Plan",
      "start_date": "2025-02-01",
      "end_date": "2025-03-03",
      "status": "active",
      "auto_renew": true
    },
    {
      "_id": "507f1f77bcf86cd799439051",
      "plan_name": "Monthly Plan",
      "start_date": "2025-01-01",
      "end_date": "2025-02-01",
      "status": "expired",
      "auto_renew": false
    }
  ]
}
```

---

### 9.8 Get Active Subscription (Parent)

Parent retrieves their current active subscription.

**Endpoint:** `GET /parent-subscriptions/my-active-subscription`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439050",
    "plan_name": "Monthly Plan",
    "plan_price": 99.99,
    "start_date": "2025-02-01",
    "end_date": "2025-03-03",
    "status": "active",
    "auto_renew": true,
    "days_remaining": 28
  }
}
```

---

### 9.9 Get Subscription Details

Retrieve details of a specific subscription.

**Endpoint:** `GET /parent-subscriptions/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Subscription MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439050",
    "parent_id": "507f1f77bcf86cd799439011",
    "plan_id": "507f1f77bcf86cd799439040",
    "plan_name": "Monthly Plan",
    "plan_price": 99.99,
    "start_date": "2025-02-01",
    "end_date": "2025-03-03",
    "status": "active",
    "auto_renew": true,
    "created_at": "2025-01-31T10:00:00Z"
  }
}
```

---

### 9.10 Update Subscription

Update subscription details.

**Endpoint:** `PUT /parent-subscriptions/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Subscription MongoDB ObjectId

**Request Body:**
```json
{
  "auto_renew": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription updated successfully"
}
```

---

### 9.11 Cancel Subscription (Parent)

Parent cancels their subscription.

**Endpoint:** `POST /parent-subscriptions/:id/cancel`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Subscription MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "cancelled_at": "2025-02-01T10:00:00Z",
    "refund_amount": 0
  }
}
```

---

### 9.12 Delete Subscription

Delete a subscription.

**Endpoint:** `DELETE /parent-subscriptions/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Subscription MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Subscription deleted successfully"
}
```

---

### 9.13 Get All Subscriptions (Admin)

Admin retrieves all subscriptions in the system.

**Endpoint:** `GET /parent-subscriptions/admin/all-subscriptions`

**Authentication:** Required (Admin)

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "parent_name": "John Doe",
      "plan_name": "Monthly Plan",
      "status": "active",
      "start_date": "2025-02-01",
      "end_date": "2025-03-03"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250
  }
}
```

---

### 9.14 Make Payment (Parent)

Parent makes a payment for subscription.

**Endpoint:** `POST /payments`

**Authentication:** Required (Parent)

**Request Body:**
```json
{
  "subscription_id": "507f1f77bcf86cd799439050",
  "amount": 99.99,
  "payment_method": "card",
  "transaction_id": "TXN123456789"
}
```

**Payment Methods:**
- `card`: Credit/Debit card
- `upi`: UPI payment
- `bank_transfer`: Bank transfer
- `cash`: Cash payment

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439060",
    "payment_id": "PAY001",
    "subscription_id": "507f1f77bcf86cd799439050",
    "amount": 99.99,
    "payment_method": "card",
    "transaction_id": "TXN123456789",
    "status": "pending",
    "created_at": "2025-01-31T10:00:00Z"
  }
}
```

---

### 9.15 Get Payment History (Parent)

Parent retrieves their payment history.

**Endpoint:** `GET /payments/my-payments`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439060",
      "payment_id": "PAY001",
      "amount": 99.99,
      "payment_method": "card",
      "status": "completed",
      "payment_date": "2025-01-31T10:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439061",
      "payment_id": "PAY002",
      "amount": 99.99,
      "payment_method": "upi",
      "status": "completed",
      "payment_date": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

### 9.16 Get Pending Payments (Parent)

Parent retrieves pending payments.

**Endpoint:** `GET /payments/my-payments/pending`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439062",
      "payment_id": "PAY003",
      "amount": 99.99,
      "status": "pending",
      "created_at": "2025-02-01T10:00:00Z"
    }
  ]
}
```

---

### 9.17 Get Completed Payments (Parent)

Parent retrieves completed payments.

**Endpoint:** `GET /payments/my-payments/completed`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439060",
      "payment_id": "PAY001",
      "amount": 99.99,
      "payment_method": "card",
      "status": "completed",
      "payment_date": "2025-01-31T10:00:00Z"
    }
  ]
}
```

---

### 9.18 Get Payment Details

Retrieve details of a specific payment.

**Endpoint:** `GET /payments/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Payment MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439060",
    "payment_id": "PAY001",
    "parent_id": "507f1f77bcf86cd799439011",
    "subscription_id": "507f1f77bcf86cd799439050",
    "amount": 99.99,
    "payment_method": "card",
    "transaction_id": "TXN123456789",
    "status": "completed",
    "payment_date": "2025-01-31T10:00:00Z",
    "created_at": "2025-01-31T10:00:00Z"
  }
}
```

---

### 9.19 Update Payment

Update payment details.

**Endpoint:** `PUT /payments/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Payment MongoDB ObjectId

**Request Body:**
```json
{
  "transaction_id": "TXN123456789_UPDATED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment updated successfully"
}
```

---

### 9.20 Complete Payment

Mark payment as completed.

**Endpoint:** `POST /payments/:id/complete`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Payment MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "payment_id": "PAY001",
    "status": "completed",
    "completed_at": "2025-01-31T10:30:00Z"
  }
}
```

---

### 9.21 Refund Payment

Process payment refund.

**Endpoint:** `POST /payments/:id/refund`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Payment MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "data": {
    "payment_id": "PAY001",
    "refund_amount": 99.99,
    "refunded_at": "2025-02-01T15:00:00Z"
  }
}
```

---

### 9.22 Get All Payments (Admin)

Admin retrieves all payments in the system.

**Endpoint:** `GET /payments/admin/all-payments`

**Authentication:** Required (Admin)

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439060",
      "payment_id": "PAY001",
      "parent_name": "John Doe",
      "amount": 99.99,
      "payment_method": "card",
      "status": "completed",
      "payment_date": "2025-01-31T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000
  }
}
```

---

## 10. Ratings & Reviews APIs

### 10.1 Submit Rating/Review (Parent)

Parent submits a rating and review for a driver.

**Endpoint:** `POST /ratings-reviews`

**Authentication:** Required (Parent)

**Request Body:**
```json
{
  "driver_id": "507f1f77bcf86cd799439012",
  "rating": 4.5,
  "review": "Great driver, very punctual and friendly!",
  "trip_id": "507f1f77bcf86cd799439015"
}
```

**Validation:**
- `driver_id`: Required
- `rating`: Required, number between 1 and 5
- `review`: Optional, string
- `trip_id`: Optional

**Response:**
```json
{
  "success": true,
  "message": "Rating and review submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439070",
    "driver_id": "507f1f77bcf86cd799439012",
    "parent_id": "507f1f77bcf86cd799439011",
    "rating": 4.5,
    "review": "Great driver, very punctual and friendly!",
    "created_at": "2025-02-01T16:00:00Z"
  }
}
```

---

### 10.2 Get My Reviews (Parent)

Parent retrieves all reviews they have submitted.

**Endpoint:** `GET /ratings-reviews/my-reviews`

**Authentication:** Required (Parent)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439070",
      "driver_name": "Jane Smith",
      "rating": 4.5,
      "review": "Great driver, very punctual and friendly!",
      "created_at": "2025-02-01T16:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439071",
      "driver_name": "Mike Johnson",
      "rating": 5.0,
      "review": "Excellent service!",
      "created_at": "2025-01-15T12:00:00Z"
    }
  ]
}
```

---

### 10.3 Get Review Details

Retrieve details of a specific review.

**Endpoint:** `GET /ratings-reviews/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Review MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439070",
    "driver_id": "507f1f77bcf86cd799439012",
    "driver_name": "Jane Smith",
    "parent_id": "507f1f77bcf86cd799439011",
    "parent_name": "John Doe",
    "rating": 4.5,
    "review": "Great driver, very punctual and friendly!",
    "trip_id": "507f1f77bcf86cd799439015",
    "created_at": "2025-02-01T16:00:00Z"
  }
}
```

---

### 10.4 Update Review (Parent)

Parent updates their submitted review.

**Endpoint:** `PUT /ratings-reviews/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Review MongoDB ObjectId

**Request Body:**
```json
{
  "rating": 5.0,
  "review": "Excellent driver! Updated my review after more trips."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review updated successfully"
}
```

---

### 10.5 Delete Review (Parent)

Parent deletes their submitted review.

**Endpoint:** `DELETE /ratings-reviews/:id`

**Authentication:** Required (Parent)

**Parameters:**
- `id`: Review MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### 10.6 Get Driver Reviews (Public)

Retrieve all reviews for a specific driver.

**Endpoint:** `GET /ratings-reviews/driver/:driverId`

**Authentication:** Not required

**Parameters:**
- `driverId`: Driver MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439070",
      "parent_name": "John Doe",
      "rating": 4.5,
      "review": "Great driver, very punctual and friendly!",
      "created_at": "2025-02-01T16:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439072",
      "parent_name": "Sarah Williams",
      "rating": 5.0,
      "review": "Best driver ever!",
      "created_at": "2025-01-28T10:00:00Z"
    }
  ]
}
```

---

### 10.7 Get Driver Rating (Public)

Retrieve average rating and statistics for a driver.

**Endpoint:** `GET /ratings-reviews/driver/:driverId/rating`

**Authentication:** Not required

**Parameters:**
- `driverId`: Driver MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "driver_id": "507f1f77bcf86cd799439012",
    "driver_name": "Jane Smith",
    "average_rating": 4.7,
    "total_reviews": 25,
    "rating_breakdown": {
      "5": 15,
      "4": 8,
      "3": 2,
      "2": 0,
      "1": 0
    }
  }
}
```

---

## 11. Support & Audit APIs

### 11.1 Get Audit Logs (Admin)

Admin retrieves audit logs with filtering.

**Endpoint:** `GET /audit-logs`

**Authentication:** Required (Admin)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `user_id`: Filter by user ID
- `action`: Filter by action (e.g., create, update, delete)
- `resource`: Filter by resource (e.g., user, trip, payment)

**Example:** `GET /audit-logs?page=1&limit=20&action=create&resource=payment`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439080",
      "user_id": "507f1f77bcf86cd799439011",
      "user_name": "John Doe",
      "action": "create",
      "resource": "payment",
      "resource_id": "507f1f77bcf86cd799439060",
      "changes": {
        "amount": 99.99,
        "payment_method": "card"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "timestamp": "2025-01-31T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5000,
    "totalPages": 250
  }
}
```

**Common Actions:**
- `create`: Resource created
- `update`: Resource updated
- `delete`: Resource deleted
- `login`: User login
- `logout`: User logout

**Common Resources:**
- `user`: User account
- `student`: Student
- `trip`: Trip
- `payment`: Payment
- `assignment`: Driver-student assignment

---

### 11.2 Get Audit Log Details (Admin)

Retrieve details of a specific audit log entry.

**Endpoint:** `GET /audit-logs/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Audit log MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439080",
    "user_id": "507f1f77bcf86cd799439011",
    "user_name": "John Doe",
    "user_role": "parent",
    "action": "create",
    "resource": "payment",
    "resource_id": "507f1f77bcf86cd799439060",
    "changes": {
      "before": null,
      "after": {
        "amount": 99.99,
        "payment_method": "card",
        "status": "pending"
      }
    },
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "timestamp": "2025-01-31T10:00:00Z"
  }
}
```

---

## 12. Admin Portal APIs

### 12.1 Admin Login

Admin authentication endpoint.

**Endpoint:** `POST /admin/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "_id": "507f1f77bcf86cd799439090",
      "username": "admin",
      "name": "Super Admin",
      "email": "admin@pingparent.com",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401`: Invalid credentials
- `403`: Account is deactivated

---

### 12.2 Create Admin

Create a new admin user.

**Endpoint:** `POST /admin`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "username": "admin2",
  "password": "SecurePassword456!",
  "name": "Admin User",
  "email": "admin2@pingparent.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439091",
    "username": "admin2",
    "name": "Admin User",
    "email": "admin2@pingparent.com"
  }
}
```

---

### 12.3 Get All Admins

Retrieve list of all admin users.

**Endpoint:** `GET /admin`

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439090",
      "username": "admin",
      "name": "Super Admin",
      "email": "admin@pingparent.com",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439091",
      "username": "admin2",
      "name": "Admin User",
      "email": "admin2@pingparent.com",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### 12.4 Get Admin Details

Retrieve details of a specific admin.

**Endpoint:** `GET /admin/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Admin MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439090",
    "username": "admin",
    "name": "Super Admin",
    "email": "admin@pingparent.com",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "last_login": "2025-02-01T09:00:00Z"
  }
}
```

---

### 12.5 Update Admin

Update admin information.

**Endpoint:** `PUT /admin/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Admin MongoDB ObjectId

**Request Body:**
```json
{
  "name": "Super Admin - Updated",
  "email": "superadmin@pingparent.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin updated successfully"
}
```

---

### 12.6 Activate Admin

Activate an admin account.

**Endpoint:** `PATCH /admin/:id/activate`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Admin MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Admin activated successfully"
}
```

---

### 12.7 Deactivate Admin

Deactivate an admin account.

**Endpoint:** `PATCH /admin/:id/deactivate`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Admin MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Admin deactivated successfully"
}
```

---

### 12.8 Get All Users (Admin)

Admin retrieves all users in the system.

**Endpoint:** `GET /admin/users`

**Authentication:** Required (Admin)

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `role`: Filter by role (`parent`, `driver`)

**Example:** `GET /admin/users?page=1&limit=50&role=parent`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "parent",
      "is_active": true,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10
  }
}
```

---

### 12.9 Get User by ID (Admin)

Admin retrieves specific user details.

**Endpoint:** `GET /admin/users/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: User MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phone": "+1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "parent",
    "is_active": true,
    "created_at": "2025-01-15T10:30:00Z",
    "last_login": "2025-02-01T08:00:00Z",
    "students_count": 2,
    "active_subscriptions": 1
  }
}
```

---

### 12.10 Update User (Admin)

Admin updates user information.

**Endpoint:** `PUT /admin/users/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: User MongoDB ObjectId

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

### 12.11 Activate User (Admin)

Admin activates a user account.

**Endpoint:** `PATCH /admin/users/:id/activate`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: User MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

---

### 12.12 Deactivate User (Admin)

Admin deactivates a user account.

**Endpoint:** `PATCH /admin/users/:id/deactivate`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: User MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

### 12.13 Delete User (Admin)

Admin deletes a user.

**Endpoint:** `DELETE /admin/users/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: User MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 13. Role Management

### 13.1 Create Role (Admin)

Admin creates a new role.

**Endpoint:** `POST /roles`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Super Admin",
  "description": "Full system access with all permissions",
  "permissions": [
    "user.create",
    "user.read",
    "user.update",
    "user.delete",
    "admin.manage",
    "audit.view"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439100",
    "name": "Super Admin",
    "description": "Full system access with all permissions",
    "permissions": [
      "user.create",
      "user.read",
      "user.update",
      "user.delete",
      "admin.manage",
      "audit.view"
    ],
    "is_active": true
  }
}
```

---

### 13.2 Get All Roles (Admin)

Admin retrieves all roles.

**Endpoint:** `GET /roles`

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439100",
      "name": "Super Admin",
      "description": "Full system access",
      "permissions_count": 6,
      "is_active": true
    },
    {
      "_id": "507f1f77bcf86cd799439101",
      "name": "Support Admin",
      "description": "Limited admin access",
      "permissions_count": 3,
      "is_active": true
    }
  ]
}
```

---

### 13.3 Get Role Details (Admin)

Admin retrieves specific role details.

**Endpoint:** `GET /roles/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Role MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439100",
    "name": "Super Admin",
    "description": "Full system access with all permissions",
    "permissions": [
      "user.create",
      "user.read",
      "user.update",
      "user.delete",
      "admin.manage",
      "audit.view"
    ],
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### 13.4 Update Role (Admin)

Admin updates role information.

**Endpoint:** `PUT /roles/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Role MongoDB ObjectId

**Request Body:**
```json
{
  "name": "Super Administrator",
  "description": "Full system access - updated",
  "permissions": [
    "user.create",
    "user.read",
    "user.update",
    "user.delete",
    "admin.manage",
    "audit.view",
    "system.config"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role updated successfully"
}
```

---

### 13.5 Delete Role (Admin)

Admin deletes a role.

**Endpoint:** `DELETE /roles/:id`

**Authentication:** Required (Admin)

**Parameters:**
- `id`: Role MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

---

## Appendix

### Common Permission Types

- `user.create`: Create new users
- `user.read`: View user information
- `user.update`: Update user information
- `user.delete`: Delete users
- `admin.manage`: Manage admin accounts
- `audit.view`: View audit logs
- `payment.manage`: Manage payments
- `school.manage`: Manage schools
- `system.config`: System configuration access

### Rate Limiting

- OTP requests: 5 requests per 15 minutes per phone number
- Login attempts: 10 attempts per 15 minutes per IP
- API requests: 1000 requests per hour per user

### Data Formats

- **Date Format**: ISO 8601 (e.g., `2025-02-01T07:15:00Z`)
- **Phone Format**: E.164 (e.g., `+1234567890`)
- **Currency**: USD with 2 decimal places (e.g., `99.99`)

### Status Values

**User/Admin Status:**
- `active`: Account is active
- `inactive`: Account is deactivated

**Assignment Status:**
- `pending`: Waiting for driver approval
- `approved`: Driver approved the assignment
- `rejected`: Driver rejected the assignment
- `deactivated`: Assignment was deactivated

**Trip Status:**
- `scheduled`: Trip is scheduled for future
- `in_progress`: Trip is currently ongoing
- `completed`: Trip has finished
- `cancelled`: Trip was cancelled

**Payment Status:**
- `pending`: Payment is pending
- `completed`: Payment successful
- `failed`: Payment failed
- `refunded`: Payment was refunded

**Subscription Status:**
- `active`: Subscription is active
- `cancelled`: Subscription was cancelled
- `expired`: Subscription has expired

---

**End of Documentation**

For support or questions, please contact: [support@pingparent.com](mailto:support@pingparent.com)

API Version: 1.0.0
Last Updated: 2025-01-31
