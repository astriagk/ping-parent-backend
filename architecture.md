# Ping Parent Backend - Architecture Documentation

**Last Updated:** December 19, 2025

---

## 📌 Project Overview

**Ping Parent Backend** is a Node.js + TypeScript backend service for a parent connectivity platform. It provides REST APIs with MongoDB for data storage using the native MongoDB driver (no ORM/ODM).

### Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js 5.x
- **Database:** MongoDB (Native Driver)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Email:** Nodemailer (optional)
- **Testing:** Jest

---

## 📂 Project Structure

```
ping-parent-backend/
├── src/
│   ├── __tests__/              # Test files
│   │   ├── auth.integration.test.ts
│   │   ├── auth.unit.test.ts
│   │   └── register.unit.test.ts
│   │
│   ├── config/                 # Configuration
│   │   ├── collections.ts      # MongoDB collection names
│   │   └── roles.ts            # Role definitions
│   │
│   ├── constants/              # Application constants
│   │   └── messages.ts         # Error and success messages
│   │
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   └── ping.controller.ts
│   │
│   ├── db/                     # Database connection
│   │   └── mongo.ts
│   │
│   ├── middleware/             # Express middleware
│   │   └── rateLimit.ts
│   │
│   ├── routes/                 # API route definitions
│   │   ├── auth.routes.ts
│   │   └── ping.routes.ts
│   │
│   ├── services/               # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── passwordReset.service.ts
│   │   ├── ping.service.ts
│   │   ├── role.service.ts
│   │   └── user.service.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── ping.type.ts
│   │   └── user.type.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── email.ts
│   │   ├── jwt.ts
│   │   ├── nodemailer.ts
│   │   └── validation.ts
│   │
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Server entry point
│
├── environment/                # Environment configs
├── scripts/                    # Utility scripts
├── .env                        # Environment variables
├── jest.config.cjs             # Jest configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Architecture

### MongoDB Collections

#### 1. **users**

Stores user account information.

**Fields:**

- `_id`: ObjectId (MongoDB generated)
- `firstName`: string
- `lastName`: string
- `email`: string (unique, lowercase)
- `phone`: string (normalized format, e.g., +12345678900)
- `passwordHash`: string (optional - not used in phone-based registration)
- `address`: string (optional)
- `role`: string (e.g., "parent", "admin")
- `emailVerified`: boolean
- `phoneVerified`: boolean
- `verificationToken`: string (optional - for email verification)
- `createdAt`: Date

#### 2. **phone_registrations**

Stores OTP records for phone-based registration.

**Fields:**

- `_id`: ObjectId
- `phone`: string (normalized)
- `otp`: string (6-digit code)
- `otpExpiresAt`: Date (TTL: 10 minutes)
- `verified`: boolean
- `verifiedAt`: Date (optional)
- `createdAt`: Date

#### 3. **password_resets**

Stores OTP and reset tokens for password recovery.

**Fields:**

- `_id`: ObjectId
- `email`: string (lowercase)
- `otp`: string (6-digit code)
- `otpExpiresAt`: Date (TTL: 10 minutes)
- `used`: boolean
- `resetToken`: string (optional - generated after OTP verification)
- `resetTokenExpiresAt`: Date (optional - TTL: 60 minutes)
- `consumedAt`: Date (optional)
- `createdAt`: Date

#### 4. **roles**

Stores allowed user roles.

**Fields:**

- `_id`: ObjectId
- `name`: string (e.g., "parent", "admin")

#### 5. **pings**

Stores ping/notification records (details not fully documented yet).

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **JWT-based authentication**

   - Access tokens signed with `JWT_SECRET`
   - Tokens include: `userId`, `email`, `role`
   - Token verification via `/auth/verify-token` endpoint

2. **Refresh token support**
   - Optional refresh token via `x-refresh-token` header
   - Can issue new access token when expired

### Registration Flows

#### Traditional Registration (Email + Password)

**Endpoint:** `POST /auth/register`

**Flow:**

1. User provides: email, password, firstName, lastName, phone, role (optional)
2. Validates email format and password strength
3. Hashes password with bcrypt
4. Creates user with `emailVerified: false`
5. Sends verification email
6. Returns JWT token for immediate login

#### Phone-Based Registration (3-Step, No Password)

**NEW IMPLEMENTATION** - OTP-based registration without password requirement.

##### Step 1: Send OTP

**Endpoint:** `POST /auth/register/send-otp`

**Request:**

```json
{
  "phone": "+1234567890"
}
```

**Process:**

- Validates and normalizes phone number
- Checks if phone already registered
- Generates 6-digit OTP
- Stores in `phone_registrations` collection (10 min expiry)
- Returns success (OTP logged in dev mode)

##### Step 2: Verify OTP

**Endpoint:** `POST /auth/register/verify-otp`

**Request:**

```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Process:**

- Validates phone and OTP
- Checks OTP validity and expiration
- Marks phone as verified in database
- Returns success confirmation

##### Step 3: Complete Registration

**Endpoint:** `POST /auth/register/complete`

**Request:**

```json
{
  "phone": "+1234567890",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St" // optional
  "role": "parent" // optional
}
```

**Process:**

- Validates phone was verified via OTP
- Validates email format
- Checks for duplicate phone/email
- Creates user account with `phoneVerified: true`
- **No password stored** - authentication via OTP
- Cleans up OTP records
- Returns JWT token for login

### Login Flow

**Endpoint:** `POST /auth/login`

**Flow:**

1. User provides email and password
2. Validates email format
3. Fetches user from database
4. Compares password hash
5. Rate limiting applied (via `loginRateLimiter`)
6. Returns JWT token with user data

