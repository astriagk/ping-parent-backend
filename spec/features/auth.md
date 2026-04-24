# Auth

## Overview

Phone-based authentication using OTP. Users register or log in with their phone number — no email or password. Twilio sends and verifies the OTP. On success, a JWT access token is issued. Roles are PARENT (default) or DRIVER. Admin endpoints manage user activation state.

---

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register/send-otp` | None | Send OTP to new phone number |
| POST | `/auth/register/verify-otp` | None | Verify OTP, create user, return JWT |
| POST | `/auth/login/send-otp` | None | Send OTP to existing phone number |
| POST | `/auth/login/verify-otp` | None | Verify OTP, return JWT |
| POST | `/auth/verify` | Bearer token | Validate token or refresh if expired |
| POST | `/auth/logout` | None | Stateless logout |
| GET | `/auth/roles` | None | List available roles |
| GET | `/auth/users` | Admin | All users with profiles |
| PUT | `/auth/users/:id/activate` | Admin | Activate a user |
| PUT | `/auth/users/:id/deactivate` | Admin | Deactivate a user |

---

## Flow: Register

1. Client sends `phone` (+ optional `countryCode`, default `+91`)
2. Normalize phone number
3. Check phone does NOT already exist → error if taken (CONFLICT)
4. Call `Twilio.sendOtp(phone)` → Twilio delivers OTP to device
5. Client sends `phone` + `otp` (+ optional `role`)
6. Call `Twilio.verifyOtp(phone, otp)` → error if invalid
7. Create user: `phone_number`, `user_type` (DRIVER if role=driver, else PARENT), `is_active: true`
8. Auto-create parent profile via `createParentProfile(userId)`
9. Generate JWT via `generateAccessToken({ userId, role })`
10. Return `{ token, user, isNewUser: true }`

## Flow: Login

1. Client sends `phone` (+ optional `countryCode`)
2. Normalize phone number
3. Check phone DOES exist → error if not found (NOT_FOUND)
4. Call `Twilio.sendOtp(phone)`
5. Client sends `phone` + `otp`
6. Call `Twilio.verifyOtp(phone, otp)` → error if invalid
7. Fetch user by phone
8. Generate JWT
9. Return `{ token, user }`

## Flow: Token Verify / Refresh

1. Client sends `Authorization: Bearer <token>` header
2. Call `verifyAccessToken(token)`
3. If valid → return `{ userId, role, tokenValid: true }`
4. If expired → read `X-Refresh-Token` header
5. Verify refresh token → generate new access token
6. Return `{ userId, role, tokenValid: true, newToken }`

## Flow: Logout

1. Client calls POST `/auth/logout`
2. Server returns success — no server-side state to clear
3. Client is responsible for discarding the token

---

## External Services

| Service | Used For | File | How to Swap |
|---------|----------|------|-------------|
| Twilio | Send & verify OTP | `src/shared/services/twilio-otp.service.ts` | Replace `sendOtp()` and `verifyOtp()` implementations in this file |
| JWT | Issue & validate tokens | `src/shared/services/token.service.ts` | Replace `generateAccessToken()` and `verifyAccessToken()` in this file |

---

## Key Rules

- Phone number is the only user identifier — no email or password
- Default role is `PARENT`; pass `role=driver` at registration to create a DRIVER
- Parent profile is auto-created on first registration
- Users are never hard-deleted — only deactivated (`is_active: false`)
- Register requires a phone that does NOT exist; login requires a phone that DOES exist
- Rate limiter is applied to the login endpoint
- Token refresh requires both an expired access token AND a valid refresh token in headers
