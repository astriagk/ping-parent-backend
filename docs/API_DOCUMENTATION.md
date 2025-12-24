# Ping Parent Backend - API Documentation

Complete API reference with request payloads, response formats, and error messages.

**Base URL**: `http://localhost:3000/api`

---

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
  - [Get Roles](#get-roles)
  - [Traditional Registration](#traditional-registration-emailpassword)
  - [Phone Registration (3-Step)](#phone-based-registration-3-step-process)
  - [Phone Login (2-Step)](#phone-based-login-2-step-process)
  - [Traditional Login](#traditional-login-emailpassword)
  - [Forgot Password Flow](#forgot-password-flow)
  - [Verify Token](#verify-token)
  - [Logout](#logout)
- [Parent Endpoints](#parent-endpoints)
  - [Get Profile](#get-parent-profile)
  - [Update Profile](#update-parent-profile)
  - [Get Address](#get-parent-address)
  - [Update Address](#update-parent-address)

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

| Status | Error Message |
|--------|--------------|
| 500 | `"Failed to fetch roles"` |

**Example**:
```json
{
  "success": false,
  "error": "Failed to fetch roles"
}
```

---

### Traditional Registration (Email/Password)

Register a new user with email and password.

**Endpoint**: `POST /api/auth/register`

**Authentication**: Not required

**Request Payload**:
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "parent"
}
```

**Required Fields**:
- `email` (string): Valid email address
- `password` (string): Min 8 characters, must include uppercase, lowercase, and number
- `phone` (string): Valid phone number

**Optional Fields**:
- `firstName` (string)
- `lastName` (string)
- `role` (string): Defaults to "parent" if not provided

**Success Response** (201):
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
      "emailVerified": false
    }
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Error Responses**:

| Status | Error Code | Error Message |
|--------|-----------|--------------|
| 400 | - | `"Missing required fields"` |
| 400 | - | `"Invalid email"` |
| 400 | - | `"Password must be at least 8 characters and include uppercase, lowercase and a number"` |
| 400 | - | `"Invalid phone number"` |
| 400 | - | `"Invalid role"` |
| 409 | - | `"Email already in use"` |
| 500 | - | `"Unable to validate role"` |

**Example Error**:
```json
{
  "success": false,
  "error": "Email already in use"
}
```

---

### Phone-Based Registration (3-Step Process)

#### Step 1: Send OTP

Send OTP to phone number for registration.

**Endpoint**: `POST /api/auth/register/send-otp`

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
  "message": "OTP sent to phone number",
  "otp": "123456"
}
```
> Note: `otp` field is only included in development mode

**Error Responses**:

| Status | Error Message |
|--------|--------------|
| 400 | `"Phone number is required"` |
| 400 | `"Invalid phone number"` |
| 409 | `"Phone number already registered"` |

---

#### Step 2: Verify OTP

Verify the OTP sent to phone number.

**Endpoint**: `POST /api/auth/register/verify-otp`

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
  "message": "Phone number verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:

| Status | Error Message |
|--------|--------------|
| 400 | `"Phone number and OTP are required"` |
| 400 | `"Invalid phone number"` |
| 400 | `"Invalid or expired OTP"` |
| 404 | `"Email or password is incorrect"` |

---

#### Step 3: Complete Registration

Complete registration with user details (requires token from Step 2).

**Endpoint**: `POST /api/auth/register/complete`

**Authentication**: Required (Bearer token from Step 2)

**Request Headers**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Payload**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "role": "parent"
}
```

**Optional Fields**:
- `firstName` (string)
- `lastName` (string)
- `role` (string): Defaults to "parent"

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "role": "parent",
      "emailVerified": false,
      "phoneVerified": true
    }
  },
  "message": "Registration completed successfully"
}
```

**Error Responses**:

| Status | Error Message |
|--------|--------------|
| 400 | `"Invalid role"` |
| 401 | `"Missing Authorization header"` |
| 404 | `"User not found"` |
| 500 | `"Unable to validate role"` |

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

| Status | Error Message |
|--------|--------------|
| 400 | `"Phone number is required"` |
| 400 | `"Invalid phone number"` |
| 404 | `"Phone number not registered"` |

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

| Status | Error Message |
|--------|--------------|
| 400 | `"Phone number and OTP are required for login"` |
| 400 | `"Invalid phone number"` |
| 400 | `"Invalid or expired OTP"` |
| 404 | `"User not found"` |

---

### Traditional Login (Email/Password)

Login with email and password.

**Endpoint**: `POST /api/auth/login`

**Authentication**: Not required

**Rate Limiting**: Yes (protects against brute-force attacks)

**Request Payload**:
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123"
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
  }
}
```

**Error Responses**:

| Status | Error Code | Error Message |
|--------|-----------|--------------|
| 400 | - | `"Missing email or password"` |
| 400 | - | `"Invalid email"` |
| 401 | `INVALID_CREDENTIALS` | `"Email or password is incorrect"` |

**Example Error**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

---

### Forgot Password Flow

#### Step 1: Request Password Reset OTP

Request OTP for password reset.

**Endpoint**: `POST /api/auth/forgot-password`

**Authentication**: Not required

**Request Payload**:
```json
{
  "email": "parent@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset code."
}
```

> Note: Always returns success for privacy/security reasons, even if email doesn't exist

**Error Responses**:

| Status | Error Message |
|--------|--------------|
| 500 | `"Server error"` |

---

#### Step 2: Verify OTP

Verify the OTP sent to email.

**Endpoint**: `POST /api/auth/verify-otp`

**Authentication**: Not required

**Request Payload**:
```json
{
  "email": "parent@example.com",
  "otp": "123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "resetToken": "a1b2c3d4e5f6..."
  }
}
```

**Error Responses**:

| Status | Error Message |
|--------|--------------|
| 400 | `"Missing email or otp"` |
| 400 | `"Invalid or expired OTP"` |
| 500 | `"Server error"` |

---

#### Step 3: Reset Password

Reset password using the reset token from Step 2.

**Endpoint**: `POST /api/auth/reset-password`

**Authentication**: Not required

**Request Payload**:
```json
{
  "resetToken": "a1b2c3d4e5f6...",
  "newPassword": "NewSecurePass123"
}
```

**Required Fields**:
- `resetToken` (string): Token from verify-otp response
- `newPassword` (string): Min 8 characters, must include uppercase, lowercase, and number

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

**Error Responses**:

| Status | Error Message |
|--------|--------------|
| 400 | `"Missing resetToken or newPassword"` |
| 400 | `"Password does not meet requirements"` |
| 400 | `"Invalid or expired reset token"` |
| 500 | `"Server error"` |

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

| Status | Error Message |
|--------|--------------|
| 401 | `"Missing Authorization header"` |
| 401 | `"Malformed Authorization header"` |
| 401 | `"User not found"` |
| 401 | `"Token expired"` |
| 401 | `"Invalid token"` |
| 401 | `"Invalid refresh token"` |

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

| Status | Error Message |
|--------|--------------|
| 500 | `"Server error"` |

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

| Status | Error Message |
|--------|--------------|
| 401 | `"User not authenticated"` |
| 404 | `"Parent profile not found"` |
| 500 | `"Failed to fetch parent profile"` |

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

| Status | Error Message |
|--------|--------------|
| 400 | `"No updates provided"` |
| 401 | `"User not authenticated"` |
| 404 | `"Parent profile not found or no changes made"` |
| 500 | `"Failed to update parent profile"` |

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

| Status | Error Message |
|--------|--------------|
| 401 | `"User not authenticated"` |
| 404 | `"Address not found"` |
| 500 | `"Failed to fetch address"` |

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

| Status | Error Message |
|--------|--------------|
| 400 | `"Street, city, state, and zipCode are required"` |
| 401 | `"User not authenticated"` |
| 500 | `"Failed to update address"` |

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

| Status Code | Description |
|------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request payload or parameters |
| 401 | Unauthorized - Authentication required or failed |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error occurred |

---

## Authentication

Most endpoints require a JWT token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are obtained through:
- Traditional login (`/api/auth/login`)
- Phone-based login (`/api/auth/login/verify-otp`)
- Registration endpoints

Tokens expire based on the `JWT_EXPIRES_IN` environment variable (default: 7 days).

---

## Development Mode Features

In development mode (`NODE_ENV=development`), some endpoints include additional debugging information:

- OTP codes are returned in the response for phone-based authentication
- More detailed error messages may be logged to console

**Important**: These features are disabled in production for security.

---

## Rate Limiting

The `/api/auth/login` endpoint has rate limiting enabled to prevent brute-force attacks. Multiple failed login attempts from the same IP or email will result in temporary blocking.
