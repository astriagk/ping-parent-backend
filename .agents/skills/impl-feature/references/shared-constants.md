# Shared Constants — What Exists and How to Use It

All shared constants live in `src/shared/constants/` and are re-exported from `src/shared/constants/index.ts`.

Import pattern: `import { THING } from "@shared/constants"`

---

## Collections (`collections.ts`)

Two exports per collection:
1. The `COLLECTIONS` object: `COLLECTIONS.SUBSCRIPTION_PLANS = "subscription_plans"`
2. A named constant: `export const SUBSCRIPTION_PLANS_COLLECTION = COLLECTIONS.SUBSCRIPTION_PLANS`

**Always use the named constant in repository constructors:**
```ts
super(SUBSCRIPTION_PLANS_COLLECTION)  // correct
super(COLLECTIONS.SUBSCRIPTION_PLANS) // also valid but less idiomatic
super("subscription_plans")           // never do this
```

All DBML tables already have corresponding constants. Check the file before assuming one is missing.

---

## Messages (`messages.ts`)

### `SUCCESS_MESSAGES_COMMON`
7 generic messages for standard CRUD — use these before creating feature-specific ones:
- `LIST_FETCHED` — for GET list endpoints
- `RESOURCE_FETCHED` — for GET single endpoints
- `RESOURCE_CREATED` — for POST create
- `RESOURCE_UPDATED` — for PATCH/PUT update
- `RESOURCE_DELETED` — for DELETE
- `RESOURCE_ACTION_FAILED` — for failed operations

### `ERROR_MESSAGES.<MODULE>`
Per-feature error sub-objects. Each module has a block:
```ts
SUBSCRIPTION_PLAN: {
  NOT_FOUND: "Subscription plan not found",
  ALREADY_EXISTS: "...",
}
```

### `SUCCESS_MESSAGES.<MODULE>`
Per-feature non-CRUD success messages. Only add when `SUCCESS_MESSAGES_COMMON` is insufficient.

### `DEV_MESSAGES`
Dev/test environment only messages (e.g., "OTP bypass active").

### `ERROR_CODES`
Machine-readable error codes (string constants). Add when the frontend needs to handle specific errors programmatically.

---

## Validation Messages (`validationMessages.ts`)

Field-level Joi validation error strings. Separate from `messages.ts`.

Structure:
```ts
SUBSCRIPTION_PLAN: {
  PLAN_NAME_REQUIRED: "Plan name is required",
  PRICE_MIN: "Price must be at least 0",
}
```

Used inside `.validation.ts` Joi schemas, not in controllers.

---

## Message Templates (`messageTemplates.ts`)

Dynamic template functions that accept runtime parameters:
```ts
NOTIFICATION: {
  STUDENT_PICKED: (studentName: string) => `${studentName} has been picked up`,
}
```

Use when a message needs variable interpolation. Import: `import { messageTemplates } from "@shared/constants"`.

---

## Enums (`enums.ts`)

30+ enums covering all domain values. Key ones:

| Enum | Values |
|------|--------|
| `UserRole` | parent, driver, school_admin, admin, superadmin |
| `ApprovalStatus` | pending, approved, rejected |
| `AssignmentStatus` | active, inactive, pending, parent_requested, rejected |
| `AssignmentSource` | parent, school_admin, system |
| `AttendanceStatus` | present, absent, pending |
| `TripStatus` | scheduled, started, in_progress, completed, cancelled |
| `TripType` | pickup, drop |
| `PaymentStatus` | pending, completed, failed, refunded |
| `PlanType` | monthly, quarterly, yearly |
| `SubscriptionStatus` | active, expired, cancelled, paused |
| `DeviceType` | android, ios, web |
| `Gender` | male, female, other |
| `VehicleType` | van, auto, bus |
| `NotificationType` | pickup_started, approaching, picked_up, dropped, absent, trip_started, trip_completed, payment_due, general |
| `TicketStatus` | open, in_progress, resolved, closed |
| `TicketPriority` | low, medium, high, urgent |

---

## HTTP Status (`httpStatus.ts`)

`HTTP_STATUS.OK`, `HTTP_STATUS.CREATED`, `HTTP_STATUS.BAD_REQUEST`, `HTTP_STATUS.UNAUTHORIZED`, `HTTP_STATUS.FORBIDDEN`, `HTTP_STATUS.NOT_FOUND`, `HTTP_STATUS.CONFLICT`, `HTTP_STATUS.INTERNAL_SERVER_ERROR`, etc.

---

## Shared Services (`src/shared/services/`)

Import directly from the service file path when needed:

| Service File | Purpose | Import Path |
|---|---|---|
| `twilio-otp.service.ts` | Send and verify OTPs via Twilio | `@shared/services/twilio-otp.service` |
| `fcm.service.ts` | Send FCM push notifications | `@shared/services/fcm.service` |
| `redis.service.ts` | Cache get/set/delete, session storage | `@shared/services/redis.service` |
| `broadcast.service.ts` | Socket.IO room-based broadcast events | `@shared/services/broadcast.service` |
| `geo-util.service.ts` | Distance calculation, coordinate math | `@shared/services/geo-util.service` |
| `googlemaps-api.service.ts` | Google Maps Directions & route optimization | `@shared/services/googlemaps-api.service` |
| `file-storage.service.ts` | Upload/delete files (delegates to storage.factory) | `@shared/services/file-storage.service` |
| `socket.service.ts` | Raw Socket.IO server instance access | `@shared/services/socket.service` |
| `token.service.ts` | Generate and verify JWT access/refresh tokens | `@shared/services/token.service` |

---

## NotificationDispatcher (`src/modules/notification/notification.dispatcher.ts`)

Static class with pre-built methods for each notification type. Handles FCM push + Socket.IO event + DB record atomically. Use this instead of calling FCM and Socket separately.

```ts
import { NotificationDispatcher } from "@modules/notification";
await NotificationDispatcher.notifyStudentPickedUp(parentUserId, tripId, studentId, studentName);
await NotificationDispatcher.notifyTripStarted(driverId, tripId);
```
