# AI Context Documentation - Ping Parent Backend

## Overview
This document provides comprehensive context for AI agents working on the Ping Parent backend project. It defines project structure, naming conventions, patterns, and implementation guidelines based on the existing auth module implementation.

### 📋 TL;DR - Quick Instructions for AI Agents

When asked to create a new feature (e.g., "Create a School module"):

1. **Read the database schema** → `Database/ping_parent_dbdiagram.dbml`
2. **Copy the auth pattern** → Use `src/**/auth.*` files as templates
3. **Create 6 files** → types, validations, repository, service, controller, routes
4. **Update 3 files** → constants/collections.ts, constants/messages.ts, routes/index.ts
5. **Follow these rules**:
   - ✅ Field names in **snake_case** (e.g., `user_id`, `phone_number`)
   - ✅ One entity = one file per layer (e.g., `school.controller.ts`)
   - ✅ Files in layer folders (NOT feature folders)
   - ✅ Use constants (NO hardcoded strings)
   - ✅ Repository extends `BaseRepository`
   - ✅ Controller uses `asyncHandler`
   - ✅ Middleware order: validate → auth → controller

### 🎯 Document Purpose

This document serves as:
- **Single source of truth** for code structure and patterns
- **Implementation guide** with complete working examples
- **Reference manual** for naming conventions and standards
- **Quality checklist** to ensure consistency across the codebase

---

