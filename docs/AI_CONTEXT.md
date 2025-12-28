# AI Context Documentation - Ping Parent Backend

## Overview

This document provides comprehensive context for AI agents working on the Ping Parent backend project. It defines project structure, naming conventions, patterns, and implementation guidelines based on the existing auth module implementation.

### 📋 Quick Start for AI Agents

When asked to create a new feature (e.g., "Create a School module"):

1. **Read the database schema** → `Database/ping_parent_dbdiagram.dbml`
2. **Copy the auth pattern** → Use `src/**/auth.*` files as templates
3. **Create 6 files** → types, validations, repository, service, controller, routes
4. **Update 3 files** → constants/collections.ts, constants/messages.ts, routes/index.ts
5. **Update documentation** → Add endpoints to `docs/API_DOCUMENTATION.md` and `docs/swagger.yaml`

### 🎯 Critical Rules

- ✅ Field names in **snake_case** (e.g., `user_id`, `phone_number`)
- ✅ One entity = one file per layer (e.g., `school.controller.ts`)
- ✅ Files in layer folders (NOT feature folders)
- ✅ Use constants (NO hardcoded strings)
- ✅ Repository extends `BaseRepository`
- ✅ Controller uses `asyncHandler`
- ✅ Controller exports WITHOUT "Controller" suffix (e.g., `export const getAllSchools`)
- ✅ Add duplicate checking for create/update operations

---

## Table of Contents

