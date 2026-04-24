# Product-Logic Format

This is the canonical template for `spec/product-logic/*.md` files.
Every file produced by `gen-product-spec` must follow this structure exactly —
`impl-feature` reads it directly and depends on the section names and ordering.

---

## Template

```markdown
# <Feature Name>

## Overview
<One paragraph. State what the feature does, who the actors are, and any
external services it relies on. Do not list endpoints here.>

---

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/resource` | None | <verb phrase> |
| GET | `/api/resource` | Bearer | <verb phrase> |

---

## Flow: <Operation Name>

1. <Step>
2. ...

## Flow: <Another Operation>

1. <Step>
2. ...

---

## External Services

| Service | Used For | File | How to Swap |
|---------|----------|------|-------------|
| Twilio | Send & verify OTP | `src/shared/services/twilio-otp.service.ts` | Replace `sendOtp()` and `verifyOtp()` |

---

## Key Rules

- <Business invariant>
- <Constraint or edge case>
```

> Omit `External Services` section entirely if the feature has none.

---

## Section Guidance

### Feature Name
Match the domain noun, not the HTTP resource. Use title case.
Examples: `Auth`, `School Events`, `Driver Reviews`, `Subscription Plan`

### Overview
One paragraph only. Cover: what it does, who the actors are, any third-party
services used. Do not mention file names, module paths, or collection names.

### Endpoints
- `Auth` column values: `None` (public), `Bearer` (any logged-in user), `Admin` (admin/superadmin only), `School Admin`
- Use the exact path the client will call — include URL params like `:id`
- `Purpose` is a short verb phrase: "Send OTP to phone", "Fetch driver profile"
- Order: public endpoints first, then Bearer, then Admin

### Flow: \<Name\>
- Write one `Flow:` section per logical operation / endpoint group
- Name matches the operation: `Register`, `Login`, `Create Plan`, `List Events`, `Delete`
- Steps are numbered, one line each — no prose paragraphs
- Mention guard checks explicitly: "Check phone does NOT already exist → error if taken (CONFLICT)"
- Mention external service calls explicitly: "Call `Twilio.sendOtp(phone)`"
- End with the response: "Return `201 CREATED` with new document" or "Return `{ token, user }`"
- Keep each flow to 12 steps or fewer

### External Services
- Only include when a shared service wrapper in `src/shared/services/` is called
- `File` column: exact path of the shared service file
- `How to Swap` column: the specific function names to replace

### Key Rules
- Business invariants only — things `impl-feature` cannot infer from the flow steps
- Soft-delete pattern: `"Users are never hard-deleted — only deactivated (is_active: false)"`
- Default values, auto-created related records, rate limits, role constraints
- Do NOT repeat information already stated in the flows

---

## DBML Cross-Reference Rules

When generating the spec:

1. For every collection the flows mention, verify the table exists in `skolo.dbml`
2. If a DBML table has `is_active` → assume soft-delete; do NOT ask the user
3. Note `ref:` relationships that imply auto-creation (e.g., `parents.user_id → users`)
4. If a flow requires a field not in any DBML table, add a Key Rules bullet:
   - `<field_name> field does not exist yet on <table> — impl-feature must add it`

---

## New Collections

If the feature needs a collection not present in DBML, add a Key Rules bullet:

- `<collection_name>` collection does not exist yet — `impl-feature` must add it to DBML and `collections.ts`

Do NOT design the full schema here. Keep schema decisions in DBML.

---

## Example (Auth)

```markdown
# Auth

## Overview

Phone-based authentication using OTP. Users register or log in with their phone
number — no email or password. Twilio sends and verifies the OTP. On success,
a JWT access token is issued. Roles are PARENT (default) or DRIVER.

---

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register/send-otp` | None | Send OTP to new phone number |
| POST | `/auth/register/verify-otp` | None | Verify OTP, create user, return JWT |
| POST | `/auth/login/send-otp` | None | Send OTP to existing phone number |
| POST | `/auth/login/verify-otp` | None | Verify OTP, return JWT |
| POST | `/auth/logout` | None | Stateless logout |
| GET | `/auth/users` | Admin | List all users |

---

## Flow: Register

1. Client sends `phone` and optional `countryCode` (default `+91`)
2. Normalize phone number
3. Check phone does NOT already exist → error if taken (CONFLICT)
4. Call `Twilio.sendOtp(phone)`
5. Client sends `phone` + `otp` + optional `role`
6. Call `Twilio.verifyOtp(phone, otp)` → error if invalid
7. Create user with `phone_number`, `user_type`, `is_active: true`
8. Auto-create parent profile via `createParentProfile(userId)`
9. Generate JWT via `generateAccessToken({ userId, role })`
10. Return `{ token, user, isNewUser: true }`

---

## External Services

| Service | Used For | File | How to Swap |
|---------|----------|------|-------------|
| Twilio | Send & verify OTP | `src/shared/services/twilio-otp.service.ts` | Replace `sendOtp()` and `verifyOtp()` |
| JWT | Issue & validate tokens | `src/shared/services/token.service.ts` | Replace `generateAccessToken()` and `verifyAccessToken()` |

---

## Key Rules

- Phone number is the only user identifier — no email or password
- Default role is PARENT; pass `role=driver` at registration to create a DRIVER
- Parent profile is auto-created on first registration
- Users are never hard-deleted — only deactivated (`is_active: false`)
```
