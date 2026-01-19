# Ping Parent Backend - Architecture v2.0

**Version:** 2.0.0
**Last Updated:** 2026-01-08
**Status:** Planned

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Evolution](#architecture-evolution)
3. [New Folder Structure](#new-folder-structure)
4. [2-Layer Architecture](#2-layer-architecture)
5. [Domain-Driven Design](#domain-driven-design)
6. [Request Flow](#request-flow)
7. [Module Structure](#module-structure)
8. [Shared Components](#shared-components)
9. [Design Patterns](#design-patterns)
10. [Best Practices](#best-practices)
11. [Scalability Considerations](#scalability-considerations)

---

## Overview

Version 2 of the Ping Parent Backend represents a fundamental architectural shift from a **3-layer technical architecture** to a **2-layer domain-driven architecture**. This change prioritizes developer experience, code maintainability, and feature cohesion.

### Key Improvements

- **Simplified Architecture**: Reduced from 3 layers (Controller → Service → Repository) to 2 layers (Handler + Repository)
- **Domain-Driven Organization**: Code organized by business domain (users, trips, billing) rather than technical layer
- **Improved Navigation**: All code for a feature grouped in one folder instead of spread across 6 folders
- **Reduced Boilerplate**: Merged controller + service logic eliminates unnecessary abstraction layers
- **Better Discoverability**: Clear domain boundaries make it obvious where code belongs

---

## Architecture Evolution

### v1.0 Architecture (Technical Layer-Based)

```
src/
├── controllers/      # 17+ controller files
├── services/         # 18+ service files
├── repositories/     # 17+ repository files
├── routes/           # 17+ route files
├── validations/      # 17+ validation files
├── types/            # 17+ type files
├── middlewares/      # Shared middlewares
├── utils/            # Shared utilities
├── constants/        # Shared constants
└── config/           # Configuration

Problem: To work on "parent" feature → navigate through 6 different folders
```

**Characteristics:**
- ❌ High cognitive load (remember where each layer is)
- ❌ Scattered feature code across multiple folders
- ❌ Thin controller-service split (often just pass-through)
- ✅ Clear separation of concerns
- ✅ Easy to understand layer responsibilities

### v2.0 Architecture (Domain-Driven)

```
src/
├── modules/          # Domain-based feature modules
│   ├── auth/
│   ├── users/        # parent, driver, student
│   ├── trips/        # trip, assignments, qr-otp
│   ├── billing/      # plans, subscriptions, payments
│   ├── school/
│   ├── notifications/
│   ├── reviews/
│   └── admin/
├── shared/           # Centralized shared code
│   ├── config/
│   ├── constants/
│   ├── middlewares/
│   ├── utils/
│   ├── database/
│   ├── services/
│   └── types/
└── routes/           # Main route aggregator

Solution: To work on "parent" feature → go to modules/users/parent/
```

**Characteristics:**
- ✅ Low cognitive load (think in domains, not layers)
- ✅ Cohesive feature code in one location
- ✅ Simplified 2-layer architecture (handler + repository)
- ✅ Clear domain boundaries
- ✅ Easier onboarding for new developers

---

## New Folder Structure

### Complete Directory Tree

```
src/
├── modules/                                # FEATURE MODULES
│   │
│   ├── auth/                               # Authentication Domain
│   │   ├── auth.handler.ts                 # HTTP + business logic
│   │   ├── auth.repository.ts              # Data access
│   │   ├── auth.routes.ts                  # Route definitions
│   │   ├── auth.types.ts                   # TypeScript interfaces
│   │   ├── auth.validation.ts              # Joi schemas
│   │   └── index.ts                        # Barrel export
│   │
│   ├── users/                              # User Management Domain
│   │   ├── parent/
│   │   │   ├── parent.handler.ts
│   │   │   ├── parent.repository.ts
│   │   │   ├── parent.routes.ts
│   │   │   ├── parent.types.ts
│   │   │   ├── parent.validation.ts
│   │   │   └── index.ts
│   │   ├── driver/
│   │   │   └── [same structure]
│   │   ├── student/
│   │   │   └── [same structure]
│   │   └── index.ts                        # Aggregates user routes
│   │
│   ├── trips/                              # Trip Management Domain
│   │   ├── trip/
│   │   │   └── [same structure]
│   │   ├── trip-student/                   # Attendance tracking
│   │   │   └── [same structure]
│   │   ├── driver-student-assignment/      # Assignment management
│   │   │   └── [same structure]
│   │   ├── daily-qr-otp/                   # QR/OTP for trips
│   │   │   └── [same structure]
│   │   └── index.ts
│   │
│   ├── billing/                            # Billing & Subscription Domain
│   │   ├── subscription-plan/
│   │   │   └── [same structure]
│   │   ├── parent-subscription/
│   │   │   └── [same structure]
│   │   ├── payment/
│   │   │   └── [same structure]
│   │   └── index.ts
│   │
│   ├── school/                             # School Management Domain
│   │   ├── school.handler.ts
│   │   ├── school.repository.ts
│   │   ├── school.routes.ts
│   │   ├── school.types.ts
│   │   ├── school.validation.ts
│   │   └── index.ts
│   │
│   ├── notifications/                      # Notification Domain
│   │   └── [same structure as school]
│   │
│   ├── reviews/                            # Rating & Review Domain
│   │   └── [same structure as school]
│   │
│   ├── admin/                              # Admin Portal Domain
│   │   ├── admin.handler.ts
│   │   ├── admin.repository.ts
│   │   ├── admin.routes.ts
│   │   ├── admin.types.ts
│   │   ├── admin.validation.ts
│   │   ├── role/                           # Role management
│   │   │   └── [same structure]
│   │   ├── audit-log/                      # Audit logging
│   │   │   └── [same structure]
│   │   └── index.ts
│   │
│   └── index.ts                            # Exports all module routes
│
├── shared/                                 # SHARED CODE
│   │
│   ├── config/                             # Configuration
│   │   ├── database.ts                     # MongoDB connection
│   │   ├── env.ts                          # Environment variables
│   │   ├── redis.ts                        # Redis configuration
│   │   ├── swagger.ts                      # API documentation
│   │   └── index.ts
│   │
│   ├── constants/                          # Constants & Enums
│   │   ├── collections.ts                  # MongoDB collections
│   │   ├── enums.ts                        # Enum definitions
│   │   ├── httpStatus.ts                   # HTTP status codes
│   │   ├── messages.ts                     # Response messages
│   │   ├── validationMessages.ts           # Validation messages
│   │   └── index.ts
│   │
│   ├── middlewares/                        # Express Middlewares
│   │   ├── asyncHandler.middleware.ts      # Async error wrapper
│   │   ├── auth.middleware.ts              # JWT verification
│   │   ├── error.middleware.ts             # Global error handler
│   │   ├── rateLimit.middleware.ts         # Rate limiting
│   │   ├── validate.middleware.ts          # Request validation
│   │   └── index.ts
│   │
│   ├── utils/                              # Utility Functions
│   │   ├── apiError.ts                     # Custom error class
│   │   ├── apiResponse.ts                  # Response wrapper
│   │   ├── helpers.ts                      # Helper functions
│   │   ├── logger.ts                       # Logging utility
│   │   └── index.ts
│   │
│   ├── database/                           # Database Utilities
│   │   ├── base.repository.ts              # Base repository class
│   │   └── index.ts
│   │
│   ├── services/                           # Cross-Cutting Services
│   │   ├── token.service.ts                # JWT token service
│   │   ├── redis.service.ts                # Redis caching
│   │   └── index.ts
│   │
│   └── types/                              # Shared Types
│       ├── environment.d.ts                # Environment variables
│       ├── global.d.ts                     # Global types
│       ├── utils.types.ts                  # Utility types
│       └── index.ts
│
├── routes/                                 # ROUTE AGGREGATION
│   └── index.ts                            # Main route aggregator
│
├── app.ts                                  # Express app setup
└── server.ts                               # Server entry point
```

---

## 2-Layer Architecture

### Layer Breakdown

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP REQUEST                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              LAYER 1: HANDLER                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • HTTP request/response handling                 │  │
│  │  • Input validation (via middleware)              │  │
│  │  • Business logic                                 │  │
│  │  • Orchestration                                  │  │
│  │  • Response formatting                            │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           LAYER 2: REPOSITORY                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • Database queries                               │  │
│  │  • Data access logic                              │  │
│  │  • Aggregations                                   │  │
│  │  • CRUD operations                                │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  MongoDB Database                       │
└─────────────────────────────────────────────────────────┘
```

### Handler Pattern (Layer 1)

Handlers combine HTTP handling and business logic in a single cohesive unit.

**Example: Parent Handler**

```typescript
// modules/users/parent/parent.handler.ts
import { Request, Response } from 'express';
import { asyncHandler } from '@shared/middlewares';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@shared/constants';
import { ApiError } from '@shared/utils';
import { parentRepository } from './parent.repository';
import type { Parent } from './parent.types';

/**
 * ParentHandler class
 * Combines HTTP request handling with business logic
 */
class ParentHandler {
  /**
   * Get parent profile
   * Fetches authenticated parent's profile with user data
   */
  async getProfile(req: Request, res: Response) {
    // 1. HTTP Layer: Extract user ID from authenticated request
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED
      );
    }

    // 2. Business Logic: Fetch profile (previously in service layer)
    const profile = await parentRepository.findByUserId(userId);

    if (!profile) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND
      );
    }

    // 3. HTTP Layer: Format and send response
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        parent_id: profile.parent_id,
        user_id: profile.user_id,
        name: profile.name,
        email: profile.email,
        photo_url: profile.photo_url,
        user: profile.user,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });
  }

  /**
   * Update parent profile
   * Handles profile updates with validation and error handling
   */
  async updateProfile(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED
      );
    }

    // Business Logic: Sanitize and validate inputs
    const { name, email, photo_url } = req.body;
    const updates: Partial<Parent> = {};

    if (name?.trim()) updates.name = name.trim();
    if (email?.trim()) updates.email = email.trim();
    if (photo_url?.trim()) updates.photo_url = photo_url.trim();

    if (Object.keys(updates).length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PARENT.NO_UPDATES_PROVIDED
      );
    }

    // Business Logic: Update or create profile
    let updated = await parentRepository.updateByUserId(userId, updates);

    if (!updated) {
      const created = await parentRepository.create({
        user_id: userId,
        ...updates
      });

      if (!created) {
        throw new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_MESSAGES.PARENT.FAILED_TO_UPDATE_PARENT_PROFILE
        );
      }
    }

    // Fetch updated profile
    const updatedProfile = await parentRepository.findByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedProfile,
      message: SUCCESS_MESSAGES.PARENT.PROFILE_UPDATED_SUCCESSFULLY
    });
  }

  /**
   * Complex business logic example
   * When business logic grows, extract to private methods
   */
  private async validateSubscriptionStatus(parentId: string): Promise<boolean> {
    // Complex validation logic
    // Can also be extracted to separate service class if >300 lines
    return true;
  }
}