### Password Reset Flow

#### Step 1: Request Reset

**Endpoint:** `POST /auth/forgot-password`

- Generates OTP and sends to email

#### Step 2: Verify OTP

**Endpoint:** `POST /auth/verify-otp`

- Validates OTP and returns reset token

#### Step 3: Reset Password

**Endpoint:** `POST /auth/reset-password`

- Uses reset token to update password

---

## 📡 API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint                    | Description                               | Auth Required |
| ------ | --------------------------- | ----------------------------------------- | ------------- |
| GET    | `/auth/roles`               | Get available roles                       | No            |
| POST   | `/auth/register`            | Traditional registration (email+password) | No            |
| POST   | `/auth/register/send-otp`   | Send OTP to phone                         | No            |
| POST   | `/auth/register/verify-otp` | Verify phone OTP                          | No            |
| POST   | `/auth/register/complete`   | Complete phone registration               | No            |
| POST   | `/auth/login`               | Login with email/password                 | No            |
| POST   | `/auth/forgot-password`     | Request password reset                    | No            |
| POST   | `/auth/verify-otp`          | Verify password reset OTP                 | No            |
| POST   | `/auth/reset-password`      | Reset password with token                 | No            |
| GET    | `/auth/verify-token`        | Verify JWT token                          | Yes           |

### Ping Routes

_(Details to be documented)_

---

## 🏗️ Architecture Patterns

### Layered Architecture

```
Routes Layer (routes/)
    ↓
Controllers Layer (controllers/)
    ↓
Services Layer (services/)
    ↓
Database Layer (db/)
```

#### Routes Layer

- Defines API endpoints
- Applies middleware (rate limiting, etc.)
- Maps HTTP requests to controller functions

#### Controllers Layer

- Handles HTTP request/response
- Validates request data
- Calls service layer for business logic
- Formats and returns responses
- Uses constants from `constants/messages.ts`

#### Services Layer

- Contains business logic
- Database operations
- Data transformations
- No HTTP-specific code

#### Database Layer

- MongoDB connection management
- Query execution
- Connection pooling

### Middleware

#### Rate Limiting (`middleware/rateLimit.ts`)

- Protects login endpoint from brute force
- Tracks failed login attempts
- IP-based rate limiting

---

## 🔧 Configuration & Constants

### Environment Variables

```
MONGO_URI=mongodb://localhost:27017/ping-parent
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3000
```

### Collection Names (`config/collections.ts`)

```typescript
export const COLLECTIONS = {
  USERS: "users",
  PINGS: "pings",
  ROLES: "roles",
  PASSWORD_RESETS: "password_resets",
  PHONE_REGISTRATIONS: "phone_registrations",
};
```

### Messages Constants (`constants/messages.ts`)

Centralized error and success messages:

- `ERROR_MESSAGES` - All error messages categorized by type
- `SUCCESS_MESSAGES` - Success response messages
- `ERROR_CODES` - Error code constants

**Benefits:**

- Single source of truth for all messages
- Easy to update and maintain
- Consistent messaging across application
- Type-safe with IDE autocomplete

---

## 🛡️ Security Features

1. **Password Hashing**

   - bcrypt with 10 salt rounds
   - Passwords never stored in plain text

2. **JWT Authentication**

   - Signed tokens with secret key
   - Token expiration
   - Refresh token support

3. **Rate Limiting**

   - Login endpoint protected
   - Failed attempt tracking

4. **Phone Number Normalization**

   - Consistent format: `+12345678900`
   - Validation before storage

5. **Email Validation**

   - Format validation
   - Case normalization (lowercase)

6. **OTP Expiration**
   - Phone registration OTP: 10 minutes
   - Password reset OTP: 10 minutes
   - Reset token: 60 minutes

---

## 🧪 Testing

### Test Structure

- Integration tests: Full request/response cycle
- Unit tests: Individual function testing
- Test files in `src/__tests__/`

### Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

---

## 🚀 Running the Application

### Development

```bash
npm run dev
```

Runs with `ts-node-dev` for hot reload.

### Production

```bash
npm run build
npm run prod
```

Compiles TypeScript and runs compiled JavaScript.

---

## 📋 Key Design Decisions

1. **No ORM/ODM**

   - Direct MongoDB driver usage
   - More control over queries
   - Better performance understanding

2. **Phone-Based Registration**

   - Modern UX without password requirement
   - OTP verification for security
   - 3-step process for clear separation of concerns

3. **Centralized Constants**

   - All messages in `constants/messages.ts`
   - Easier maintenance and consistency
   - Better developer experience

4. **JWT Authentication**

   - Stateless authentication
   - Scalable across multiple servers
   - Refresh token support for better UX

5. **TypeScript**
   - Type safety
   - Better IDE support
   - Easier refactoring

---

## 🔄 Future Considerations

- [ ] SMS integration for OTP delivery (Twilio, AWS SNS)
- [ ] Phone-based login (OTP-only authentication)
- [ ] Email verification flow completion
- [ ] Role-based access control (RBAC) middleware
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Logging system (Winston, Morgan)
- [ ] Error tracking (Sentry)
- [ ] Rate limiting improvements
- [ ] Database indexing strategy
- [ ] Caching layer (Redis)
- [ ] API versioning

---

## 📞 API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message" | {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

---

## 📝 Notes

- All phone numbers stored in normalized format: `+[country][number]`
- Emails stored in lowercase
- OTP codes are 6 digits
- Development mode exposes OTP in response (remove in production)
- Privacy-focused: Password reset always returns success regardless of email existence
