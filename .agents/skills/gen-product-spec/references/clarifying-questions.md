# Clarifying Questions — Decision Guide

This file gives the agent the exact logic for Phase 6 of `gen-product-spec`.
Ask a question ONLY if it cannot be answered from: the user's description,
the DBML, or `enums.ts`. Collect all unanswered questions into ONE numbered
list and send them in a single message. Wait for answers before writing the spec.

---

## Q1 — Actors / Roles

**Ask if:** the description mentions multiple user types or an endpoint group
whose caller is ambiguous.

**Skip if:** description explicitly names who does what (e.g., "admin manages X",
"parent views Y", "driver updates Z").

**Context to give the user:** list the four roles from `enums.ts → UserRole`:
`parent`, `driver`, `school_admin`, `admin` / `superadmin`.

---

## Q2 — Auth Requirement

**Ask if:** it's unclear whether an endpoint is public, requires a logged-in user,
or is admin-only.

**Skip if:** the actor makes it obvious:
- `admin` → Admin auth
- any named logged-in user → Bearer
- explicitly described as "public" or "no login required" → None

**Auth levels to offer:**
- `None` — public, no token required
- `Bearer` — any authenticated user
- `Admin` — admin / superadmin only
- `School Admin` — school_admin role

---

## Q3 — External Services

**Ask if:** the feature description implies OTP, push notifications, file uploads,
payments, or routing but does NOT name the provider.

**Skip if:** description explicitly names Twilio, FCM, Razorpay, or Google Maps.
**Skip if:** no such service is implied by the feature.

**Available shared services:**
| Need | Service | Shared File |
|------|---------|-------------|
| OTP verification | Twilio | `src/shared/services/twilio-otp.service.ts` |
| Push notifications | FCM | via `NotificationDispatcher` |
| Payments / subscriptions | Razorpay | `src/modules/billing/razorpay/` |
| Maps / routing | Google Maps | `src/shared/services/googlemaps-api.service.ts` |
| File uploads | File storage | `src/shared/services/file-storage.service.ts` |

---

## Q4 — Soft-Delete vs Hard-Delete

**Ask if:** the feature removes records AND the relevant DBML table does NOT
have an `is_active` field.

**Skip if:** the DBML table has `is_active` → default to soft-delete silently.
**Skip if:** the description explicitly states "soft delete" or "permanent delete".

---

## Q5 — Pagination

**Ask if:** there is a list endpoint and the description does not mention
pagination, cursor, page/limit params, or "all records".

**Skip if:** description says "list all", "no pagination needed", or gives
explicit page/limit parameters.

---

## Q6 — Missing Fields

**Ask if:** the flow steps require a field that is not on any DBML table and
cannot be reasonably inferred from the description.

**Skip if:** all required fields are either in DBML or obviously derivable
(e.g., `name`, `phone_number`, `created_at`).

**Do not ask for the full schema** — just confirm the field names and types.
The schema belongs in DBML, not in the product-logic spec.

---

## Q7 — New Collections

**Ask if:** the feature clearly requires a data store that does not exist in
`skolo.dbml` (e.g., "store event RSVPs" and no `event_rsvps` table exists).

**Skip if:** all implied collections map to existing DBML tables.

**What to ask:** confirm the collection name only. Do NOT design the schema here —
add a Key Rules bullet and let `impl-feature` handle the schema.

---

## Batch Rule

Never ask questions one at a time. Collect ALL unanswered questions into a
single numbered list and send them in one message. Wait for the user's complete
answers before proceeding to Phase 7.