## Table of Contents
1. [Database Schema Reference](#database-schema-reference)
2. [Project Architecture](#project-architecture)
3. [Naming Conventions](#naming-conventions)
4. [File Structure Patterns](#file-structure-patterns)
5. [Implementation Examples](#implementation-examples)
6. [Constants & Configuration](#constants--configuration)
7. [Validation Patterns](#validation-patterns)
8. [Error Handling](#error-handling)
9. [Middleware Patterns](#middleware-patterns)
10. [File Placement Standards](#file-placement-standards)
11. [Quick Reference Guide](#quick-reference-guide)
12. [AI Agent Instructions](#ai-agent-instructions)

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
};
```

---

## File Structure Patterns

### 1. Routes (`routes/{entity}.routes.ts`)

**Purpose**: Define API endpoints and apply middlewares

```typescript
import { Router } from "express";
import {
  controllerFunction1,
  controllerFunction2,
} from "@controllers/{entity}.controller";
import { validate, authMiddleware } from "@middlewares";
import { validationSchema } from "@validations/{entity}.validation";

const router = Router();

// Public routes
router.post("/action", validate(validationSchema), controllerFunction1);

// Protected routes
router.get("/profile", authMiddleware, controllerFunction2);

export default router;
```

**Example (auth.routes.ts)**:
```typescript
router.post("/register/send-otp", validate(sendOTPSchema), loginRateLimiter, sendPhoneOtp);
router.post("/login/verify-otp", validate(verifyOTPSchema), loginRateLimiter, verifyLoginOtp);
router.get("/verify-token", verifyAuthToken);
```

---

### 2. Controllers (`controllers/{entity}.controller.ts`)

**Purpose**: Handle HTTP requests/responses, minimal logic

```typescript
import { Request, Response } from "express";
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@constants";
import { ApiError, asyncHandler } from "@middlewares";
import { serviceFunction } from "@services/{entity}.service";

export const controllerName = asyncHandler(
  async (req: Request, res: Response) => {
    // 1. Extract data from request
    const { field1, field2 } = req.body;

    // 2. Validate input (basic checks)
    if (!field1) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.ENTITY.FIELD_REQUIRED);
    }

    // 3. Call service layer
    const result = await serviceFunction(field1, field2);

    // 4. Return response
    return res.json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.ENTITY.ACTION_SUCCESSFUL,
    });
  }
);
```

**Example (sendPhoneOtp from auth.controller.ts)**:
```typescript
export const sendPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.PHONE.INVALID_PHONE);
  }

  const existing = await getUserByPhone(normalizedPhone);
  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.PHONE.PHONE_ALREADY_REGISTERED);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await createPhoneOtp(normalizedPhone, otp, 10);

  logger.info(`OTP for ${normalizedPhone}: ${otp}`);

  return res.json({
    success: true,
    message: SUCCESS_MESSAGES.PHONE.OTP_SENT,
  });
});
```

---

### 3. Services (`services/{entity}.service.ts`)

**Purpose**: Business logic, orchestrate repositories

```typescript
import { repository } from "@repositories/{entity}.repository";

export const createEntity = async (data: EntityType) => {
  return await repository.create(data);
};

export const getEntityById = async (id: string): Promise<WithId<EntityType> | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return await repository.findById(id);
};

export const getEntityByField = async (field: string): Promise<WithId<EntityType> | null> => {
  return await repository.findByField(field);
};
```

**Example (auth.service.ts)**:
```typescript
export const createUser = async (data: User) => {
  return await userRepository.create(data);
};

export const getUserByPhone = async (phone: string): Promise<WithId<User> | null> => {
  return await userRepository.findByPhoneNumber(phone);
};

export const createPhoneOtp = async (phone: string, otp: string, ttlMinutes = 10) => {
  const db = await getDB();
  const now = new Date();
  const doc = {
    phone_number: phone,
    otp_code: otp,
    expires_at: new Date(now.getTime() + ttlMinutes * 60 * 1000),
    is_verified: false,
    created_at: now,
  };
  const res = await db.collection(OTP_VERIFICATION_COLLECTION).insertOne(doc);
  return res.insertedId;
};
```

---

### 4. Repositories (`repositories/{entity}.repository.ts`)

**Purpose**: Database operations, extend BaseRepository

```typescript
import { WithId } from "mongodb";
import { COLLECTION_NAME } from "@constants";
import { EntityType } from "@types/{entity}.type";
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

**Example (auth.repository.ts)**:
```typescript
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(USERS_COLLECTION);
  }

  async findByEmail(email: string): Promise<WithId<User> | null> {
    return await this.findOne({ email: email.toLowerCase() });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<WithId<User> | null> {
    return await this.findOne({ phone_number: phoneNumber });
  }

  async emailExists(email: string): Promise<boolean> {
    return await this.exists({ email: email.toLowerCase() });
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    return await this.exists({ phone_number: phoneNumber });
  }
}

export const userRepository = new UserRepository();
```

---

### 5. Types (`types/{entity}.type.ts`)

**Purpose**: TypeScript interfaces matching DBML schema

```typescript
export type EntityEnum = "value1" | "value2";

export interface Entity {
  _id?: any; // MongoDB internal ID
  entity_id: string; // Use snake_case to match DB schema
  field_name: string;
  enum_field: EntityEnum;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
```

**Example (auth.type.ts)**:
```typescript
export type UserType = "parent" | "driver";

export interface User {
  _id?: any; // MongoDB internal ID
  user_id: string;
  phone_number: string;
  user_type: UserType;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
  last_login?: Date;
  fcm_token?: string;
}

export interface OtpVerification {
  _id?: any;
  otp_id: number;
  phone_number: string;
  otp_code: string;
  is_verified: boolean;
  expires_at: Date;
  created_at: Date;
}
```

---

### 6. Validations (`validations/{entity}.validation.ts`)

**Purpose**: Joi schemas for request validation

```typescript
import Joi from "joi";
import { VALIDATION_MESSAGES } from "@constants";

export const createEntitySchema = Joi.object({
  field_name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.min": VALIDATION_MESSAGES.FIELD.MIN_LENGTH,
      "any.required": VALIDATION_MESSAGES.FIELD.REQUIRED,
    }),
  enum_field: Joi.string()
    .valid("value1", "value2")
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.FIELD.INVALID_VALUE,
    }),
});
```

**Example (auth.validation.ts)**:
```typescript
export const sendOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .required()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.PHONE.INVALID,
      "any.required": VALIDATION_MESSAGES.PHONE.REQUIRED,
    }),
  role: Joi.string()
    .valid("parent", "driver")
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.ROLE.INVALID,
    }),
});

export const verifyOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .required()
    .messages({
      "string.pattern.base": VALIDATION_MESSAGES.PHONE.INVALID,
      "any.required": VALIDATION_MESSAGES.PHONE.REQUIRED,
    }),
  otp: Joi.string()
    .length(6)
    .required()
    .messages({
      "string.length": VALIDATION_MESSAGES.OTP.LENGTH,
      "any.required": VALIDATION_MESSAGES.OTP.REQUIRED,
    }),
});
```

---

## Constants & Configuration

### Constants Structure

All constants are centralized in `constants/` directory:

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

// constants/enums.ts
export enum EntityStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
}

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

### Environment Configuration

```typescript
// config/env.ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../environment/.env") });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI as string,
  DB_NAME: process.env.DB_NAME as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
} as const;

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "DB_NAME", "JWT_SECRET"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

## Validation Patterns

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

### Common Validation Patterns

```typescript
// Phone validation
phone: Joi.string()
  .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
  .required()

// Email validation
email: Joi.string()
  .email()
  .lowercase()
  .required()

// Enum validation
status: Joi.string()
  .valid("pending", "approved", "rejected")
  .default("pending")

// Nested object validation
address: Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
})

// Array validation
tags: Joi.array()
  .items(Joi.string())
  .min(1)
  .max(10)
```

---

## Error Handling

### ApiError Class

```typescript
// utils/apiError.ts
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### AsyncHandler Middleware