1. [Database Schema Reference](#database-schema-reference)
2. [Project Architecture](#project-architecture)
3. [Naming Conventions](#naming-conventions)
4. [File Structure Patterns](#file-structure-patterns)
5. [Constants & Configuration](#constants--configuration)
6. [Validation & Error Handling](#validation--error-handling)
7. [Middleware Patterns](#middleware-patterns)
8. [Implementation Checklist](#implementation-checklist)
9. [Key Patterns](#key-patterns)
10. [Quick Reference](#quick-reference)

---

## Database Schema Reference

**Location**: `Database/ping_parent_dbdiagram.dbml`

All types, field names, enums, and validations MUST follow the database schema. Key points:

- **Field naming**: Use snake_case (e.g., `user_id`, `phone_number`, `created_at`)
- **Enum values**: Lowercase strings (e.g., `"parent"`, `"driver"`, `"pending"`)
- **ID fields**: Use `varchar(36)` for primary keys (UUID/nanoid)
- **Timestamps**: Use `Date` type, default to `CURRENT_TIMESTAMP`
- **Boolean fields**: Use `boolean` type with default values

### Core Database Tables

```
users → Base user table (phone_number, user_type, is_active)
parents → Parent profile (name, email, photo_url)
drivers → Driver profile (name, vehicle_type, vehicle_number, approval_status)
students → Student records (linked to parents and schools)
trips → Trip management (pickup/drop, status tracking)
```

---

## Project Architecture

### Layer Structure

```
src/
├── config/           # Configuration files (database, redis, env)
├── constants/        # Constants (messages, enums, HTTP status, collections)
├── controllers/      # Request handlers (thin layer)
├── middlewares/      # Express middlewares (auth, validation, error handling)
├── repositories/     # Database access layer (extends BaseRepository)
├── routes/           # Route definitions
├── services/         # Business logic layer
├── types/            # TypeScript type definitions
├── utils/            # Helper functions and utilities
├── validations/      # Joi validation schemas
└── environment/      # Environment files (.env)
```

### Design Philosophy

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Thin Controllers**: Controllers only handle HTTP request/response
3. **Business Logic in Services**: All logic belongs in service layer
4. **Repository Pattern**: All database operations through repositories
5. **Type Safety**: Strong typing throughout with TypeScript

---

## Naming Conventions

### Files & Folders

```
Controllers:    {entity}.controller.ts     (e.g., auth.controller.ts)
Services:       {entity}.service.ts        (e.g., auth.service.ts)
Repositories:   {entity}.repository.ts     (e.g., auth.repository.ts)
Routes:         {entity}.routes.ts         (e.g., auth.routes.ts)
Types:          {entity}.type.ts           (e.g., auth.type.ts)
Validations:    {entity}.validation.ts     (e.g., auth.validation.ts)
Middlewares:    {purpose}.middleware.ts    (e.g., validate.middleware.ts)
```

### Variables & Functions

```typescript
// Database fields - snake_case (matches DBML schema)
user_id, phone_number, created_at, is_active

// TypeScript variables - camelCase
const normalizedPhone = normalizePhone(phone);
const isNewUser = false;

// Types & Interfaces - PascalCase
interface User { }
type UserType = "parent" | "driver";

// Enums - PascalCase
enum UserRole { ADMIN = "admin", PARENT = "parent" }

// Constants - SCREAMING_SNAKE_CASE
const HTTP_STATUS = { OK: 200 };
const ERROR_MESSAGES = { AUTH: { ... } };

// Functions - camelCase, descriptive verbs
getUserById(), createPhoneOtp(), verifyLoginOtp()
```

### Collection Names

All MongoDB collections use lowercase snake_case:

```typescript
// constants/collections.ts
export const COLLECTIONS = {
  USERS: "users",
  OTP_VERIFICATION: "otp_verification",
  PARENTS: "parents",
  PARENT_ADDRESSES: "parent_addresses",
  DRIVERS: "drivers",
  STUDENTS: "students",
};
```

---

## File Structure Patterns

### 1. Types (`types/{entity}.type.ts`)

**Purpose**: TypeScript interfaces matching DBML schema

**IMPORTANT**: Define enums in `constants/enums.ts` (NOT in type files as type unions)

```typescript
// Import enums from constants
import { EntityStatus } from "@constants/enums";

export interface Entity {
  _id?: any; // MongoDB internal ID
  entity_id: string; // Use snake_case to match DB schema
  field_name: string;
  status: EntityStatus; // Use enum from constants/enums.ts
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
```

**Example**:

```typescript
// types/student.type.ts
import { Gender } from "@constants/enums"; // Import enum from constants

export interface Student {
  _id?: any;
  student_id: string;
  parent_id: string;
  student_name: string;
  gender?: Gender; // Use enum from constants
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
```

**Enums belong in `constants/enums.ts`**:

```typescript
// constants/enums.ts
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum UserRole {
  ADMIN = "admin",
  PARENT = "parent",
  DRIVER = "driver",
}
```

---

### 2. Validations (`validations/{entity}.validation.ts`)

**Purpose**: Joi schemas for request validation

```typescript
import Joi from "joi";
import { VALIDATION_MESSAGES } from "@constants";

export const createEntitySchema = Joi.object({
  field_name: Joi.string().min(3).max(100).required().messages({
    "string.min": VALIDATION_MESSAGES.FIELD.MIN_LENGTH,
    "any.required": VALIDATION_MESSAGES.FIELD.REQUIRED,
  }),
  enum_field: Joi.string().valid("value1", "value2").optional().messages({
    "any.only": VALIDATION_MESSAGES.FIELD.INVALID_VALUE,
  }),
});
```

**Common Validation Patterns**:

```typescript
// Phone validation
phone: Joi.string()
  .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
  .required();

// Email validation
email: Joi.string().email().lowercase().required();

// Enum validation
status: Joi.string()
  .valid("pending", "approved", "rejected")
  .default("pending");

// Nested object validation
address: Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

// Array validation
tags: Joi.array().items(Joi.string()).min(1).max(10);
```

---

### 3. Repositories (`repositories/{entity}.repository.ts`)

**Purpose**: Database operations, extend BaseRepository

```typescript
import { WithId } from "mongodb";
import { COLLECTION_NAME } from "@constants";
import { EntityType } from "@models/{entity}.type";
import { BaseRepository } from "./base.repository";

export class EntityRepository extends BaseRepository<EntityType> {
  constructor() {
    super(COLLECTION_NAME);
  }

  async findByCustomField(field: string): Promise<WithId<EntityType> | null> {
    return await this.findOne({ custom_field: field });
  }

  async customExists(field: string): Promise<boolean> {
    return await this.exists({ custom_field: field });
  }
}

export const entityRepository = new EntityRepository();
```

---

### 4. Services (`services/{entity}.service.ts`)

**Purpose**: Business logic, orchestrate repositories

```typescript
import { repository } from "@repositories/{entity}.repository";

export const createEntity = async (data: EntityType) => {
  return await repository.create(data);
};

export const getEntityById = async (
  id: string,
): Promise<WithId<EntityType> | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return await repository.findById(id);
};

export const getEntityByField = async (
  field: string,
): Promise<WithId<EntityType> | null> => {
  return await repository.findByField(field);
};
```

---

### 5. Controllers (`controllers/{entity}.controller.ts`)

**Purpose**: Handle HTTP requests/responses, minimal logic

**CRITICAL: Export controller functions WITHOUT the "Controller" suffix**
- ✅ Correct: `export const createSchool`, `export const getAllSchools`
- ❌ Wrong: `export const createSchoolController`, `export const getAllSchoolsController`

```typescript
import { Request, Response } from "express";
import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from "@constants";
import { ApiError, asyncHandler } from "@middlewares";
import { serviceFunction } from "@services/{entity}.service";

export const controllerName = asyncHandler(
  async (req: Request, res: Response) => {
    // 1. Extract data from request
    const { field1, field2 } = req.body;

    // 2. Validate input (basic checks)
    if (!field1) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.ENTITY.FIELD_REQUIRED,
      );
    }

    // 3. Call service layer
    const result = await serviceFunction(field1, field2);

    // 4. Return response
    return res.json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.ENTITY.ACTION_SUCCESSFUL,
    });
  },
);
```

---

### 6. Routes (`routes/{entity}.routes.ts`)

**Purpose**: Define API endpoints and apply middlewares

```typescript
import { Router } from "express";
import {
  controllerFunction1,
  controllerFunction2,
} from "@controllers/{entity}.controller";
import { authMiddleware, validate } from "@middlewares";
import { validationSchema } from "@validations/{entity}.validation";

const router = Router();

// Public routes
router.post("/action", validate(validationSchema), controllerFunction1);

// Protected routes
router.get("/profile", authMiddleware, controllerFunction2);

export default router;
```

**Middleware Order (CRITICAL)**:

```typescript
router.post(
  "/endpoint",
  validate(schema),      // 1. Validation first
  authMiddleware,        // 2. Authentication second
  rateLimiter,          // 3. Rate limiting (if needed)
  controllerFunction,   // 4. Controller last
);
```

---

## Constants & Configuration

### Constants Structure

**IMPORTANT: Reuse Existing Constants**
- Before adding new constants, **ALWAYS check if similar constants already exist**
- Search through `constants/messages.ts`, `constants/validationMessages.ts`
- Reuse existing constants instead of creating duplicates
- Only create new constants when existing ones don't fit

```typescript
// constants/httpStatus.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// constants/messages.ts
export const ERROR_MESSAGES = {
  ENTITY: {
    NOT_FOUND: "Entity not found",
    ALREADY_EXISTS: "Entity already exists",
  },
};

export const SUCCESS_MESSAGES = {
  ENTITY: {
    CREATED: "Entity created successfully",
    UPDATED: "Entity updated successfully",
  },
};

// constants/collections.ts
export const COLLECTIONS = {
  ENTITY: "entity_collection_name",
};
export const ENTITY_COLLECTION = COLLECTIONS.ENTITY;

// constants/validationMessages.ts
export const VALIDATION_MESSAGES = {
  FIELD: {
    REQUIRED: "Field is required",
    INVALID: "Field is invalid",
  },
};
```

---

## Validation & Error Handling

### ApiError Class

The `ApiError` class provides both direct instantiation and convenient static factory methods. **All hardcoded values must use constants.**

```typescript
// Direct usage (for specific messages)
throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.AUTH.USER_NOT_FOUND);

throw new ApiError(
  HTTP_STATUS.CONFLICT,
  ERROR_MESSAGES.PHONE.PHONE_ALREADY_REGISTERED,
);

// Static methods (for common errors with default messages)
throw ApiError.notFound();
throw ApiError.notFound(ERROR_MESSAGES.STUDENT.NOT_FOUND);
throw ApiError.unauthorized();
throw ApiError.conflict();
throw ApiError.validationError({ field: "email", message: "Invalid format" });
```

### ApiResponse Class

```typescript
// Success responses
return ApiResponse.success(res, userData);
return ApiResponse.success(res, userData, SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESSFUL);
return ApiResponse.created(res, newUser);
return ApiResponse.created(res, newUser, SUCCESS_MESSAGES.STUDENT.CREATED_SUCCESSFULLY);

// Error responses
return ApiResponse.notFound(res);
return ApiResponse.notFound(res, ERROR_MESSAGES.STUDENT.NOT_FOUND);
return ApiResponse.unauthorized(res);
return ApiResponse.badRequest(res, ERROR_MESSAGES.VALIDATION.INVALID_INPUT);
```

### Request Validation Middleware

```typescript
// middlewares/validate.middleware.ts
import { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "joi";
import { HTTP_STATUS } from "@constants";

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "Validation error",
        details: errors,
      });
    }

    req.body = value;
    next();
  };
};
```

---

## Middleware Patterns

### Authentication Middlewares

The project uses role-based authentication middlewares located in `middlewares/auth.middleware.ts`.

**1. Generic Token Verification (`verifyToken_Middleware`)**:
```typescript
// Use for routes that require authentication but any role is allowed
router.get("/profile", verifyToken_Middleware, getProfile);
```

**2. Parent-Specific Authentication (`verifyParentToken`)**:
```typescript
// Use for parent-only routes
router.get("/my-children", verifyParentToken, getMyChildren);
```

**3. Driver-Specific Authentication (`verifyDriverToken`)**:
```typescript
// Use for driver-only routes
router.get("/my-trips", verifyDriverToken, getMyTrips);
```

### Other Middlewares

**AsyncHandler** - Wraps async route handlers to catch errors:
```typescript
import { asyncHandler } from "@middlewares";

export const myController = asyncHandler(async (req, res) => {
  // Your code - errors automatically caught and passed to error handler
});
```

**Rate Limiting**:
```typescript
import { loginRateLimiter } from "@middlewares";

// For sensitive operations like OTP generation
router.post("/send-otp", validate(sendOTPSchema), loginRateLimiter, sendOtp);
```

---

## Implementation Checklist

When creating a new module (e.g., "schools"), follow these steps **in order**:

### ✅ Step-by-Step Process

1. **Check Database Schema** (`Database/ping_parent_dbdiagram.dbml`)
   - Note all fields, types, and constraints
   - Identify enums and default values
   - Identify relationships (foreign keys)

2. **Create Type Definition** (`types/{entity}.type.ts`)
   - Create interface with snake_case fields matching DB schema
   - Import enums from `constants/enums.ts` (do NOT define as type unions)
   - Include `_id?: any` for MongoDB

3. **Add Constants**:
   - Collection name in `constants/collections.ts`
   - Error messages in `constants/messages.ts` (ERROR_MESSAGES)
   - Success messages in `constants/messages.ts` (SUCCESS_MESSAGES)
   - **Enums in `constants/enums.ts`** (ALL enums go here, not in type files)

4. **Create Validation Schemas** (`validations/{entity}.validation.ts`)
   - Use Joi for request validation
   - Reference VALIDATION_MESSAGES for error messages
   - Create separate schemas for create/update operations

5. **Create Repository** (`repositories/{entity}.repository.ts`)
   - Extend BaseRepository
   - Add custom query methods as needed
   - Export singleton instance

6. **Create Service** (`services/{entity}.service.ts`)
   - Implement business logic
   - Use repository for database operations
   - Handle data transformation

7. **Create Controller** (`controllers/{entity}.controller.ts`)
   - Use asyncHandler wrapper
   - Extract request data
   - Call service methods
   - Return standardized responses
   - **Export WITHOUT "Controller" suffix**

8. **Create Routes** (`routes/{entity}.routes.ts`)
   - Define endpoints
   - Apply validation middleware
   - Apply auth middleware where needed
   - Export router

9. **Register Routes** (`routes/index.ts`)
   - Import and mount entity routes

10. **Update API Documentation** (`docs/API_DOCUMENTATION.md`)
    - Add all new endpoints with request/response examples

11. **Update Swagger Documentation** (`docs/swagger.yaml`)
    - Add schemas and endpoint definitions

### ✅ Verification Checklist

Before considering the task complete, verify:

- [ ] All field names use snake_case (match DB schema)
- [ ] All enum values are lowercase strings
- [ ] All constants are used from centralized files
- [ ] All files are in correct folders (no feature folders)
- [ ] Repository extends BaseRepository
- [ ] Controller uses asyncHandler
- [ ] Controller exports WITHOUT "Controller" suffix
- [ ] Routes use correct middleware order (validate → auth → controller)
- [ ] Error messages use ApiError class
- [ ] Success/error messages use constants
- [ ] Routes are registered in routes/index.ts
- [ ] API documentation is updated
- [ ] Swagger documentation is updated

---

## Key Patterns

### 1. User ID to Foreign Key Conversion Pattern

**CRITICAL PATTERN**: When implementing modules that reference parent or driver entities (like students, addresses), convert the authenticated user's `userId` to the appropriate foreign key.

**Database Relationship Chain**:
```
users.user_id (from JWT) → parents.user_id → parents._id (stored as parent_id in child tables)
users.user_id (from JWT) → drivers.user_id → drivers._id (stored as driver_id in child tables)
```

**Implementation**:

```typescript
// services/student.service.ts

// Helper function to convert userId to parent_id
const getParentIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    return null;
  }

  return String(parent._id);
};

// Create operation - accept userId, convert internally
export const createStudent = async (
  userId: string,
  data: Omit<Student, "student_id" | "parent_id" | "created_at" | "is_active">,
): Promise<WithId<Student>> => {
  // Convert user_id to parent_id
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // Create student with correct parent_id
  const studentData: Student = {
    student_id: nanoid(),
    parent_id: parentId, // Use converted parent_id
    ...data,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await studentRepository.create(studentData);
};
```

**Controller Layer**:
```typescript
export const createStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From JWT token

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const studentData = req.body; // Does NOT include parent_id

    const student = await createStudentService(userId, studentData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.CREATED_SUCCESSFULLY,
    });
  },
);
```

**Validation Layer** - Remove foreign key from request:
```typescript
// DON'T accept parent_id from request body
export const createStudentSchema = Joi.object({
  // parent_id removed - derived from authenticated user
  student_name: Joi.string().required(),
  school_id: Joi.string().required(),
  // ... other fields
});
```

**Benefits**:
- Security: Users can only create/modify their own child records
- Simplified API: Clients don't need to provide parent_id/driver_id
- Data Integrity: Prevents users from creating records for others

---

### 2. Duplicate Checking Pattern

**CRITICAL**: Always implement duplicate checking for create and update operations to prevent data duplication.

**Repository Method**:
```typescript
async findDuplicateStudent(
  parentId: string,
  studentName: string,
  schoolId: string,
  classValue: string,
): Promise<WithId<Student> | null> {
  return await this.findOne({
    parent_id: parentId,
    student_name: studentName,
    school_id: schoolId,
    class: classValue,
    is_active: true, // Only check active records
  });
}
```

**Service Layer - Create**:
```typescript
export const createStudent = async (
  data: Omit<Student, "student_id" | "created_at" | "is_active">,
): Promise<WithId<Student>> => {
  // Check for duplicate student
  const duplicate = await studentRepository.findDuplicateStudent(
    data.parent_id,
    data.student_name,
    data.school_id,
    data.class,
  );

  if (duplicate) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.STUDENT.ALREADY_EXISTS,
    );
  }

  // Proceed with creation...
};
```

**Service Layer - Update**:
```typescript
export const updateStudent = async (
  id: string,
  updates: Partial<Student>,
): Promise<WithId<Student> | null> => {
  const currentStudent = await studentRepository.findById(id);

  if (!currentStudent) {
    return null;
  }

  // Check for duplicate if updating critical fields
  if (
    updates.student_name ||
    updates.school_id ||
    updates.class ||
    updates.parent_id
  ) {
    const duplicate = await studentRepository.findDuplicateStudent(
      updates.parent_id || currentStudent.parent_id,
      updates.student_name || currentStudent.student_name,
      updates.school_id || currentStudent.school_id,
      updates.class || currentStudent.class,
    );

    // If duplicate exists and it's not the same student
    if (duplicate && duplicate._id.toString() !== id) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.STUDENT.ALREADY_EXISTS,
      );
    }
  }

  // Proceed with update...
};
```

---

## Quick Reference

### Common Patterns

**ID Generation**:
```typescript
import { nanoid } from "nanoid";
const id = nanoid();
```

**Timestamps**:
```typescript
created_at: new Date(),
updated_at: new Date()
```

**Soft Delete**:
```typescript
$set: { is_active: false, updated_at: new Date() }
```

**Update Pattern**:
```typescript
await repository.updateById(id, {
  $set: { ...updates, updated_at: new Date() },
});
```

**Phone Normalization**:
```typescript
import { normalizePhone } from "@utils";
const normalizedPhone = normalizePhone(phone);
```

**Response Formats**:
```typescript
// Success Response
return res.json({
  success: true,
  data: result,
  message: SUCCESS_MESSAGES.ENTITY.ACTION_SUCCESSFUL,
});

// Error Response (throw ApiError to be caught by error handler)
throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ENTITY.NOT_FOUND);
```

### Import Aliases

The project uses TypeScript path aliases:

```typescript
import { something } from "@config";        // src/config
import { HTTP_STATUS } from "@constants";   // src/constants
import { controller } from "@controllers";  // src/controllers
import { middleware } from "@middlewares";  // src/middlewares
import { Type } from "@models";             // src/types (use @models alias)
import { repository } from "@repositories"; // src/repositories
import { service } from "@services";        // src/services
import { helper } from "@utils";            // src/utils
import { schema } from "@validations";      // src/validations
```

### File Placement Standards

**One Entity = One Set of Files**:

```
src/
├── types/
│   └── school.type.ts              ✓ Type definitions
├── constants/
│   ├── collections.ts              ✓ Add SCHOOLS collection
│   └── messages.ts                 ✓ Add SCHOOL messages
├── validations/
│   └── school.validation.ts        ✓ Joi schemas
├── repositories/
│   └── school.repository.ts        ✓ Database operations
├── services/
│   └── school.service.ts           ✓ Business logic
├── controllers/
│   └── school.controller.ts        ✓ HTTP handlers
└── routes/
    └── school.routes.ts            ✓ Route definitions
```

**✅ DO**: Place each entity in its own dedicated file, group by layer
**❌ DON'T**: Create feature folders (e.g., `features/school/`)

---

## Final Notes for AI Agents

1. **Always Read Database Schema First**: Consult `Database/ping_parent_dbdiagram.dbml` for accurate field names, types, and relationships.

2. **Follow Auth Module Pattern**: Use the auth module (`src/**/auth.*`) as the gold standard for code structure and organization.

3. **Use Existing Constants**: Never hardcode messages, status codes, or collection names. Search existing constants first.

4. **Type Safety**: Always use TypeScript types and interfaces. Never use `any` except for `_id` field.

5. **Database Field Names**: Use snake_case in types/interfaces to match MongoDB documents.

6. **Error Handling**: Always use `ApiError` class and `asyncHandler` wrapper.

7. **Validation**: Use Joi schemas for all request validation through the validate middleware.

8. **Repository Pattern**: All database operations must go through repository layer.

9. **Service Layer**: Business logic belongs in services, not controllers.

10. **Controller Exports**: Export functions WITHOUT "Controller" suffix.

11. **User ID Conversion**: Convert `userId` to foreign keys (`parent_id`, `driver_id`) in service layer for create operations.

12. **Duplicate Checking**: Implement duplicate checking for create/update operations based on business logic.

13. **Update Documentation**: After implementing a new module, update both `docs/API_DOCUMENTATION.md` and `docs/swagger.yaml`.

---

## Additional Resources

For detailed implementation examples, see:
- **[IMPLEMENTATION_EXAMPLES.md](./IMPLEMENTATION_EXAMPLES.md)** - Complete module examples (Student, Trip)
- **[SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md)** - Swagger/OpenAPI documentation guide
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common mistakes and debugging tips

---

**Document Version**: 2.0
**Last Updated**: 2025