// Export wrapped handler functions
const handler = new ParentHandler();

export const getProfile = asyncHandler(handler.getProfile.bind(handler));
export const updateProfile = asyncHandler(handler.updateProfile.bind(handler));
```

### Repository Pattern (Layer 2)

Repositories encapsulate all data access logic and MongoDB operations.

**Example: Parent Repository**

```typescript
// modules/users/parent/parent.repository.ts
import { BaseRepository } from '@shared/database';
import { PARENTS_COLLECTION, USERS_COLLECTION } from '@shared/constants';
import type { Parent } from './parent.types';

/**
 * ParentRepository
 * Handles all data access for parent entities
 */
export class ParentRepository extends BaseRepository<Parent> {
  constructor() {
    super(PARENTS_COLLECTION);
  }

  /**
   * Find parent by user ID with user data
   */
  async findByUserId(userId: string): Promise<Parent | null> {
    const db = this.getDB();

    const result = await db.collection(PARENTS_COLLECTION)
      .aggregate([
        { $match: { user_id: userId } },
        {
          $lookup: {
            from: USERS_COLLECTION,
            localField: 'user_id',
            foreignField: 'user_id',
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
      ])
      .toArray();

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update parent by user ID
   */
  async updateByUserId(
    userId: string,
    updates: Partial<Parent>
  ): Promise<boolean> {
    const result = await this.updateOne(
      { user_id: userId },
      { $set: { ...updates, updated_at: new Date() } }
    );

    return !!result;
  }

  /**
   * Complex aggregation example
   */
  async getParentWithSubscriptionStatus(parentId: string) {
    const db = this.getDB();

    return db.collection(PARENTS_COLLECTION)
      .aggregate([
        { $match: { _id: this.toObjectId(parentId) } },
        // Complex aggregation pipeline...
      ])
      .toArray();
  }
}

// Export singleton instance
export const parentRepository = new ParentRepository();
```

### When to Extract Service Classes

If a handler grows beyond ~300 lines, extract complex business logic:

```typescript
// modules/users/parent/parent.service.ts (optional)

/**
 * Complex business logic extracted from handler
 * Use only when handler becomes too large
 */
export class ParentBusinessLogic {
  constructor(private parentRepo: ParentRepository) {}

  /**
   * Complex multi-step business operation
   */
  async calculateSubscriptionEligibility(parentId: string) {
    // Multi-step complex logic
    const parent = await this.parentRepo.findById(parentId);
    // ... 50+ lines of complex calculations
    return eligibilityResult;
  }
}
```

---

## Domain-Driven Design

### Domain Groupings

Modules are organized by business domain, not technical concern.

#### 1. **auth/** - Authentication Domain
- **Purpose**: User authentication and authorization
- **Entities**: Login, OTP, token management
- **Key Operations**: Send OTP, verify OTP, refresh tokens

#### 2. **users/** - User Management Domain
- **Purpose**: Manage different user types
- **Entities**: parent, driver, student
- **Rationale**: All user types share similar CRUD patterns and relationships
- **Key Operations**: Profile management, user lookup, user-specific data

#### 3. **trips/** - Trip & Transportation Domain
- **Purpose**: Core transportation workflow
- **Entities**:
  - `trip/` - Trip scheduling and tracking
  - `trip-student/` - Student attendance on trips
  - `driver-student-assignment/` - Driver-student assignments
  - `daily-qr-otp/` - QR codes and OTP for trip verification
- **Rationale**: These entities work together to deliver the transportation service
- **Key Operations**: Trip creation, attendance marking, assignment management

#### 4. **billing/** - Billing & Subscription Domain
- **Purpose**: Financial transactions and subscriptions
- **Entities**:
  - `subscription-plan/` - Available subscription plans
  - `parent-subscription/` - Parent enrollments
  - `payment/` - Payment processing
- **Rationale**: Tightly coupled financial workflows
- **Key Operations**: Plan management, subscription enrollment, payment processing

#### 5. **school/** - School Management Domain
- **Purpose**: School entity management
- **Entities**: school
- **Key Operations**: School CRUD, school lookup

#### 6. **notifications/** - Notification Domain
- **Purpose**: Cross-cutting notification system
- **Entities**: notification
- **Key Operations**: Send notifications, notification history

#### 7. **reviews/** - Rating & Review Domain
- **Purpose**: Feedback and rating system
- **Entities**: rating_review
- **Key Operations**: Submit reviews, view ratings

#### 8. **admin/** - Admin Portal Domain
- **Purpose**: Platform administration
- **Entities**:
  - `admin` - Admin user management
  - `role/` - Role-based access control
  - `audit-log/` - Activity auditing
- **Key Operations**: Admin operations, role management, audit trails

---

## Request Flow

### Complete Request Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. CLIENT REQUEST                                          │
│     POST /api/parent/profile                                │
│     Authorization: Bearer <token>                           │
│     Body: { name: "John Doe", email: "john@example.com" }  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. EXPRESS MIDDLEWARE STACK (app.ts)                       │
│     • CORS handling                                         │
│     • JSON body parser                                      │
│     • Logger middleware                                     │
│     • Security headers                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ROUTE MATCHING (routes/index.ts)                        │
│     router.use('/parent', parentRoutes)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. MODULE ROUTES (modules/users/parent/parent.routes.ts)   │
│     POST /profile                                           │
│     • verifyParentToken middleware (auth check)             │
│     • validate middleware (schema validation)               │
│     • updateProfile handler                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. AUTH MIDDLEWARE (shared/middlewares/auth.middleware.ts) │
│     • Verify JWT token                                      │
│     • Extract user_id from token                            │
│     • Attach to req.user                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. VALIDATION MIDDLEWARE                                   │
│     (shared/middlewares/validate.middleware.ts)             │
│     • Validate request body against Joi schema              │
│     • Return 400 if invalid                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  7. HANDLER (modules/users/parent/parent.handler.ts)        │
│     • Extract userId from req.user                          │
│     • Sanitize input data                                   │
│     • Call repository.updateByUserId()                      │
│     • Format response                                       │
│     • Return JSON response                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  8. REPOSITORY (modules/users/parent/parent.repository.ts)  │
│     • Build MongoDB query                                   │
│     • Execute updateOne operation                           │
│     • Return result                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  9. MongoDB DATABASE                                        │
│     • Update document in parents collection                 │
│     • Return modified document                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  10. RESPONSE                                               │
│      {                                                      │
│        success: true,                                       │
│        data: { ...updatedProfile },                         │
│        message: "Profile updated successfully"              │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Error Flow

```
┌─────────────────────────────────────────────────────────────┐
│  ERROR OCCURS (any layer)                                   │
│     throw new ApiError(404, "Parent not found")             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ASYNC HANDLER MIDDLEWARE                                   │
│     • Catches async errors                                  │
│     • Passes to next(error)                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ERROR MIDDLEWARE (shared/middlewares/error.middleware.ts)  │
│     • Formats error response                                │
│     • Logs error details                                    │
│     • Returns JSON error                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ERROR RESPONSE                                             │
│      {                                                      │
│        success: false,                                      │
│        error: "Parent not found",                           │
│        statusCode: 404                                      │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Structure

### Standard Module Pattern

Every feature module follows this consistent structure:

```
module-name/
├── module-name.handler.ts       # HTTP + business logic
├── module-name.repository.ts    # Data access
├── module-name.routes.ts        # Route definitions
├── module-name.types.ts         # TypeScript types
├── module-name.validation.ts    # Joi schemas
└── index.ts                     # Barrel export
```

### File Responsibilities

#### 1. **handler.ts** - Request Handler + Business Logic

```typescript
// Purpose: Handle HTTP requests and execute business logic
// Contains: Handler class, exported functions
// Imports: Repository, shared utilities, types
// Exports: Async-wrapped handler functions

class ModuleHandler {
  async operation(req: Request, res: Response) {
    // 1. Extract and validate inputs
    // 2. Execute business logic
    // 3. Call repository for data operations
    // 4. Format and return response
  }
}

export const operation = asyncHandler(handler.operation.bind(handler));
```

#### 2. **repository.ts** - Data Access Layer

```typescript
// Purpose: Encapsulate all database operations
// Contains: Repository class extending BaseRepository
// Imports: BaseRepository, collection constants, types
// Exports: Repository singleton instance

export class ModuleRepository extends BaseRepository<ModuleType> {
  constructor() {
    super(COLLECTION_NAME);
  }

  async customQuery(params) {
    // Custom database queries, aggregations
  }
}

export const moduleRepository = new ModuleRepository();
```

#### 3. **routes.ts** - Route Definitions

```typescript
// Purpose: Define HTTP routes for the module
// Contains: Express router with route definitions
// Imports: Handler functions, middlewares, validations
// Exports: Default router

const router = Router();

router.get('/', authenticate, handler.list);
router.post('/', authenticate, validate(schema), handler.create);
router.put('/:id', authenticate, validate(schema), handler.update);

export default router;
```

#### 4. **types.ts** - TypeScript Interfaces

```typescript
// Purpose: Define TypeScript types for the module
// Contains: Interfaces, types, enums specific to module
// Imports: None (pure types)
// Exports: All interfaces and types

export interface Module {
  _id: ObjectId;
  field1: string;
  field2: number;
  created_at: Date;
  updated_at: Date;
}

export type ModuleInput = Omit<Module, '_id' | 'created_at' | 'updated_at'>;
```

#### 5. **validation.ts** - Joi Validation Schemas

```typescript
// Purpose: Define request validation schemas
// Contains: Joi schemas for all operations
// Imports: Joi, validation messages
// Exports: Named schema objects

export const createModuleSchema = Joi.object({
  field1: Joi.string().required().messages({
    'string.empty': VALIDATION_MESSAGES.FIELD1_REQUIRED
  }),
  field2: Joi.number().min(0).required()
});

export const updateModuleSchema = createModuleSchema.fork(
  ['field1', 'field2'],
  (schema) => schema.optional()
);
```

#### 6. **index.ts** - Barrel Export

```typescript
// Purpose: Export module's public API
// Contains: Re-exports from other files
// Imports: Routes, types, handlers (optional)
// Exports: Default routes + named exports

export { default as moduleRoutes } from './module.routes';
export * from './module.types';
export * from './module.handler'; // Optional, for cross-module usage
```

---

## Shared Components

### Shared Code Organization

All cross-cutting concerns live in the `shared/` folder:

```
shared/
├── config/           # Application configuration
├── constants/        # Constants and enums
├── middlewares/      # Express middlewares
├── utils/            # Utility functions
├── database/         # Database base classes
├── services/         # Cross-cutting services
└── types/            # Shared TypeScript types
```

### When to Use Shared vs Module-Specific

**Use `shared/` when:**
- ✅ Code is used by 3+ modules
- ✅ Infrastructure concerns (database, config, auth)
- ✅ Framework-level utilities (error handling, logging)
- ✅ Global constants and types

**Keep in module when:**
- ✅ Code is specific to one domain
- ✅ Business logic for that feature
- ✅ Domain-specific types and validations
- ✅ Only used within that module

**Example Decision Tree:**

```
Question: Where should validation for email format go?
├─ Used only in parent module? → modules/users/parent/parent.validation.ts
└─ Used in parent, driver, AND admin? → shared/utils/validators.ts

Question: Where should parent-specific error messages go?
├─ Only parent module throws these errors? → modules/users/parent/parent.types.ts
└─ Multiple modules use same errors? → shared/constants/messages.ts
```

---

## Design Patterns

### 1. Repository Pattern

**Purpose**: Separate data access logic from business logic

```typescript
// shared/database/base.repository.ts
export class BaseRepository<T extends Document> {
  protected collectionName: string;

  async findOne(filter: Filter<T>): Promise<T | null> { }
  async findMany(filter: Filter<T>): Promise<T[]> { }
  async create(data: T): Promise<T> { }
  async updateOne(filter: Filter<T>, update: UpdateFilter<T>): Promise<T | null> { }
  async deleteOne(filter: Filter<T>): Promise<boolean> { }
}

// Usage in module
export class ParentRepository extends BaseRepository<Parent> {
  // Custom methods specific to parents
}
```

### 2. Async Handler Pattern

**Purpose**: Eliminate try-catch boilerplate in handlers

```typescript
// shared/middlewares/asyncHandler.middleware.ts
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage
export const getProfile = asyncHandler(async (req, res) => {
  // No try-catch needed - errors automatically caught
  const profile = await repository.findOne(...);
  res.json(profile);
});
```

### 3. Dependency Injection (Implicit)

**Purpose**: Make code testable by injecting dependencies

```typescript
// Handler with injectable repository
class ParentHandler {
  constructor(private repo: ParentRepository) {}

  async getProfile(req, res) {
    const profile = await this.repo.findByUserId(userId);
    // ...
  }
}

// Production: Use real repository
const handler = new ParentHandler(parentRepository);

// Testing: Inject mock
const mockRepo = { findByUserId: jest.fn() };
const testHandler = new ParentHandler(mockRepo);
```

### 4. Middleware Chain Pattern

**Purpose**: Compose request processing pipeline

```typescript
router.post(
  '/profile',
  verifyParentToken,           // Auth check
  validate(updateSchema),      // Input validation
  rateLimit({ max: 10 }),      // Rate limiting
  updateProfile                // Handler
);
```

### 5. Factory Pattern (Repository Singletons)

**Purpose**: Ensure single instance of repository

```typescript
// parent.repository.ts
export class ParentRepository extends BaseRepository<Parent> { }

// Singleton instance
export const parentRepository = new ParentRepository();

// Usage: Import and use directly
import { parentRepository } from './parent.repository';
```

---

## Best Practices

### 1. File Naming Conventions

```
✅ DO:
- kebab-case for folders: driver-student-assignment/
- {entity}.{type}.ts for files: parent.handler.ts
- Consistent naming: parent.handler.ts, parent.repository.ts, parent.routes.ts

❌ DON'T:
- Mix cases: parentHandler.ts, Parent-Repository.ts
- Generic names: handler.ts, repository.ts
- Inconsistent suffixes: parentHandlers.ts, parent-repo.ts
```

### 2. Import Conventions

```typescript
✅ DO:
// Use TypeScript path aliases
import { asyncHandler } from '@shared/middlewares';
import { parentRepository } from './parent.repository';

// Group imports by source
import { Request, Response } from 'express';        // External
import { asyncHandler } from '@shared/middlewares'; // Shared
import { parentRepository } from './parent.repository'; // Local

❌ DON'T:
// Relative imports for shared code
import { asyncHandler } from '../../../shared/middlewares';

// Mixed order
import { parentRepository } from './parent.repository';
import { Request } from 'express';
import { asyncHandler } from '@shared/middlewares';
```

### 3. Error Handling

```typescript
✅ DO:
// Use custom ApiError class
throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PARENT.NOT_FOUND);

// Let async handler catch errors
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await repository.findOne(...);
  if (!profile) throw new ApiError(404, 'Not found');
});

❌ DON'T:
// Generic errors
throw new Error('Something went wrong');

// Manual try-catch everywhere
export const getProfile = async (req, res) => {
  try {
    // ...
  } catch (error) {
    res.status(500).json({ error });
  }
};
```

### 4. Response Formatting

```typescript
✅ DO:
// Consistent response structure
return res.status(HTTP_STATUS.OK).json({
  success: true,
  data: profile,
  message: 'Profile fetched successfully'
});

❌ DON'T:
// Inconsistent responses
return res.json(profile);  // Just data
return res.send({ user: profile, ok: true });  // Different structure
```

### 5. Type Safety

```typescript
✅ DO:
// Define and use interfaces
interface Parent {
  _id: ObjectId;
  name: string;
  email: string;
}

async findByUserId(userId: string): Promise<Parent | null> {
  return await this.findOne({ user_id: userId });
}

❌ DON'T:
// Using 'any' types
async findByUserId(userId: any): Promise<any> {
  return await this.findOne({ user_id: userId });
}
```

---

## Scalability Considerations

### Horizontal Module Growth

```
Current: 8 domain modules
Future: Add new domains as needed

src/modules/
├── messaging/        # New: In-app messaging
├── reports/          # New: Analytics and reporting
└── integrations/     # New: Third-party integrations
```

### Vertical Module Growth

```
When a module grows too large:

1. Split into sub-modules:
   modules/users/
   ├── parent/
   ├── driver/
   ├── student/
   └── admin/         # New sub-module

2. Extract shared logic:
   modules/users/
   ├── parent/
   ├── driver/
   ├── student/
   └── shared/        # Shared user utilities
       ├── user.base.handler.ts
       └── user.base.repository.ts
```

### Performance Optimization

```typescript
// Caching layer (if needed)
class ParentHandler {
  async getProfile(req, res) {
    const cached = await redisService.get(`parent:${userId}`);
    if (cached) return res.json(cached);

    const profile = await repository.findByUserId(userId);
    await redisService.set(`parent:${userId}`, profile, 3600);

    return res.json(profile);
  }
}
```

### Testing Strategy

```
Unit Tests:
├── Handler unit tests (mock repository)
├── Repository unit tests (in-memory MongoDB)
└── Validation schema tests

Integration Tests:
├── Full request flow tests
└── Database integration tests

E2E Tests:
└── Complete user journey tests
```

---

## Diagrams

### Domain Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        DOMAINS                              │
│                                                             │
│  ┌─────────┐     ┌──────────┐     ┌──────────┐            │
│  │  AUTH   │────▶│  USERS   │────▶│  TRIPS   │            │
│  └─────────┘     └──────────┘     └──────────┘            │
│       │               │                 │                   │
│       │               │                 │                   │
│       │               ▼                 ▼                   │
│       │          ┌──────────┐     ┌──────────┐            │
│       │          │ BILLING  │     │  SCHOOL  │            │
│       │          └──────────┘     └──────────┘            │
│       │               │                                     │
│       ▼               ▼                                     │
│  ┌──────────┐   ┌──────────┐                              │
│  │  ADMIN   │   │ REVIEWS  │                              │
│  └──────────┘   └──────────┘                              │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────────┐                                          │
│  │NOTIFICATIONS │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘

Legend:
────▶  Depends on
```

---

## Summary

Version 2 architecture represents a significant improvement in:

1. **Developer Experience**: Easier to find and modify code
2. **Maintainability**: Clear domain boundaries, cohesive modules
3. **Simplicity**: 2-layer architecture reduces unnecessary abstraction
4. **Scalability**: Easy to add new domains and features
5. **Onboarding**: Intuitive structure for new team members

### Key Takeaways

- ✅ **Domain-Driven**: Organize by business domain, not technical layer
- ✅ **2-Layer Architecture**: Handler + Repository (simpler than 3-layer)
- ✅ **Cohesive Modules**: All code for a feature in one place
- ✅ **Shared Code**: Centralized in `shared/` folder
- ✅ **Consistent Patterns**: Standard module structure across all domains
- ✅ **Type-Safe**: Full TypeScript support with proper typing
- ✅ **Testable**: Clear dependencies, mockable repositories

---

**Document Version:** 2.0.0
**Maintained By:** Development Team
**Last Updated:** 2026-01-08
**Next Review:** When implementing v2.1 features