```typescript
// middlewares/asyncHandler.middleware.ts
import { NextFunction, Request, Response } from "express";

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Global Error Handler

```typescript
// middlewares/error.middleware.ts
import { NextFunction, Request, Response } from "express";
import { ApiError } from "@utils/apiError";
import { HTTP_STATUS } from "@constants";

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode, message } = err;

  if (!statusCode) {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
```

### Error Throwing Pattern

```typescript
// In controllers or services
if (!user) {
  throw new ApiError(
    HTTP_STATUS.NOT_FOUND,
    ERROR_MESSAGES.AUTH.USER_NOT_FOUND
  );
}

if (existingUser) {
  throw new ApiError(
    HTTP_STATUS.CONFLICT,
    ERROR_MESSAGES.PHONE.PHONE_ALREADY_REGISTERED
  );
}
```

---

## Implementation Examples

### Example 1: Creating a Student Module

Based on the database schema:

```dbml
Table students {
  student_id varchar(36) [pk]
  parent_id varchar(36) [not null, ref: > parents.parent_id]
  school_id varchar(36) [not null, ref: > schools.school_id]
  student_name varchar(100) [not null]
  class varchar(20) [not null]
  section varchar(10)
  roll_number varchar(20)
  photo_url varchar(255)
  date_of_birth date
  gender enum [note: 'male, female, other']
  pickup_address_id varchar(36) [not null, ref: > parent_addresses.address_id]
  emergency_contact varchar(20)
  medical_info text
  is_active boolean [default: true]
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp
}
```

**1. Type Definition (`types/student.type.ts`)**:

```typescript
export type Gender = "male" | "female" | "other";

export interface Student {
  _id?: any;
  student_id: string;
  parent_id: string;
  school_id: string;
  student_name: string;
  class: string;
  section?: string;
  roll_number?: string;
  photo_url?: string;
  date_of_birth?: Date;
  gender?: Gender;
  pickup_address_id: string;
  emergency_contact?: string;
  medical_info?: string;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
```

**2. Constants (`constants/collections.ts` - add to existing)**:

```typescript
STUDENTS: "students",
```

```typescript
// constants/messages.ts - add to ERROR_MESSAGES
STUDENT: {
  NOT_FOUND: "Student not found",
  FAILED_TO_CREATE: "Failed to create student",
  FAILED_TO_UPDATE: "Failed to update student",
  NAME_REQUIRED: "Student name is required",
  PARENT_ID_REQUIRED: "Parent ID is required",
  SCHOOL_ID_REQUIRED: "School ID is required",
},

// Add to SUCCESS_MESSAGES
STUDENT: {
  CREATED_SUCCESSFULLY: "Student created successfully",
  UPDATED_SUCCESSFULLY: "Student updated successfully",
  DELETED_SUCCESSFULLY: "Student deleted successfully",
},
```

**3. Validation (`validations/student.validation.ts`)**:

```typescript
import Joi from "joi";
import { VALIDATION_MESSAGES } from "@constants";

export const createStudentSchema = Joi.object({
  parent_id: Joi.string().required().messages({
    "any.required": "Parent ID is required",
  }),
  school_id: Joi.string().required().messages({
    "any.required": "School ID is required",
  }),
  student_name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Student name must be at least 2 characters",
    "any.required": "Student name is required",
  }),
  class: Joi.string().required().messages({
    "any.required": "Class is required",
  }),
  section: Joi.string().optional(),
  roll_number: Joi.string().optional(),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  pickup_address_id: Joi.string().required().messages({
    "any.required": "Pickup address ID is required",
  }),
  emergency_contact: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).optional(),
  medical_info: Joi.string().max(500).optional(),
});

export const updateStudentSchema = Joi.object({
  student_name: Joi.string().min(2).max(100).optional(),
  class: Joi.string().optional(),
  section: Joi.string().optional(),
  roll_number: Joi.string().optional(),
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  pickup_address_id: Joi.string().optional(),
  emergency_contact: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).optional(),
  medical_info: Joi.string().max(500).optional(),
});
```

**4. Repository (`repositories/student.repository.ts`)**:

```typescript
import { WithId } from "mongodb";
import { STUDENTS_COLLECTION } from "@constants";
import { Student } from "@types/student.type";
import { BaseRepository } from "./base.repository";

export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super(STUDENTS_COLLECTION);
  }

  async findByParentId(parentId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ parent_id: parentId });
  }

  async findBySchoolId(schoolId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ school_id: schoolId });
  }

  async findActiveStudents(parentId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ parent_id: parentId, is_active: true });
  }
}

export const studentRepository = new StudentRepository();
```

**5. Service (`services/student.service.ts`)**:

```typescript
import { WithId } from "mongodb";
import { nanoid } from "nanoid";
import { Student } from "@types/student.type";
import { studentRepository } from "@repositories/student.repository";

