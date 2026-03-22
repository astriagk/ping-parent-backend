# Adding New Things — Decision Guide

Use this when a feature needs something that doesn't exist yet in the shared layer.

---

## New External Service / Integration

**Step 1:** Check `src/shared/services/` — does a service for this already exist?
- Twilio → `twilio-otp.service.ts`
- FCM / push → `fcm.service.ts`
- Payments → check `src/modules/billing/razorpay/`
- Google Maps / routing → `googlemaps-api.service.ts`
- File uploads → `file-storage.service.ts`
- Redis → `redis.service.ts`

**Step 2:** If it exists → import and use it directly. Never reimplement.

**Step 3:** If it doesn't exist → create `src/shared/services/<name>.service.ts` following the existing service file pattern. Never put external integration logic inside a module's `.service.ts`.

---

## New Message

Route to the correct location based on type:

| Scenario | Where to Add | File |
|----------|-------------|------|
| Standard CRUD result (created, updated, deleted, fetched, listed) | Use `SUCCESS_MESSAGES_COMMON.*` — never duplicate | `messages.ts` (read-only) |
| Feature-specific error (e.g., "Event not found", "Already registered") | Add to `ERROR_MESSAGES.<MODULE>` block (alphabetical order) | `messages.ts` |
| Feature-specific non-CRUD success (e.g., "OTP sent successfully") | Add to `SUCCESS_MESSAGES.<MODULE>` block (alphabetical order) | `messages.ts` |
| Dynamic text with runtime variables (e.g., student name in push notification) | Add template function to `messageTemplates.ts` under a module group | `messageTemplates.ts` |
| Dev/test only (e.g., "OTP bypass: 000000 accepted") | Add to `DEV_MESSAGES` | `messages.ts` |
| Joi field validation error (e.g., "Name is required", "Price must be > 0") | Add to `VALIDATION_MESSAGES.<MODULE>` — NOT in `messages.ts` | `validationMessages.ts` |

When adding a new `<MODULE>` block to `messages.ts` or `validationMessages.ts`, insert it in **alphabetical order** among existing module blocks.

---

## New Enum

**Step 1:** Read `src/shared/constants/enums.ts` — search for an equivalent.

Common overlaps to check:
- Status values → look for existing `*Status` enums
- Type values → look for existing `*Type` enums
- Role values → `UserRole`, `AdminRole`
- Source/origin values → `AssignmentSource`

**Step 2:** If equivalent exists → reuse it. Never create a module-local duplicate.

**Step 3:** If it doesn't exist → add it to `enums.ts`:
- Use PascalCase enum name
- Insert in **alphabetical order** by enum name
- Values use `snake_case` strings matching what's stored in MongoDB

**Step 4:** After adding, run `/extract-enums` to verify no inline enum-like strings were missed elsewhere.

---

## New Collection

**Step 1:** Check if the collection corresponds to a DBML table in `spec/database/skolo.dbml`.

**If YES (DBML table exists):**
- The collection constant likely already exists in `src/shared/constants/collections.ts`
- If it doesn't, run `/sync-collections` — it reads the DBML and generates all missing constants automatically
- Never add a DBML-backed collection manually

**If NO (code-only collection, not in DBML):**
- Add manually to `src/shared/constants/collections.ts`:
  ```ts
  // Inside COLLECTIONS object:
  MY_THING: "my_things",

  // Named export at the bottom:
  export const MY_THING_COLLECTION = COLLECTIONS.MY_THING;
  ```
- Never hardcode the collection name string anywhere else

---

## New Route Gateway

The 8 existing gateways in `src/routes/` cover all roles:

| Gateway File | Auth Middleware | For |
|---|---|---|
| `auth.routes.ts` | None | Login, OTP, register |
| `public.routes.ts` | None | Unauthenticated endpoints |
| `shared.routes.ts` | None or flexible | Shared across roles |
| `parent.routes.ts` | `verifyParentToken` | Parent app endpoints |
| `driver.routes.ts` | `verifyDriverToken` | Driver app endpoints |
| `admin.routes.ts` | `verifyAdminOrAboveToken` | Admin portal endpoints |
| `superadmin.routes.ts` | Superadmin-only | Superadmin-only endpoints |
| `school-admin.routes.ts` | School admin token | School admin portal |

**Always wire new endpoints into an existing gateway file.** Never create a new gateway file.

If an endpoint is accessible by multiple roles, wire it once per applicable gateway file.

---

## New Shared Utility

If a helper function will be used by 2+ modules and has no domain logic:
- Add to `src/shared/utils/helpers.ts` (already has 20+ utilities)
- Export it from `src/shared/utils/index.ts`

If it's domain-specific — keep it in the module's `.service.ts` or as a local helper in that file.
