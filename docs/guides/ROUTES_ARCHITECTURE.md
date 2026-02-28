# Ping Parent Backend — Role-Scoped Routes Architecture

**Version:** 1.1.0
**Last Updated:** 2026-02-23
**Status:** Proposed — reference for all new route development

---

## Table of Contents

1. [The Problem](#the-problem)
2. [Two-Layer Design](#two-layer-design)
3. [New Folder Structure](#new-folder-structure)
4. [URL Convention](#url-convention)
5. [Gateway Middleware Pattern](#gateway-middleware-pattern)
6. [Handler-Group Export Pattern](#handler-group-export-pattern)
7. [Handling Shared APIs](#handling-shared-apis)
8. [Detecting Unused APIs](#detecting-unused-apis)
9. [Admin Sub-Role Architecture](#admin-sub-role-architecture)
10. [Before vs After: Full Example](#before-vs-after-full-example)
11. [Route Mapping Table](#route-mapping-table)
12. [Migration Strategy](#migration-strategy)
13. [Quick Reference: Where Does a New Endpoint Go?](#quick-reference)

---

## The Problem

The current `src/routes/index.ts` mounts routes by **feature domain** (trips, assignments,
payments). Inside each feature's `*.routes.ts` file, routes for multiple roles are mixed
together with different auth middleware, making it hard to answer basic questions:

```
❓ "What APIs can a parent call?"       → Must scan 10+ route files
❓ "Is this endpoint used anywhere?"    → Hard to trace without grepping
❓ "Who can call /driver-student-assignments?" → Three different middleware in one file
❓ "Where does my new admin endpoint go?" → Unclear convention
```

**Root cause:** A single routes file like `driver_student_assignment.routes.ts` serves
three separate concerns — parent access, driver access, and admin access — mixed with three
different auth middleware (`verifyToken_Middleware`, `verifyDriverToken`, `verifyAdminToken`).

---

## Two-Layer Design

The solution separates routing into two distinct layers:

```
┌────────────────────────────────────────────────────────────────┐
│  ROUTES LAYER  (src/routes/)                                   │
│  ─────────────────────────────────────────────────────────────  │
│  Owns: auth decisions, URL structure, role access              │
│  Organized by: ROLE (parent / driver / admin)                  │
│                                                                │
│  parent.routes.ts       ──── verifyParentToken       (once) ── │
│  driver.routes.ts       ──── verifyDriverToken       (once) ── │
│  admin.routes.ts        ──── verifyAdminOrAboveToken (once) ── │
│  superadmin.routes.ts   ──── verifySuperadminToken   (once) ── │
│  school-admin.routes.ts ──── verifySchoolAdminToken  (once) ── │
└───────────────┬────────────────────────────────────────────────┘
                │  imports handler groups
                ▼
┌────────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER  (src/modules/)                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Owns: business logic, data access, types, validation          │
│  Organized by: DOMAIN (trips / billing / users)                │
│                                                                │
│  [feature].controller.ts   — request handlers                 │
│  [feature].repository.ts   — MongoDB queries                  │
│  [feature].service.ts      — complex business logic           │
│  [feature].type.ts         — TypeScript types                 │
│  [feature].validation.ts   — Joi schemas                      │
│  [feature].routes.ts       — handler group exports (no auth)  │
└────────────────────────────────────────────────────────────────┘
```

**Domain layer files are unchanged.** Only `[feature].routes.ts` changes its shape (from
Express Router export to named handler group export). All controllers, repositories,
services, types, and validations stay exactly as-is.

---

## New Folder Structure

```
src/
├── routes/                              ← ROUTES LAYER (new structure)
│   ├── index.ts                         # Main aggregator: mounts all role gateways
│   ├── auth.routes.ts                   # Public: OTP send/verify, token refresh
│   ├── public.routes.ts                 # No-auth: subscription plan listing, driver ratings, razorpay config
│   ├── shared.routes.ts                 # Any valid token (parent or driver): notifications, tracking reads
│   ├── parent.routes.ts                 # verifyParentToken        → all parent endpoints
│   ├── driver.routes.ts                 # verifyDriverToken        → all driver endpoints
│   ├── admin.routes.ts                  # verifyAdminOrAboveToken  → admin + superadmin shared ops
│   ├── superadmin.routes.ts             # verifySuperadminToken    → superadmin-only platform ops
│   └── school-admin.routes.ts           # verifySchoolAdminToken   → school_admin scoped ops
│
└── modules/                             ← DOMAIN LAYER (structure unchanged)
    ├── auth/
    │   ├── auth.controller.ts           # UNCHANGED
    │   ├── auth.routes.ts               # CHANGES → handler group export
    │   └── ...
    ├── trips/
    │   ├── trip/
    │   │   ├── trip.controller.ts       # UNCHANGED
    │   │   ├── trip.routes.ts           # CHANGES → handler group export
    │   │   └── ...
    │   ├── driver_student_assignment/
    │   │   ├── driver_student_assignment.controller.ts  # UNCHANGED
    │   │   ├── driver_student_assignment.routes.ts      # CHANGES → handler group export
    │   │   └── ...
    │   └── ...
    ├── billing/
    │   ├── payment/
    │   │   ├── payment.controller.ts    # UNCHANGED
    │   │   ├── payment.routes.ts        # CHANGES → handler group export
    │   │   └── ...
    │   └── ...
    └── ...
```

---

## URL Convention

The URL prefix signals the required role. No more guessing which middleware applies.

```
/api/auth/*                    Public: OTP, login, token refresh
/api/public/*                  No auth required: plan listing, driver ratings
/api/shared/*                  Any authenticated user (parent or driver)

/api/parent/*                  Parent role only  (verifyParentToken)
  /api/parent/profile
  /api/parent/address
  /api/parent/students
  /api/parent/trips
  /api/parent/assignments
  /api/parent/qr-otp
  /api/parent/payments
  /api/parent/subscriptions
  /api/parent/redemptions
  /api/parent/notifications
  /api/parent/reviews

/api/driver/*                  Driver role only  (verifyDriverToken)
  /api/driver/profile
  /api/driver/address
  /api/driver/documents
  /api/driver/availability
  /api/driver/trips
  /api/driver/trip-students
  /api/driver/assignments
  /api/driver/qr-otp
  /api/driver/tracking
  /api/driver/notifications

/api/admin/*                   admin + superadmin  (verifyAdminOrAboveToken)
  /api/admin/auth              (login, setup — public sub-routes inside)
  /api/admin/schools           (create, update, view all schools)
  /api/admin/school-drivers    (manage school-assigned drivers)
  /api/admin/school-assignments
  /api/admin/users             (view all parents, drivers, approve drivers)
  /api/admin/trips             (view all trips platform-wide)
  /api/admin/assignments       (view all driver-student assignments)
  /api/admin/payments          (view all payments)
  /api/admin/subscriptions     (view all parent subscriptions)
  /api/admin/school-subscriptions
  /api/admin/subscription-plans  (create, update plans)
  /api/admin/tracking/cleanup
  /api/admin/audit-logs        (view audit logs)
  /api/admin/roles             (view roles)

/api/superadmin/*              superadmin only  (verifySuperadminToken)
  /api/superadmin/admins       (create, update, deactivate admin accounts)
  /api/superadmin/roles        (create, update, delete roles)
  /api/superadmin/audit-logs   (full audit log access including admin actions)

/api/school-admin/*            school_admin only  (verifySchoolAdminToken)
  /api/school-admin/school     (view/update their own school)
  /api/school-admin/drivers    (drivers assigned to their school)
  /api/school-admin/students   (students in their school)
  /api/school-admin/trips      (trips for their school)
  /api/school-admin/subscription (their school's subscription)
```

---

## Gateway Middleware Pattern

Each role gateway file applies its auth middleware **once** at the top of the router.
Every route defined below that line automatically inherits it — no need to repeat
`verifyParentToken` on 20 individual routes.

```typescript
// src/routes/parent.routes.ts

import { Router } from "express";
import { verifyParentToken } from "@shared/middlewares";
import { parentHandlers }       from "@modules/users/parent/parent.routes";
import { studentHandlers }      from "@modules/users/student/student.routes";
import { assignmentHandlers }   from "@modules/trips/driver_student_assignment/driver_student_assignment.routes";
import { tripHandlers }         from "@modules/trips/trip/trip.routes";
import { paymentHandlers }      from "@modules/billing/payment/payment.routes";
import { subscriptionHandlers } from "@modules/billing/parent_subscription/parent_subscription.routes";
import { redemptionHandlers }   from "@modules/billing/redemption/redemption.routes";
import { reviewHandlers }       from "@modules/reviews/rating_review.routes";
import { qrOtpHandlers }        from "@modules/trips/daily_qr_otp/daily_qr_otp.routes";

const router = Router();

// ✅ Auth applied ONCE — all routes below require parent token
router.use(verifyParentToken);

// --- Profile ---
router.get("/profile",          parentHandlers.getProfile);
router.put("/profile",          parentHandlers.validateUpdate, parentHandlers.updateProfile);
router.get("/address",          parentHandlers.getAddress);
router.put("/address",          parentHandlers.validateAddress, parentHandlers.updateAddress);

// --- Students ---
router.get("/students",         studentHandlers.getMyStudents);
router.post("/students",        studentHandlers.validateCreate, studentHandlers.create);
router.put("/students/:id",     studentHandlers.validateUpdate, studentHandlers.update);
router.delete("/students/:id",  studentHandlers.delete);

// --- Trips (read-only for parents) ---
router.get("/trips",            tripHandlers.getMyAllTrips);
router.get("/trips/active",     tripHandlers.getActiveTrips);

// --- Assignments ---
router.post("/assignments",           assignmentHandlers.validateCreate, assignmentHandlers.create);
router.get("/assignments/:id",        assignmentHandlers.getById);
router.get("/assignments/student/:studentId", assignmentHandlers.getByStudent);
router.put("/assignments/:id",        assignmentHandlers.validateUpdate, assignmentHandlers.update);
router.delete("/assignments/:id",     assignmentHandlers.delete);

// --- QR / OTP ---
router.get("/qr-otp/student/:studentId/trip/:tripId", qrOtpHandlers.getForParent);
router.get("/qr-otp/trip/:tripId",                    qrOtpHandlers.getParentOtpForTrip);

// --- Payments ---
router.post("/payments",       paymentHandlers.validateCreate, paymentHandlers.create);
router.get("/payments",        paymentHandlers.getMyPayments);
router.post("/payments/:id/refund", paymentHandlers.refund);

// --- Subscriptions ---
router.get("/subscriptions/recommendations", subscriptionHandlers.getRecommendations);
router.post("/subscriptions",  subscriptionHandlers.validateCreate, subscriptionHandlers.create);
router.get("/subscriptions",   subscriptionHandlers.getMySubscriptions);
router.post("/subscriptions/upgrade", subscriptionHandlers.validateUpgrade, subscriptionHandlers.upgrade);

// --- Redemptions ---
router.post("/redemptions",    redemptionHandlers.validateCreate, redemptionHandlers.create);
router.get("/redemptions",     redemptionHandlers.getMyRedemptions);

// --- Reviews ---
router.post("/reviews",        reviewHandlers.validateCreate, reviewHandlers.create);
router.get("/reviews",         reviewHandlers.getMyReviews);

export default router;
```

Same pattern for `driver.routes.ts` (with `verifyDriverToken`) and `admin.routes.ts`
(with `verifyAdminToken`).

---

## Handler-Group Export Pattern

Module `*.routes.ts` files change from exporting an Express `Router` to exporting a
**named handler group** — a plain object that groups handlers by role or concern. There is
no auth middleware here; that belongs entirely in the routes layer.

```typescript
// src/modules/trips/driver_student_assignment/driver_student_assignment.routes.ts

import { validate } from "@shared/middlewares";
import {
  createDriverStudentAssignment,
  getAllDriverStudentAssignments,
  getAllDrivers,
  getAssignment,
  getAssignmentsByStudent,
  getDriverParentRequestedAssignments,
  getMyActiveAssignments,
  getMyAssignments,
  getMyPendingAssignments,
  getParentRequestedAssignmentsData,
  approveDriverStudentAssignment,
  rejectDriverStudentAssignment,
  deactivateDriverStudentAssignment,
  updateDriverStudentAssignment,
  deleteDriverStudentAssignment,
} from "./driver_student_assignment.controller";
import {
  createDriverStudentAssignmentSchema,
  updateDriverStudentAssignmentSchema,
} from "./driver_student_assignment.validation";

/**
 * Handler group for driver_student_assignment.
 * Import this in routes/parent.routes.ts, routes/driver.routes.ts, routes/admin.routes.ts.
 * NO auth middleware lives here.
 */
export const assignmentHandlers = {
  // Shared (parent and driver both call these — controller branches on req.user.role)
  validateCreate: validate(createDriverStudentAssignmentSchema),
  create:         createDriverStudentAssignment,
  getById:        getAssignment,
  getByStudent:   getAssignmentsByStudent,
  getAllDrivers:   getAllDrivers,
  validateUpdate: validate(updateDriverStudentAssignmentSchema),
  update:         updateDriverStudentAssignment,
  delete:         deleteDriverStudentAssignment,

  // Driver-specific
  driver: {
    getAll:             getMyAssignments,
    getPending:         getMyPendingAssignments,
    getActive:          getMyActiveAssignments,
    getParentRequested: getDriverParentRequestedAssignments,
    approve:            approveDriverStudentAssignment,
    reject:             rejectDriverStudentAssignment,
    deactivate:         deactivateDriverStudentAssignment,
  },

  // Admin-specific
  admin: {
    getAll:             getAllDriverStudentAssignments,
    getParentRequested: getParentRequestedAssignmentsData,
  },
};
```

> **Naming guideline:** Name the export `[feature]Handlers`. Sub-objects `driver` and
> `admin` hold role-specific handlers that are only wired in the corresponding gateway.

---

## Handling Shared APIs

Some controllers contain internal role-branching logic (checking `req.user.role` inside the
handler). These handlers are shared between multiple role gateways but remain single
functions.

**Example:** `createDriverStudentAssignment` internally handles both parent-initiated
requests (status: `PARENT_REQUESTED`) and driver-initiated requests (status: `PENDING`).

```typescript
// In parent.routes.ts:
router.post("/assignments", assignmentHandlers.validateCreate, assignmentHandlers.create);
// req.user.role === "parent" inside the service → PARENT_REQUESTED flow

// In driver.routes.ts:
router.post("/assignments", assignmentHandlers.validateCreate, assignmentHandlers.create);
// req.user.role === "driver" inside the service → PENDING flow
```

The **same handler function** is mounted in two different role gateways. No code
duplication — only route registration is duplicated, which is intentional and explicit.

**When to use `shared.routes.ts`:**
Use the shared gateway (with `verifyToken_Middleware`) only for endpoints that are
genuinely role-neutral by design — e.g., notification inbox (both parents and drivers
receive notifications), or tracking position reads (both roles need live position).

---

## Detecting Unused APIs

With role-gateway files as the single source of truth for routing:

1. **Unregistered handlers:** A handler exported from a module's `*.routes.ts` but not
   imported anywhere in `src/routes/` is unrouted. Search `src/routes/` for the function
   name; no results = unused.

2. **Per-role audit:** Open `src/routes/driver.routes.ts`. Every line is a driver endpoint.
   No need to grep across 15 files.

3. **Handler group audit:** If `assignmentHandlers.driver.deactivate` is defined in the
   handler group but never used in `driver.routes.ts`, a search instantly finds the gap.

4. **Recommended convention during migration:** Add a `// TODO: not yet exposed` comment
   next to any handler group key that is defined but not yet wired to a gateway.

---

## Admin Sub-Role Architecture

### The Problem with a Single Admin Gateway

Currently `verifyAdminToken` accepts all three admin roles equally — `superadmin`, `admin`,
and `school_admin` all pass the same check and can hit the same endpoints. Role enforcement
only happens inside service logic, which means:

- A `school_admin` can technically call `POST /api/admin/management` to create another admin
  — only service-layer logic stops them (fragile)
- No way to look at routes and know which admin role can call what
- Adding a new admin role (e.g. `billing_admin`) forces changes spread across every existing
  admin route file

### Three-Gateway Solution

Split the single `admin.routes.ts` into three focused gateways, each with its own
middleware that enforces the exact required role at the HTTP layer — before any controller
or service logic runs.

```
src/routes/
├── admin.routes.ts          # verifyAdminOrAboveToken (admin + superadmin)
├── superadmin.routes.ts     # verifySuperadminToken   (superadmin ONLY)
└── school-admin.routes.ts   # verifySchoolAdminToken  (school_admin ONLY)
```

### New Middleware Functions

Add these to `src/shared/middlewares/auth.middleware.ts`:

```typescript
/**
 * Allows: admin + superadmin
 * Replaces the old verifyAdminToken for most admin routes.
 */
export const verifyAdminOrAboveToken = (req, res, next) => {
  const payload = verifyAdminAccessToken(token);
  if (payload.role !== UserRole.ADMIN && payload.role !== UserRole.SUPERADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ ... });
  }
  req.admin = payload;
  next();
};

/**
 * Allows: superadmin ONLY
 * Use for platform-level operations (creating admins, deleting roles, etc.)
 */
export const verifySuperadminToken = (req, res, next) => {
  const payload = verifyAdminAccessToken(token);
  if (payload.role !== UserRole.SUPERADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ ... });
  }
  req.admin = payload;
  next();
};

/**
 * Allows: school_admin ONLY
 * req.admin.school_id is always present — use it to scope all DB queries.
 */
export const verifySchoolAdminToken = (req, res, next) => {
  const payload = verifyAdminAccessToken(token);
  if (payload.role !== UserRole.SCHOOL_ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ ... });
  }
  req.admin = payload;  // req.admin.school_id is guaranteed here
  next();
};

// Keep the old name as an alias for any truly open admin endpoints
export const verifyAnyAdminToken = verifyAdminToken; // existing function (all 3 roles)
```

### Role Access Matrix

| Operation | school_admin | admin | superadmin |
|---|:---:|:---:|:---:|
| View their own school's data | ✅ | — | — |
| Manage school drivers/students | ✅ | — | — |
| View their school subscription | ✅ | — | — |
| View all schools | — | ✅ | ✅ |
| Create / update a school | — | ✅ | ✅ |
| Approve drivers (platform-wide) | — | ✅ | ✅ |
| View all trips / payments / subscriptions | — | ✅ | ✅ |
| Manage subscription plans | — | ✅ | ✅ |
| Create a school_admin account | — | ✅ | ✅ |
| Create an admin account | — | ❌ | ✅ |
| Deactivate / delete admin accounts | — | ❌ | ✅ |
| Manage roles | — | ❌ | ✅ |
| Full audit log (including admin actions) | — | ❌ | ✅ |

### Gateway File Examples

**`src/routes/admin.routes.ts`** — admin + superadmin shared operations

```typescript
import { Router } from "express";
import { verifyAdminOrAboveToken } from "@shared/middlewares";
// ... handler imports

const router = Router();

// Public sub-routes (login doesn't need auth — handled inline)
router.post("/auth/login",      validate(adminLoginSchema), adminHandlers.login);
router.get("/auth/verify-token", adminHandlers.verifyToken);

// Everything below requires admin or superadmin token
router.use(verifyAdminOrAboveToken);

// Schools
router.get("/schools",           schoolHandlers.admin.getAll);
router.post("/schools",          schoolHandlers.admin.create);
router.put("/schools/:id",       schoolHandlers.admin.update);

// Users (view only — creation of admin accounts is superadmin-only)
router.get("/users",             adminMgmtHandlers.admin.getAllUsers);
router.get("/users/parents/:id", adminMgmtHandlers.admin.getParentDetails);
router.get("/users/drivers/:id", adminMgmtHandlers.admin.getDriverDetails);
router.patch("/users/drivers/:id/approval-status", adminMgmtHandlers.admin.updateDriverApproval);

// Trips
router.get("/trips",             tripHandlers.admin.getAll);

// Billing
router.get("/payments",          paymentHandlers.admin.getAll);
router.get("/subscriptions",     subscriptionHandlers.admin.getAll);

// Audit logs (read-only for admin, full access for superadmin below)
router.get("/audit-logs",        auditLogHandlers.getAll);

export default router;
```

**`src/routes/superadmin.routes.ts`** — platform-level, superadmin only

```typescript
import { Router } from "express";
import { verifySuperadminToken } from "@shared/middlewares";

const router = Router();
router.use(verifySuperadminToken); // ALL routes below: superadmin only

// Admin account management (the things admin role cannot do)
router.get("/admins",                   adminMgmtHandlers.superadmin.getAll);
router.post("/admins",                  adminMgmtHandlers.superadmin.create);
router.put("/admins/:id",               adminMgmtHandlers.superadmin.update);
router.patch("/admins/:id/activate",    adminMgmtHandlers.superadmin.activate);
router.patch("/admins/:id/deactivate",  adminMgmtHandlers.superadmin.deactivate);

// Role management
router.get("/roles",                    roleHandlers.getAll);
router.post("/roles",                   roleHandlers.create);
router.put("/roles/:id",                roleHandlers.update);
router.delete("/roles/:id",             roleHandlers.delete);

// Full audit log (including admin-level actions)
router.get("/audit-logs",               auditLogHandlers.getAll);

export default router;
```

**`src/routes/school-admin.routes.ts`** — school_admin scoped to their school

```typescript
import { Router } from "express";
import { verifySchoolAdminToken } from "@shared/middlewares";

const router = Router();
router.use(verifySchoolAdminToken); // ALL routes below: school_admin only
// req.admin.school_id is guaranteed — use it to scope all queries

// Their school
router.get("/school",            schoolHandlers.schoolAdmin.getMine);       // uses req.admin.school_id
router.put("/school",            schoolHandlers.schoolAdmin.updateMine);    // uses req.admin.school_id

// Drivers in their school
router.get("/drivers",           schoolDriverHandlers.schoolAdmin.getAll);  // filtered by school_id
router.post("/drivers",          schoolDriverHandlers.schoolAdmin.add);

// Students in their school
router.get("/students",          studentHandlers.schoolAdmin.getAll);       // filtered by school_id

// Trips for their school
router.get("/trips",             tripHandlers.schoolAdmin.getAll);          // filtered by school_id

// Subscription for their school
router.get("/subscription",      schoolSubHandlers.schoolAdmin.getMine);    // uses req.admin.school_id

export default router;
```

### Scalability: Adding a New Admin Role

When a new admin role is needed (e.g. `billing_admin` who only manages billing):

1. **Enum** — add `BILLING_ADMIN = "billing_admin"` to `UserRole` in `enums.ts`
2. **Middleware** — add `verifyBillingAdminToken` to `auth.middleware.ts`
3. **Gateway file** — create `src/routes/billing-admin.routes.ts` with `verifyBillingAdminToken`
4. **Mount** — add `router.use("/billing-admin", billingAdminRoutes)` to `src/routes/index.ts`

**Zero changes** to existing gateway files, controllers, repositories, or services.
The new role is completely isolated in its own gateway file.

---

## Before vs After: Full Example

### Before — Mixed roles in one file

`src/modules/trips/driver_student_assignment/driver_student_assignment.routes.ts`

```typescript
// ❌ BEFORE: Who can call what? Three different middleware in one file.
const router = Router();

router.post("/",            verifyToken_Middleware, validate(...), createDriverStudentAssignment);   // parent or driver?
router.get("/all-drivers",  verifyToken_Middleware, getAllDrivers);                                  // who?
router.get("/:id",          verifyToken_Middleware, getAssignment);                                  // who?

router.get("/driver/my-assignments",         verifyDriverToken, getMyAssignments);
router.get("/driver/my-pending-assignments", verifyDriverToken, getMyPendingAssignments);
router.post("/:id/approve",                  verifyDriverToken, approveDriverStudentAssignment);
router.post("/:id/reject",                   verifyDriverToken, rejectDriverStudentAssignment);

router.get("/student/:studentId",  verifyToken_Middleware, getAssignmentsByStudent);                 // who?
router.put("/:id",                 verifyToken_Middleware, validate(...), updateDriverStudentAssignment); // who?
router.delete("/:id",              verifyToken_Middleware, deleteDriverStudentAssignment);           // who?

router.get("/admin/all-assignments", verifyAdminToken, getAllDriverStudentAssignments);
router.get("/admin/my-assignments",  verifyAdminToken, getParentRequestedAssignmentsData);
```

**Problems:**
- `verifyToken_Middleware` hides the actual role intent
- Admin routes are bolted on at the bottom — easy to miss
- Cannot determine "what can a driver do with assignments?" without reading all 13 routes

---

### After — Step 1: Module routes file becomes a handler registry

```typescript
// ✅ AFTER: handler registry, no auth, no Router — pure exports
export const assignmentHandlers = {
  validateCreate: validate(createDriverStudentAssignmentSchema),
  create:         createDriverStudentAssignment,   // role-branching inside the controller
  getById:        getAssignment,
  getByStudent:   getAssignmentsByStudent,
  getAllDrivers:   getAllDrivers,
  validateUpdate: validate(updateDriverStudentAssignmentSchema),
  update:         updateDriverStudentAssignment,
  delete:         deleteDriverStudentAssignment,

  driver: {
    getAll:      getMyAssignments,
    getPending:  getMyPendingAssignments,
    approve:     approveDriverStudentAssignment,
    reject:      rejectDriverStudentAssignment,
  },

  admin: {
    getAll:             getAllDriverStudentAssignments,
    getParentRequested: getParentRequestedAssignmentsData,
  },
};
```

---

### After — Step 2: Three focused gateway files

**`src/routes/parent.routes.ts`** (excerpt — `verifyParentToken` applied at top of file)
```typescript
router.post("/assignments",                    assignmentHandlers.validateCreate, assignmentHandlers.create);
router.get("/assignments/:id",                 assignmentHandlers.getById);
router.get("/assignments/student/:studentId",  assignmentHandlers.getByStudent);
router.put("/assignments/:id",                 assignmentHandlers.validateUpdate, assignmentHandlers.update);
router.delete("/assignments/:id",              assignmentHandlers.delete);
```

**`src/routes/driver.routes.ts`** (excerpt — `verifyDriverToken` applied at top of file)
```typescript
router.post("/assignments",                       assignmentHandlers.validateCreate, assignmentHandlers.create);
router.get("/assignments",                        assignmentHandlers.driver.getAll);
router.get("/assignments/pending",                assignmentHandlers.driver.getPending);
router.get("/assignments/:id",                    assignmentHandlers.getById);
router.post("/assignments/:id/approve",           assignmentHandlers.driver.approve);
router.post("/assignments/:id/reject",            assignmentHandlers.driver.reject);
```

**`src/routes/admin.routes.ts`** (excerpt — `verifyAdminToken` applied at top of file)
```typescript
router.get("/assignments",                        assignmentHandlers.admin.getAll);
router.get("/assignments/parent-requested",       assignmentHandlers.admin.getParentRequested);
```

---

### The payoff

```
"What can a parent do with assignments?"
→ Open src/routes/parent.routes.ts, search "assignments" → 5 lines, instantly clear

"What can a driver do with assignments?"
→ Open src/routes/driver.routes.ts, search "assignments" → 6 lines, instantly clear

"Can an admin view all assignments?"
→ Open src/routes/admin.routes.ts, search "assignments" → yes, GET /admin/assignments

"Is getMyActiveAssignments wired anywhere?"
→ grep "getActive" src/routes/ → driver.routes.ts or not found
```

---

## Route Mapping Table

Every current route and where it moves in the new architecture.

| Current URL | Current auth | New URL | New gateway file |
|---|---|---|---|
| `POST /auth/send-otp` | public | `/auth/send-otp` | `auth.routes.ts` |
| `POST /auth/verify-otp` | public | `/auth/verify-otp` | `auth.routes.ts` |
| `POST /auth/refresh-token` | public | `/auth/refresh-token` | `auth.routes.ts` |
| `DELETE /auth/logout` | `verifyToken` | `/auth/logout` | `auth.routes.ts` |
| `GET /auth/admin/users` | `verifyAdminToken` | `/admin/users` | `admin.routes.ts` |
| `GET /parent/profile` | `verifyParentToken` | `/parent/profile` | `parent.routes.ts` |
| `PUT /parent/profile` | `verifyParentToken` | `/parent/profile` | `parent.routes.ts` |
| `GET /parent/address` | `verifyParentToken` | `/parent/address` | `parent.routes.ts` |
| `PUT /parent/address` | `verifyParentToken` | `/parent/address` | `parent.routes.ts` |
| `GET /parent/trips/active` | `verifyParentToken` | `/parent/trips/active` | `parent.routes.ts` |
| `GET /parent/trips` | `verifyParentToken` | `/parent/trips` | `parent.routes.ts` |
| `GET /driver/profile` | `verifyDriverToken` | `/driver/profile` | `driver.routes.ts` |
| `POST /driver/profile` | `verifyDriverToken` | `/driver/profile` | `driver.routes.ts` |
| `PUT /driver/profile` | `verifyDriverToken` | `/driver/profile` | `driver.routes.ts` |
| `PATCH /driver/availability` | `verifyDriverToken` | `/driver/availability` | `driver.routes.ts` |
| `GET /students` | `verifyParentToken` | `/parent/students` | `parent.routes.ts` |
| `POST /students` | `verifyParentToken` | `/parent/students` | `parent.routes.ts` |
| `PUT /students/:id` | `verifyParentToken` | `/parent/students/:id` | `parent.routes.ts` |
| `DELETE /students/:id` | `verifyParentToken` | `/parent/students/:id` | `parent.routes.ts` |
| `GET /schools` | `verifyToken` | `/shared/schools` | `shared.routes.ts` |
| `POST /schools` | `verifyAdminToken` | `/admin/schools` | `admin.routes.ts` |
| `PUT /schools/:id` | `verifyAdminToken` | `/admin/schools/:id` | `admin.routes.ts` |
| `GET /school-driver` | `verifyAdminToken` | `/admin/school-drivers` | `admin.routes.ts` |
| `POST /school-driver` | `verifyAdminToken` | `/admin/school-drivers` | `admin.routes.ts` |
| `GET /driver-student-assignments (parent/driver)` | `verifyToken` | `/parent/assignments` + `/driver/assignments` | `parent.routes.ts` + `driver.routes.ts` |
| `GET /driver-student-assignments/admin/all` | `verifyAdminToken` | `/admin/assignments` | `admin.routes.ts` |
| `GET /school-assignments` | `verifyAdminToken` | `/admin/school-assignments` | `admin.routes.ts` |
| `GET /trips (driver)` | `verifyDriverToken` | `/driver/trips` | `driver.routes.ts` |
| `POST /trips` | `verifyDriverToken` | `/driver/trips` | `driver.routes.ts` |
| `GET /trips/admin/all-trips` | `verifyAdminToken` | `/admin/trips` | `admin.routes.ts` |
| `GET /tracking/:tripId` | `verifyToken` | `/shared/tracking/:tripId` | `shared.routes.ts` |
| `POST /tracking` | `verifyDriverToken` | `/driver/tracking` | `driver.routes.ts` |
| `POST /tracking/admin/cleanup` | `verifyAdminToken` | `/admin/tracking/cleanup` | `admin.routes.ts` |
| `GET /daily-qr-otp/parent/*` | `verifyParentToken` | `/parent/qr-otp/*` | `parent.routes.ts` |
| `POST /daily-qr-otp/generate` | `verifyToken` | `/driver/qr-otp/generate` | `driver.routes.ts` |
| `POST /daily-qr-otp/verify` | `verifyToken` | `/driver/qr-otp/verify` | `driver.routes.ts` |
| `PUT /trip-students/*/attendance` | `verifyDriverToken` | `/driver/trip-students/*/attendance` | `driver.routes.ts` |
| `GET /notifications` | `verifyToken` | `/shared/notifications` | `shared.routes.ts` |
| `GET /subscription-plans` | public | `/public/subscription-plans` | `public.routes.ts` |
| `POST /subscription-plans` | `verifyAdminToken` | `/admin/subscription-plans` | `admin.routes.ts` |
| `PUT /subscription-plans/:id` | `verifyAdminToken` | `/admin/subscription-plans/:id` | `admin.routes.ts` |
| `GET /parent-subscriptions` | `verifyParentToken` | `/parent/subscriptions` | `parent.routes.ts` |
| `POST /parent-subscriptions` | `verifyParentToken` | `/parent/subscriptions` | `parent.routes.ts` |
| `GET /parent-subscriptions/admin/all` | `verifyAdminToken` | `/admin/subscriptions` | `admin.routes.ts` |
| `GET /school-subscriptions` | `verifyAdminToken` | `/admin/school-subscriptions` | `admin.routes.ts` |
| `POST /school-subscriptions` | `verifyAdminToken` | `/admin/school-subscriptions` | `admin.routes.ts` |
| `GET /payments/admin/*` | `verifyAdminToken` | `/admin/payments` | `admin.routes.ts` |
| `POST /payments` | `verifyParentToken` | `/parent/payments` | `parent.routes.ts` |
| `GET /payments` | `verifyParentToken` | `/parent/payments` | `parent.routes.ts` |
| `GET /redemptions` | `verifyParentToken` | `/parent/redemptions` | `parent.routes.ts` |
| `POST /redemptions` | `verifyParentToken` | `/parent/redemptions` | `parent.routes.ts` |
| `GET /razorpay/config` | public | `/public/razorpay/config` | `public.routes.ts` |
| `POST /razorpay/webhook` | public | `/public/razorpay/webhook` | `public.routes.ts` |
| `POST /ratings-reviews` | `verifyParentToken` | `/parent/reviews` | `parent.routes.ts` |
| `GET /ratings-reviews/driver/:id` | public | `/public/reviews/driver/:id` | `public.routes.ts` |
| `POST /admin/login` | public | `/admin/auth/login` | `admin.routes.ts` (public sub-route) |
| `GET /admin/users` | `verifyAdminToken` | `/admin/users` | `admin.routes.ts` |
| `GET /admin/drivers/:id/details` | `verifyAdminToken` | `/admin/users/drivers/:id` | `admin.routes.ts` |
| `PATCH /admin/drivers/:id/approval-status` | `verifyAdminToken` | `/admin/users/drivers/:id/approval-status` | `admin.routes.ts` |
| `GET /admin/` (all admins) | `verifyAdminToken` | `/superadmin/admins` | `superadmin.routes.ts` |
| `POST /admin/` (create admin) | `verifyAdminToken` | `/superadmin/admins` | `superadmin.routes.ts` |
| `PUT /admin/:id` | `verifyAdminToken` | `/superadmin/admins/:id` | `superadmin.routes.ts` |
| `PATCH /admin/:id/activate` | `verifyAdminToken` | `/superadmin/admins/:id/activate` | `superadmin.routes.ts` |
| `PATCH /admin/:id/deactivate` | `verifyAdminToken` | `/superadmin/admins/:id/deactivate` | `superadmin.routes.ts` |
| `GET /roles` | `verifyAdminToken` | `/superadmin/roles` | `superadmin.routes.ts` |
| `POST /roles` | `verifyAdminToken` | `/superadmin/roles` | `superadmin.routes.ts` |
| `DELETE /roles/:id` | `verifyAdminToken` | `/superadmin/roles/:id` | `superadmin.routes.ts` |
| `GET /audit-logs` | `verifyAdminToken` | `/admin/audit-logs` + `/superadmin/audit-logs` | `admin.routes.ts` + `superadmin.routes.ts` |
| `GET /school-driver` (school_admin view) | — | `/school-admin/drivers` | `school-admin.routes.ts` |

---

## Migration Strategy

Migration is **incremental** — old URLs keep working while new ones are added. No breaking
changes until clients are updated.

### Phase 1 — Add role gateways (additive, zero breaking changes)

Create the new gateway files in `src/routes/`. Keep all existing
`router.use("/driver-student-assignments", ...)` style entries in `src/routes/index.ts`.
Add the new gateways alongside them:

```typescript
// src/routes/index.ts during Phase 1

// ── Existing routes (preserved for backward compatibility) ──────
router.use("/auth",                      authRoutes);
router.use("/parent",                    parentRoutes);           // already exists
router.use("/driver",                    driverRoutes);           // already exists
router.use("/trips",                     tripRoutes);             // mixed, kept alive
router.use("/driver-student-assignments", driverStudentAssignmentRoutes); // mixed, kept alive
// ... all other existing routes unchanged

// ── NEW: Role-scoped gateways (added alongside existing) ────────
router.use("/shared",  newSharedRoutes);
// parent and driver are already mounted above; new routes.ts files
// replace their existing module-level counterparts progressively
```

Mobile clients see no URL changes. New development uses the clean URLs.

### Phase 2 — Migrate module routes files to handler groups

For each module, convert `*.routes.ts` from Express Router export to handler group export.
The existing `router.use(...)` in old `index.ts` breaks — replace with the gateway file
import. Do this module by module.

**Order of priority (most tangled → least):**
1. `driver_student_assignment.routes.ts` — most mixed roles
2. `trip.routes.ts` — admin bolted on
3. `payment.routes.ts` — admin bolted on
4. `daily_qr_otp.routes.ts` — mixed verifyToken + verifyParentToken
5. All remaining single-role files (mechanical conversion)

### Phase 3 — Update clients and remove legacy routes

Once all clients (mobile app, admin portal) are updated to the new URLs:
- Remove the legacy `router.use("/driver-student-assignments", ...)` entries from
  `src/routes/index.ts`
- The old mixed-role module route files are now empty of Router exports — clean them up

---

## Quick Reference

**Where does a new endpoint for a parent go?**
→ Add to `src/routes/parent.routes.ts`. Auth is already handled. Done.

**Where does a new endpoint for a driver go?**
→ Add to `src/routes/driver.routes.ts`. Auth is already handled. Done.

**Where does a new endpoint for admin + superadmin go?**
→ Add to `src/routes/admin.routes.ts` (`verifyAdminOrAboveToken`).

**Where does a superadmin-only endpoint go?**
→ Add to `src/routes/superadmin.routes.ts` (`verifySuperadminToken`). Examples: creating
admins, deleting roles, deactivating accounts.

**Where does a school_admin endpoint go?**
→ Add to `src/routes/school-admin.routes.ts` (`verifySchoolAdminToken`). Always scope the
query to `req.admin.school_id`.

**Where does a new admin role go when it is added in the future?**
→ Add enum → add middleware → create `src/routes/[new-role].routes.ts` → mount in
`src/routes/index.ts`. Nothing else changes.

**Where does the handler implementation go?**
→ In the feature module's `*.controller.ts`. No change from current conventions.

**Where does an endpoint accessible to ALL authenticated users go?**
→ Add to `src/routes/shared.routes.ts` (`verifyToken_Middleware` applied once there).

**Where does a public (no-auth) endpoint go?**
→ Add to `src/routes/public.routes.ts` (no auth middleware).

**How do I check what a school_admin can do?**
→ Open `src/routes/school-admin.routes.ts` — complete list in one file.

**How do I check if a handler is exposed via any route?**
→ Search handler function name in `src/routes/` — not found means unrouted/unused.

---

**Document Version:** 1.1.0
**Extends:** `docs/guides/ARCHITECTURE.md` (v2.0 domain-driven modules)
**Last Updated:** 2026-02-23
**Changelog:**
- v1.1.0 — Added Admin Sub-Role Architecture section: split single admin gateway into
  `admin.routes.ts` (admin+superadmin), `superadmin.routes.ts` (superadmin only), and
  `school-admin.routes.ts` (school_admin scoped). Added scalability pattern for future roles.