export const createStudent = async (data: Omit<Student, "student_id" | "created_at" | "is_active">): Promise<WithId<Student>> => {
  const studentData: Student = {
    student_id: nanoid(),
    ...data,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await studentRepository.create(studentData);
};

export const getStudentById = async (id: string): Promise<WithId<Student> | null> => {
  return await studentRepository.findById(id);
};

export const getStudentsByParentId = async (parentId: string): Promise<WithId<Student>[]> => {
  return await studentRepository.findByParentId(parentId);
};

export const updateStudent = async (id: string, updates: Partial<Student>): Promise<WithId<Student> | null> => {
  return await studentRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const deleteStudent = async (id: string): Promise<boolean> => {
  // Soft delete - set is_active to false
  const result = await studentRepository.updateById(id, {
    $set: { is_active: false, updated_at: new Date() },
  });
  return result !== null;
};
```

**6. Controller (`controllers/student.controller.ts`)**:

```typescript
import { Request, Response } from "express";
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@constants";
import { ApiError, asyncHandler } from "@middlewares";
import {
  createStudent,
  getStudentById,
  getStudentsByParentId,
  updateStudent,
  deleteStudent,
} from "@services/student.service";

export const createStudentController = asyncHandler(
  async (req: Request, res: Response) => {
    const studentData = req.body;

    const student = await createStudent(studentData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.CREATED_SUCCESSFULLY,
    });
  }
);

export const getStudentProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const student = await getStudentById(id);

    if (!student) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND
      );
    }

    return res.json({
      success: true,
      data: student,
    });
  }
);

export const getMyStudents = asyncHandler(
  async (req: Request, res: Response) => {
    const parentId = req.user?.userId; // From auth middleware

    if (!parentId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED
      );
    }

    const students = await getStudentsByParentId(parentId);

    return res.json({
      success: true,
      data: students,
    });
  }
);

export const updateStudentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const student = await updateStudent(id, updates);

    if (!student) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND
      );
    }

    return res.json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.UPDATED_SUCCESSFULLY,
    });
  }
);

export const deleteStudentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await deleteStudent(id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.STUDENT.DELETED_SUCCESSFULLY,
    });
  }
);
```

**7. Routes (`routes/student.routes.ts`)**:

```typescript
import { Router } from "express";
import {
  createStudentController,
  getStudentProfile,
  getMyStudents,
  updateStudentController,
  deleteStudentController,
} from "@controllers/student.controller";
import { validate, authMiddleware } from "@middlewares";
import { createStudentSchema, updateStudentSchema } from "@validations/student.validation";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Student CRUD operations
router.post("/", validate(createStudentSchema), createStudentController);
router.get("/my-students", getMyStudents);
router.get("/:id", getStudentProfile);
router.put("/:id", validate(updateStudentSchema), updateStudentController);
router.delete("/:id", deleteStudentController);

export default router;
```

**8. Register Routes (`routes/index.ts` - add to existing)**:

```typescript
import studentRoutes from "./student.routes";

router.use("/students", studentRoutes);
```

---

### Example 2: Creating a Trip Module (Complex Example)

Based on the database schema:

```dbml
Table trips {
  trip_id varchar(36) [pk]
  driver_id varchar(36) [not null, ref: > drivers.driver_id]
  school_id varchar(36) [not null, ref: > schools.school_id]
  trip_type enum [not null, note: 'pickup, drop']
  trip_date date [not null]
  trip_status enum [default: 'scheduled', note: 'scheduled, started, in_progress, completed, cancelled']
  start_time timestamp
  end_time timestamp
  total_distance decimal(10,2)
  optimized_route_data json
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp
}
```

**Type Definition (`types/trip.type.ts`)**:

```typescript
export type TripType = "pickup" | "drop";
export type TripStatus = "scheduled" | "started" | "in_progress" | "completed" | "cancelled";

export interface RoutePoint {
  latitude: number;
  longitude: number;
  address: string;
  sequence_order: number;
}

export interface Trip {
  _id?: any;
  trip_id: string;
  driver_id: string;
  school_id: string;
  trip_type: TripType;
  trip_date: Date;
  trip_status: TripStatus;
  start_time?: Date;
  end_time?: Date;
  total_distance?: number;
  optimized_route_data?: RoutePoint[];
  created_at: Date;
  updated_at?: Date;
}
```

**Service with Business Logic (`services/trip.service.ts`)**:

```typescript
import { WithId } from "mongodb";
import { nanoid } from "nanoid";
import { Trip, TripStatus } from "@types/trip.type";
import { tripRepository } from "@repositories/trip.repository";

