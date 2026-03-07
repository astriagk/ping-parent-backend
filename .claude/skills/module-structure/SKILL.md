---
name: module-structure
description: "File placement and module scaffolding for pp-backend. Use when creating new features, modules, routes, controllers, repositories, services, types, or validations. Describes single-feature vs multi-feature module layout, file naming conventions ({feature}.controller.ts etc.), and when to split a module into sub-features."
---

# Module Structure — pp-backend

## Decision: Single-Feature vs Multi-Feature Module

| Situation                              | Structure                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Feature has ONE logical concern        | Files sit directly in `src/modules/{module}/`                                            |
| Feature has MULTIPLE distinct concerns | Each concern gets its own subfolder `src/modules/{module}/{feature}/` with an `index.ts` |

**Existing examples:**

- Single: `school/`, `device_token/`, `reviews/`, `auth/`, `notification/`, `tracking/`
- Multi: `admin/` (admin_management, role, audit_log), `billing/` (payment, razorpay, subscription_plan, …), `trips/`, `users/`

**Rule:** If you are adding a second distinct concern to a module, split immediately into subfolders. Do NOT grow a single-feature module with unrelated logic.

---

## Standard File Set Per Feature

Every feature (whether a top-level module or a subfolder) requires `{feature}.{layer}.ts` naming:

| File                      | Purpose                                                   | Required?        |
| ------------------------- | --------------------------------------------------------- | ---------------- |
| `{feature}.controller.ts` | HTTP handlers, request/response logic                     | Yes              |
| `{feature}.repository.ts` | MongoDB data access, extends `BaseRepository<T>`          | Yes              |
| `{feature}.routes.ts`     | Express route definitions + middleware wiring             | Yes              |
| `{feature}.type.ts`       | TypeScript interfaces for this feature                    | Yes              |
| `{feature}.validation.ts` | Joi schemas applied as middleware before controller       | Yes              |
| `{feature}.service.ts`    | Business logic layer when controller would be too complex | Only when needed |
| `index.ts`                | Re-exports router for parent aggregator                   | Yes              |

**Naming rule:** `{feature}` is the snake_case folder name.
Example: folder `admin_management` → `admin_management.controller.ts`, `admin_management.repository.ts`, etc.

---

## Special Files (Only When the Feature Demands It)

| File Pattern                  | When to Add                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `{feature}.dispatcher.ts`     | Feature dispatches events/notifications to other systems (e.g., `notification.dispatcher.ts`) |
| `{feature}.socket.service.ts` | Feature has real-time Socket.IO logic (e.g., `tracking.socket.service.ts`)                    |
| `{feature}.config.ts`         | Feature needs its own third-party SDK config (e.g., `razorpay.config.ts`)                     |
| `{feature}.webhook.ts`        | Feature handles incoming webhooks from external providers                                     |

---

## Shared / Cross-Cutting Code → `src/shared/`

Never place shared code inside a module folder. Always use `src/shared/`:

| What                                  | Where                                                             |
| ------------------------------------- | ----------------------------------------------------------------- |
| MongoDB collection names              | `src/shared/constants/collections.ts`                             |
| Domain enums (roles, statuses, types) | `src/shared/constants/enums.ts`                                   |
| HTTP status codes                     | `src/shared/constants/httpStatus.ts`                              |
| User-facing message strings           | `src/shared/constants/messages.ts`                                |
| Validation error messages             | `src/shared/constants/validationMessages.ts`                      |
| Generic MongoDB CRUD base class       | `src/shared/database/base.repository.ts`                          |
| JWT / role-based auth middleware      | `src/shared/middlewares/auth.middleware.ts`                       |
| Global error handler middleware       | `src/shared/middlewares/error.middleware.ts`                      |
| File upload middleware (Multer)       | `src/shared/middlewares/multer.middleware.ts`                     |
| Request validation middleware         | `src/shared/middlewares/validate.middleware.ts`                   |
| Firebase Cloud Messaging              | `src/shared/services/fcm.service.ts`                              |
| Socket.IO real-time service           | `src/shared/services/socket.service.ts`                           |
| File storage abstraction              | `src/shared/services/storage.factory.ts`                          |
| JWT token operations                  | `src/shared/services/token.service.ts`                            |
| Twilio OTP service                    | `src/shared/services/twilio-otp.service.ts`                       |
| ApiError / ApiResponse utilities      | `src/shared/utils/apiError.ts`, `src/shared/utils/apiResponse.ts` |
| Global TypeScript type declarations   | `src/shared/types/global/`                                        |

---

## Route Entry Points → `src/routes/`

These files group routes by **user role**, not by domain. After creating a feature's routes, wire them into the correct role file:

| File                     | Role / Audience                        |
| ------------------------ | -------------------------------------- |
| `auth.routes.ts`         | Public OTP login / register (no auth)  |
| `parent.routes.ts`       | Parent app endpoints                   |
| `driver.routes.ts`       | Driver app endpoints                   |
| `school-admin.routes.ts` | School admin portal                    |
| `admin.routes.ts`        | Internal admin portal                  |
| `superadmin.routes.ts`   | Superadmin-only endpoints              |
| `public.routes.ts`       | Unauthenticated public endpoints       |
| `shared.routes.ts`       | Endpoints shared across multiple roles |

---

## Step-by-Step: Creating a New Feature

### Step 1 — Decide placement

- Related module already exists? → Add a subfolder inside `src/modules/{module}/{feature}/`
- Standalone concern? → Create a new top-level `src/modules/{module}/` folder
- Existing single-feature module now needs a second concern? → Restructure to multi-feature with subfolders

### Step 2 — Create feature files (in this order)

1. `{feature}.type.ts` — define interfaces first
2. `{feature}.validation.ts` — Joi schemas
3. `{feature}.repository.ts` — extend `BaseRepository<T>` from `@shared/database/base.repository`
4. `{feature}.controller.ts` — import repository, use `ApiError`/`ApiResponse` from `@shared/utils`
5. `{feature}.service.ts` — only if controller logic would be too complex
6. `{feature}.routes.ts` — wire validation middleware + controller methods
7. `index.ts` — export the router

### Step 3 — Register the collection

Add the new collection name constant to `src/shared/constants/collections.ts`. Never hardcode the string elsewhere.

### Step 4 — Wire routes

Import the feature's `index.ts` router into the correct `src/routes/{role}.routes.ts` file.

### Step 5 — Register in module aggregator

- Multi-feature module: import the feature router in `src/modules/{module}/index.ts`
- Confirm the module's `index.ts` is already imported in `src/modules/index.ts` (add it if this is a new module)

---

## Conventions (Always Follow)

- **Errors:** Use `ApiError` static methods — `ApiError.notFound()`, `ApiError.badRequest()`, `ApiError.unauthorized()`. Never use `throw new Error(...)`.
- **Responses:** Use `ApiResponse.success(res, data, message)`, `ApiResponse.created()`, etc.
- **Messages:** All user-facing strings must come from `src/shared/constants/messages.ts`. Never hardcode strings.
- **Collections:** Always use constants from `src/shared/constants/collections.ts`. Never hardcode MongoDB collection name strings.
- **Enums:** All domain enums live in `src/shared/constants/enums.ts`.
- **Path aliases:** Use `@shared/*`, `@modules/*`. Never use `../../` paths that reach into `shared/` from a module.
- **Request flow:** Route → Validation middleware → Controller → Service (optional) → Repository → MongoDB
