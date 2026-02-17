# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server with auto-reload (ts-node-dev)
npm run build         # Compile TypeScript to dist/
npm start:prod        # Run production build (requires NODE_ENV=production)

# Code Quality
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix ESLint issues
npm run format        # Prettier format
npm run format:check  # Check Prettier compliance

# Testing
npm run test          # Run Jest tests
npm run test:watch    # Watch mode

# Documentation
npm run docs:generate # Generate API documentation
```

To run a single test file:
```bash
npx jest src/path/to/test.spec.ts
```

## Architecture

**Domain-driven module structure.** Each feature is a self-contained module under `src/modules/[domain]/[feature]/` with these files:

```
[feature].controller.ts   # HTTP handlers + business logic
[feature].repository.ts   # Data access (extends BaseRepository<T>)
[feature].routes.ts       # Express route definitions
[feature].type.ts         # TypeScript interfaces
[feature].validation.ts   # Joi validation schemas
[feature].service.ts      # Business logic (only when needed)
```

**Request flow:** Route → Validation middleware → Controller → Repository → MongoDB

### Key Modules

- `src/modules/auth/` — OTP-based authentication via Twilio
- `src/modules/users/{parent,driver,student}/` — User types
- `src/modules/trips/` — Trip lifecycle, attendance, QR/OTP verification
- `src/modules/billing/` — Razorpay payments, subscription plans, redemption codes
- `src/modules/school/` + `school_admin/` — School management
- `src/modules/tracking/` — Real-time GPS (delegates to Socket.IO)
- `src/modules/notification/` — Push/SMS notifications
- `src/modules/admin/` — Admin management, roles, audit logs
- `src/modules/reviews/` — Ratings and reviews

### Shared Infrastructure (`src/shared/`)

- **`database/base.repository.ts`** — Generic MongoDB CRUD (all repositories extend this)
- **`config/database.ts`** — MongoDB connection via `getDB()`
- **`config/env.ts`** — Environment variables
- **`middlewares/auth.middleware.ts`** — Role-based JWT guards: `verifyParentToken()`, `verifyDriverToken()`, `verifyAdminAccessToken()`
- **`middlewares/error.middleware.ts`** — Global error handler using `ApiError` class
- **`services/socket.service.ts`** — Socket.IO real-time tracking (role-separated, 5s throttle)
- **`services/storage.factory.ts`** — File storage (local, S3, DigitalOcean, Wasabi, Minio) selected via `STORAGE_PROVIDER` env var
- **`constants/collections.ts`** — MongoDB collection name constants (always use these)
- **`constants/messages.ts`** — All response message strings (always use these)
- **`utils/apiError.ts`** + **`apiResponse.ts`** — Standard error/response formatting

### Entry Points

- `src/server.ts` — Loads env, connects MongoDB, creates HTTP server, initializes Socket.IO
- `src/app.ts` — Express app: CORS, middleware stack, `/api` routes, `/api-docs` Swagger UI
- `src/modules/index.ts` — Aggregates all module routes

### Environment

Environment files live in `environment/` and are loaded based on `NODE_ENV`:
- `environment/.env.dev` (dev)
- `environment/.env.prod` (production)

Key env vars: `MONGO_URI`, `DB_NAME`, `JWT_SECRET`, `RAZORPAY_KEY_ID/SECRET`, `TWILIO_*`, `TOMTOM_API_KEY`, `STORAGE_PROVIDER`

### Database

- Native MongoDB driver (no ORM). Collections named in `src/shared/constants/collections.ts`.
- All repositories extend `BaseRepository<T>` from `src/shared/database/base.repository.ts`.
- Access the DB via `getDB()` from `src/shared/config/database.ts`.

### Path Aliases (tsconfig)

```
@modules/*       → src/modules/*
@shared/*        → src/shared/*
@controllers/*   → src/controllers/*
@repositories/*  → src/repositories/*
@routes          → src/routes/index
@models/*        → src/types/*
@validations/*   → src/validations/*
```

### Pre-commit Hooks

Husky + lint-staged runs on every commit: Prettier format + ESLint fix on all staged `.ts` files.

### Roles

Users have one of: `parent`, `driver`, `school_admin`, `admin`, `superadmin`. Route protection uses the corresponding middleware guard (`verifyParentToken()`, `verifyDriverToken()`, `verifyAdminAccessToken()`).

### Conventions

- **Error handling:** Throw `ApiError` static methods (`ApiError.notFound()`, `ApiError.badRequest()`, etc.) — caught by global error middleware.
- **Responses:** Use `ApiResponse` static methods (`ApiResponse.success(res, data, message)`, `ApiResponse.created()`, etc.).
- **Messages:** All user-facing strings must come from `src/shared/constants/messages.ts` (`ERROR_MESSAGES`, `SUCCESS_MESSAGES_COMMON`).
- **Collections:** Always reference collection names via constants from `src/shared/constants/collections.ts`, never hardcode strings.
- **Enums:** All domain enums live in `src/shared/constants/enums.ts`.
- **Validation:** Joi schemas in `[feature].validation.ts`, applied as Express middleware before controller.

### Documentation

- `docs/guides/ARCHITECTURE.md` — Full architecture reference (v2.0)
- `docs/guides/websocket/WEBSOCKET.md` — Socket.IO events reference
- `Database/db.md` — MongoDB collection schemas
- `docs/ai/AI_PROMPTS.md` — Templates for generating new modules