export const createTrip = async (data: Omit<Trip, "trip_id" | "created_at" | "trip_status">): Promise<WithId<Trip>> => {
  const tripData: Trip = {
    trip_id: nanoid(),
    ...data,
    trip_status: "scheduled",
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await tripRepository.create(tripData);
};

export const startTrip = async (tripId: string): Promise<WithId<Trip> | null> => {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    return null;
  }

  if (trip.trip_status !== "scheduled") {
    throw new Error("Trip has already been started or is not in scheduled state");
  }

  return await tripRepository.updateById(tripId, {
    $set: {
      trip_status: "started",
      start_time: new Date(),
      updated_at: new Date(),
    },
  });
};

export const completeTrip = async (tripId: string, totalDistance: number): Promise<WithId<Trip> | null> => {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    return null;
  }

  if (trip.trip_status === "completed" || trip.trip_status === "cancelled") {
    throw new Error("Trip is already completed or cancelled");
  }

  return await tripRepository.updateById(tripId, {
    $set: {
      trip_status: "completed",
      end_time: new Date(),
      total_distance: totalDistance,
      updated_at: new Date(),
    },
  });
};

export const getDriverTrips = async (driverId: string, date?: Date): Promise<WithId<Trip>[]> => {
  return await tripRepository.findByDriverAndDate(driverId, date);
};
```

---

## Middleware Patterns

### Authentication Middlewares

The project uses role-based authentication middlewares located in `middlewares/auth.middleware.ts`:

**1. Generic Token Verification (`verifyToken_Middleware`)**:
```typescript
import { verifyToken_Middleware } from "@middlewares";

// Use for routes that require authentication but any role is allowed
router.get("/profile", verifyToken_Middleware, getProfile);
```

**2. Parent-Specific Authentication (`verifyParentToken`)**:
```typescript
import { verifyParentToken } from "@middlewares";

// Use for parent-only routes
router.get("/my-children", verifyParentToken, getMyChildren);
```

**3. Driver-Specific Authentication (`verifyDriverToken`)**:
```typescript
import { verifyDriverToken } from "@middlewares";

// Use for driver-only routes
router.get("/my-trips", verifyDriverToken, getMyTrips);
```

### Validation Middleware

```typescript
import { validate } from "@middlewares";
import { createEntitySchema } from "@validations/entity.validation";

router.post("/entity", validate(createEntitySchema), createEntityController);
```

### Rate Limiting Middleware

For sensitive operations like OTP generation:

```typescript
import { loginRateLimiter } from "@middlewares";

router.post("/send-otp", validate(sendOTPSchema), loginRateLimiter, sendOtp);
```

### Error Handling Middlewares

**1. AsyncHandler** - Wraps async route handlers:
```typescript
import { asyncHandler } from "@middlewares";

export const myController = asyncHandler(async (req, res) => {
  // Your code - errors automatically caught
});
```

**2. NotFound Handler** - 404 responses:
```typescript
// Automatically registered in app.ts
app.use(notFound);
```

**3. Global Error Handler** - Centralized error handling:
```typescript
// Automatically registered in app.ts (must be last middleware)
app.use(errorHandler);
```

### Middleware Order in Routes

**Correct order**:
```typescript
router.post(
  "/endpoint",
  validate(schema),          // 1. Validation first
  authMiddleware,            // 2. Authentication second
  rateLimiter,               // 3. Rate limiting third
  controllerFunction         // 4. Controller last
);
```

### Custom Middleware Pattern

When creating custom middlewares:

```typescript
// middlewares/{purpose}.middleware.ts
import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "@constants";

export const customMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Your middleware logic

    // Attach data to request if needed
    req.customData = someData;

    next(); // Continue to next middleware
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: "Custom middleware error",
    });
  }
};
```

---

## File Placement Standards

### Critical Rule: ONE Entity = ONE Set of Files

When creating a new feature/module (e.g., "schools"), you MUST create files in the following locations:

```
src/
├── types/
│   └── school.type.ts              ✓ Type definitions
├── constants/
│   ├── collections.ts              ✓ Add SCHOOLS collection
│   ├── messages.ts                 ✓ Add SCHOOL error/success messages
│   └── enums.ts                    ✓ Add shared enums (optional)
├── validations/
│   └── school.validation.ts        ✓ Joi validation schemas
├── repositories/
│   └── school.repository.ts        ✓ Database operations
├── services/
│   └── school.service.ts           ✓ Business logic
├── controllers/
│   └── school.controller.ts        ✓ HTTP handlers
└── routes/
    └── school.routes.ts            ✓ Route definitions
```

### File Placement Checklist

**✅ DO:**
- Place each entity in its own dedicated file
- Use consistent naming: `{entity}.{layer}.ts`
- Group related code by layer, not by feature
- Keep one entity per file (single responsibility)

**❌ DON'T:**
- Create feature folders (e.g., `features/school/`)
- Mix multiple entities in one file
- Create nested layer structures
- Place files outside their designated layer folders

### Adding to Existing Files

Some files require updates when adding new entities:

**1. `constants/collections.ts`** - Add new collection:
```typescript
export const COLLECTIONS = {
  // ... existing collections
  SCHOOLS: "schools",  // Add this
};

export const SCHOOLS_COLLECTION = COLLECTIONS.SCHOOLS;
```

**2. `constants/messages.ts`** - Add error/success messages:
```typescript
export const ERROR_MESSAGES = {
  // ... existing
  SCHOOL: {
    NOT_FOUND: "School not found",
    FAILED_TO_CREATE: "Failed to create school",
  },
};

export const SUCCESS_MESSAGES = {
  // ... existing
  SCHOOL: {
    CREATED_SUCCESSFULLY: "School created successfully",
  },
};
```

**3. `constants/enums.ts`** - Add shared enums (if needed):
```typescript
export enum SchoolType {
  PUBLIC = "public",
  PRIVATE = "private",
}
```

**4. `routes/index.ts`** - Register new routes:
```typescript
import schoolRoutes from "./school.routes";

router.use("/schools", schoolRoutes);
```

**5. `middlewares/index.ts`** - Export middleware (if creating new middleware):
```typescript
export * from "./school.middleware";
```

### Folder Structure Rules

```
✓ CORRECT:
src/
├── controllers/
│   ├── auth.controller.ts
│   ├── parent.controller.ts
│   └── school.controller.ts       # Each entity separate
├── services/
│   ├── auth.service.ts
│   ├── parent.service.ts
│   └── school.service.ts          # Parallel structure

✗ INCORRECT:
src/
├── features/
│   └── school/
│       ├── school.controller.ts   # Don't group by feature
│       ├── school.service.ts
│       └── school.routes.ts
```

### Special Folders

**`types/global/`** - Only for global type declarations:
```
types/
├── auth.type.ts              # Entity types
├── parent.type.ts            # Entity types
└── global/                   # Global declarations only
    ├── environment.d.ts      # Environment variables
    └── global.d.ts           # Express request extensions
```

**`environment/`** - Environment files:
```
environment/
├── .env                      # Current environment
├── .env.dev                  # Development
└── .env.prod                 # Production
```

**`config/`** - Configuration files (not entity-specific):
```
config/
├── index.ts                  # Export all configs
├── env.ts                    # Environment config
├── database.ts               # Database connection
└── redis.ts                  # Redis connection
```

### Utils vs Helpers

**`utils/`** - General utility functions:
```
utils/
├── index.ts                  # Export all utils
├── logger.ts                 # Logging utility
├── apiError.ts               # Error class
├── apiResponse.ts            # Response formatter
└── helpers.ts                # Generic helper functions
```

**Don't create entity-specific utils** - Use services instead:
```
✗ utils/schoolHelpers.ts      # Wrong - use services/school.service.ts
✓ services/school.service.ts  # Correct - business logic here
```

---

## Quick Reference Guide

### Creating a New Module Checklist

When creating a new module (e.g., "schools"), follow these steps:

1. **Check Database Schema** (`Database/ping_parent_dbdiagram.dbml`)
   - Note all fields, types, and constraints
   - Identify enums and default values

2. **Create Type Definition** (`types/{entity}.type.ts`)
   - Define enums as union types
   - Create interface with snake_case fields matching DB schema
   - Include `_id?: any` for MongoDB

3. **Add Constants**:
   - Collection name in `constants/collections.ts`
   - Error messages in `constants/messages.ts` (ERROR_MESSAGES)
   - Success messages in `constants/messages.ts` (SUCCESS_MESSAGES)
   - Enums in `constants/enums.ts` if shared across modules

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

8. **Create Routes** (`routes/{entity}.routes.ts`)
   - Define endpoints
   - Apply validation middleware
   - Apply auth middleware where needed
   - Export router

9. **Register Routes** (`routes/index.ts`)
   - Import and mount entity routes

---

### Common Patterns

**ID Generation**:
```typescript
import { nanoid } from "nanoid";
const id = nanoid(); // Generates unique ID
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
  $set: { ...updates, updated_at: new Date() }
});
```

**Phone Normalization**:
```typescript
import { normalizePhone } from "@utils";
const normalizedPhone = normalizePhone(phone);
```

**Response Format**:
```typescript
// Success
return res.json({
  success: true,
  data: result,
  message: SUCCESS_MESSAGES.ENTITY.ACTION_SUCCESSFUL,
});

// Error (throw ApiError)
throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ENTITY.NOT_FOUND);
```

---

### Import Aliases

The project uses TypeScript path aliases (configured in `tsconfig.json`):

```typescript
import { something } from "@config";          // src/config
import { HTTP_STATUS } from "@constants";     // src/constants
import { controller } from "@controllers";    // src/controllers
import { middleware } from "@middlewares";    // src/middlewares
import { repository } from "@repositories";   // src/repositories
import { Router } from "@routes";             // src/routes (not commonly used)
import { service } from "@services";          // src/services
import { Type } from "@types";                // src/types or @models
import { helper } from "@utils";              // src/utils
import { schema } from "@validations";        // src/validations
```

---

### Response Formats

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "details": ["Detail 1", "Detail 2"]
}
```

**Validation Error**:
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    "Phone number is required",
    "Email is invalid"
  ]
}
```

---

## Final Notes for AI Agents

1. **Always Read Database Schema First**: Before implementing any feature, consult `Database/ping_parent_dbdiagram.dbml` for accurate field names, types, and relationships.

2. **Follow Auth Module Pattern**: Use the auth module as the gold standard for code structure, naming, and organization.

3. **Use Existing Constants**: Never hardcode messages, status codes, or collection names. Use centralized constants.

4. **Type Safety**: Always use TypeScript types and interfaces. Never use `any` except for `_id` field.

5. **Database Field Names**: Use snake_case in types/interfaces to match MongoDB documents (e.g., `user_id`, `phone_number`).

6. **Error Handling**: Always use `ApiError` class and `asyncHandler` wrapper.

7. **Validation**: Use Joi schemas for all request validation through the validate middleware.

8. **Repository Pattern**: All database operations must go through repository layer.

9. **Service Layer**: Business logic belongs in services, not controllers.

10. **Testing**: When implementing new features, consider writing tests following the existing test patterns.

---

## AI Agent Instructions

### How AI Agents Should Use This Document

When you receive a task to implement a new feature or module, follow these steps **in order**:

#### Step 1: Read Database Schema
```
1. Open: Database/ping_parent_dbdiagram.dbml
2. Find the relevant table(s)
3. Note all fields, types, enums, and constraints
4. Identify relationships (foreign keys, references)
```

#### Step 2: Plan File Structure
```
Based on entity name (e.g., "school"), you will create:
├── types/school.type.ts
├── validations/school.validation.ts
├── repositories/school.repository.ts
├── services/school.service.ts
├── controllers/school.controller.ts
└── routes/school.routes.ts

And update:
├── constants/collections.ts
├── constants/messages.ts
├── constants/enums.ts (if needed)
└── routes/index.ts
```

#### Step 3: Implement in Correct Order
```
1. Types (defines data structure)
2. Constants (error messages, collection names)
3. Validations (request validation)
4. Repository (database layer)
5. Service (business logic)
6. Controller (HTTP handling)
7. Routes (endpoint definitions)
8. Register routes in routes/index.ts
```

#### Step 4: Follow Auth Module Pattern
```
For every file you create, reference the corresponding auth file:
- auth.type.ts → your entity.type.ts
- auth.validation.ts → your entity.validation.ts
- auth.repository.ts → your entity.repository.ts
- auth.service.ts → your entity.service.ts
- auth.controller.ts → your entity.controller.ts
- auth.routes.ts → your entity.routes.ts
```

#### Step 5: Verify Compliance
Before considering the task complete, verify:
- [ ] All field names use snake_case (match DB schema)
- [ ] All enum values are lowercase strings
- [ ] All constants are used from centralized files
- [ ] All files are in correct folders (no feature folders)
- [ ] Repository extends BaseRepository
- [ ] Controller uses asyncHandler
- [ ] Routes use correct middleware order
- [ ] Error messages use ApiError class
- [ ] Success/error messages use constants
- [ ] Routes are registered in routes/index.ts

### Common AI Agent Mistakes to Avoid

**❌ MISTAKE #1: Wrong Field Naming**
```typescript
// Wrong - camelCase doesn't match DB
interface User {
  userId: string;
  phoneNumber: string;
}

// Correct - snake_case matches DB schema
interface User {
  user_id: string;
  phone_number: string;
}
```

**❌ MISTAKE #2: Creating Feature Folders**
```
Wrong:
src/features/school/
  ├── school.controller.ts
  └── school.service.ts

Correct:
src/controllers/school.controller.ts
src/services/school.service.ts
```

**❌ MISTAKE #3: Hardcoding Messages**
```typescript
// Wrong
throw new Error("User not found");

// Correct
throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
```

**❌ MISTAKE #4: Not Using BaseRepository**
```typescript
// Wrong - Direct MongoDB operations
const collection = db.collection("schools");
const school = await collection.findOne({ _id: id });

// Correct - Extend BaseRepository
export class SchoolRepository extends BaseRepository<School> {
  constructor() {
    super(SCHOOLS_COLLECTION);
  }
}
```

**❌ MISTAKE #5: Business Logic in Controllers**
```typescript
// Wrong - Logic in controller
export const createSchool = asyncHandler(async (req, res) => {
  const school = {
    school_id: nanoid(),
    ...req.body,
    created_at: new Date(),
  };
  const result = await schoolRepository.create(school);
  return res.json({ success: true, data: result });
});

// Correct - Logic in service, controller is thin
export const createSchool = asyncHandler(async (req, res) => {
  const school = await createSchoolService(req.body);
  return res.json({
    success: true,
    data: school,
    message: SUCCESS_MESSAGES.SCHOOL.CREATED_SUCCESSFULLY,
  });
});
```

**❌ MISTAKE #6: Wrong Middleware Order**
```typescript
// Wrong
router.post("/endpoint", controller, validate(schema), authMiddleware);

// Correct
router.post("/endpoint", validate(schema), authMiddleware, controller);
```

**❌ MISTAKE #7: Missing Exports in Index Files**
```typescript
// Wrong - Created school.routes.ts but forgot to register
// routes/index.ts remains unchanged

// Correct - Added to routes/index.ts
import schoolRoutes from "./school.routes";
router.use("/schools", schoolRoutes);
```

### AI Agent Response Template

When implementing a feature, provide this structure in your response:

```markdown
## Implementation: [Entity Name] Module

### Files Created:
1. ✓ types/[entity].type.ts
2. ✓ validations/[entity].validation.ts
3. ✓ repositories/[entity].repository.ts
4. ✓ services/[entity].service.ts
5. ✓ controllers/[entity].controller.ts
6. ✓ routes/[entity].routes.ts

### Files Updated:
1. ✓ constants/collections.ts - Added [ENTITY]_COLLECTION
2. ✓ constants/messages.ts - Added ERROR_MESSAGES.[ENTITY] and SUCCESS_MESSAGES.[ENTITY]
3. ✓ routes/index.ts - Registered [entity]Routes

### Database Schema Reference:
- Table: [table_name]
- Primary Key: [primary_key_field]
- Required Fields: [list required fields]
- Enums: [list enum fields and values]

### API Endpoints Created:
- POST /api/[entity] - Create new [entity]
- GET /api/[entity]/:id - Get [entity] by ID
- PUT /api/[entity]/:id - Update [entity]
- DELETE /api/[entity]/:id - Delete [entity]

### Next Steps:
[Any additional tasks or considerations]
```

### Testing Your Implementation

After implementing, AI agents should verify:

```bash
# 1. TypeScript compilation
npm run build

# 2. Linting
npm run lint

# 3. Format check
npm run format:check

# 4. Run tests (if applicable)
npm test
```

---

## Summary

This document provides a complete blueprint for implementing new features in the Ping Parent backend. By following these patterns and conventions, AI agents can generate consistent, maintainable code that integrates seamlessly with the existing codebase.

### Key Principles

1. **Database Schema First** - Always start with `Database/ping_parent_dbdiagram.dbml`
2. **Follow Auth Pattern** - Use auth module as the reference implementation
3. **Layer Separation** - Keep controllers thin, logic in services, data in repositories
4. **Type Safety** - Use TypeScript types matching DB schema with snake_case
5. **Centralized Constants** - Never hardcode messages, statuses, or collection names
6. **Consistent Structure** - One entity = one set of files across all layers
7. **Proper File Placement** - No feature folders, group by layer
8. **Middleware Order** - Validation → Authentication → Rate Limiting → Controller
9. **Error Handling** - Use ApiError and asyncHandler consistently
10. **Export & Register** - Update index files and register routes

### Quick Start for AI Agents

```
Task: "Create a School module"

1. Read: Database/ping_parent_dbdiagram.dbml (schools table)
2. Create: types/school.type.ts (fields match DB schema)
3. Update: constants/collections.ts, messages.ts
4. Create: validations/school.validation.ts (Joi schemas)
5. Create: repositories/school.repository.ts (extends BaseRepository)
6. Create: services/school.service.ts (business logic)
7. Create: controllers/school.controller.ts (use asyncHandler)
8. Create: routes/school.routes.ts (apply middlewares)
9. Update: routes/index.ts (register routes)
10. Verify: All patterns match auth module
```

### Key Resources

- **Database Schema**: `Database/ping_parent_dbdiagram.dbml`
- **Reference Implementation**: `src/routes/auth.routes.ts` and related auth files
- **Constants Directory**: `src/constants/`
- **Base Repository**: `src/repositories/base.repository.ts`
- **Middleware Examples**: `src/middlewares/`
- **Type Definitions**: `src/types/`

### Support

For questions or clarifications:
1. Refer to existing auth module implementation
2. Check database schema for field names and types
3. Review constants for message templates
4. Follow the patterns documented in this file

---

**Last Updated**: This document should be reviewed and updated whenever:
- New architectural patterns are introduced
- Naming conventions change
- New layers or folders are added
- Best practices evolve

**Document Version**: 1.0
