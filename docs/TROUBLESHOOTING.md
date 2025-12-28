# Troubleshooting Guide - Ping Parent Backend

This guide helps you identify and fix common mistakes when implementing features in the Ping Parent backend.

## Table of Contents

1. [Common Mistakes](#common-mistakes)
2. [Naming Convention Errors](#naming-convention-errors)
3. [File Placement Errors](#file-placement-errors)
4. [Type and Enum Errors](#type-and-enum-errors)
5. [Validation Errors](#validation-errors)
6. [Controller Errors](#controller-errors)
7. [Service Layer Errors](#service-layer-errors)
8. [Repository Errors](#repository-errors)
9. [Authentication Errors](#authentication-errors)
10. [Common Runtime Errors](#common-runtime-errors)

---

## Common Mistakes

### ❌ Mistake #1: Wrong Controller Export Names

**Problem**: Exporting controller functions WITH "Controller" suffix

```typescript
// ❌ WRONG
export const getAllSchoolsController = asyncHandler(async (req, res) => {
  // ...
});

export const createStudentController = asyncHandler(async (req, res) => {
  // ...
});
```

**Solution**: Export WITHOUT "Controller" suffix

```typescript
// ✅ CORRECT
export const getAllSchools = asyncHandler(async (req, res) => {
  // ...
});

export const createStudent = asyncHandler(async (req, res) => {
  // ...
});
```

**Why**: Keeps function names clean and consistent. The file name already indicates it's a controller.

---

### ❌ Mistake #2: Creating Feature Folders

**Problem**: Organizing code by feature instead of by layer

```
❌ WRONG:
src/
├── features/
│   └── school/
│       ├── school.controller.ts
│       ├── school.service.ts
│       └── school.routes.ts
```

**Solution**: Organize by layer, not by feature

```
✅ CORRECT:
src/
├── controllers/
│   └── school.controller.ts
├── services/
│   └── school.service.ts
└── routes/
    └── school.routes.ts
```

**Why**: Maintains clear separation of concerns and follows the project's layered architecture.

---

### ❌ Mistake #3: Hardcoding Strings

**Problem**: Using hardcoded strings instead of constants

```typescript
// ❌ WRONG
throw new Error("User not found");

return res.json({
  success: true,
  message: "Student created successfully",
});
```

**Solution**: Use constants from centralized files

```typescript
// ✅ CORRECT
throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.AUTH.USER_NOT_FOUND);

return res.json({
  success: true,
  message: SUCCESS_MESSAGES.STUDENT.CREATED_SUCCESSFULLY,
});
```

**Why**: Ensures consistency and makes it easier to update messages globally.

---

### ❌ Mistake #4: Wrong Field Naming Convention

**Problem**: Using camelCase for database fields

```typescript
// ❌ WRONG
interface User {
  userId: string;
  phoneNumber: string;
  createdAt: Date;
}
```

**Solution**: Use snake_case to match database schema

```typescript
// ✅ CORRECT
interface User {
  user_id: string;
  phone_number: string;
  created_at: Date;
}
```

**Why**: TypeScript interfaces must match MongoDB document field names exactly.

---

### ❌ Mistake #5: Wrong Middleware Order

**Problem**: Incorrect order of middlewares in routes

```typescript
// ❌ WRONG
router.post("/endpoint", controller, validate(schema), authMiddleware);
router.post("/endpoint", authMiddleware, controller, validate(schema));
```

**Solution**: Correct middleware order

```typescript
// ✅ CORRECT
router.post(
  "/endpoint",
  validate(schema),      // 1. Validation first
  authMiddleware,        // 2. Authentication second
  rateLimiter,          // 3. Rate limiting (if needed)
  controller,           // 4. Controller last
);
```

**Why**: Validation should fail fast before authentication. Authentication should happen before business logic.

---

### ❌ Mistake #6: Not Using BaseRepository

**Problem**: Direct MongoDB operations instead of using BaseRepository

```typescript
// ❌ WRONG
const collection = db.collection("schools");
const school = await collection.findOne({ _id: id });
```

**Solution**: Extend BaseRepository

```typescript
// ✅ CORRECT
export class SchoolRepository extends BaseRepository<School> {
  constructor() {
    super(SCHOOLS_COLLECTION);
  }

  async findByName(name: string): Promise<WithId<School> | null> {
    return await this.findOne({ school_name: name });
  }
}

export const schoolRepository = new SchoolRepository();
```

**Why**: BaseRepository provides type safety and consistent database operations.

---

### ❌ Mistake #7: Business Logic in Controllers

**Problem**: Putting business logic in controllers instead of services

```typescript
// ❌ WRONG
export const createSchool = asyncHandler(async (req, res) => {
  const school = {
    school_id: nanoid(),
    ...req.body,
    is_active: true,
    created_at: new Date(),
  };

  const result = await schoolRepository.create(school);

  return res.json({ success: true, data: result });
});
```

**Solution**: Move business logic to service layer

```typescript
// ✅ CORRECT - Controller
export const createSchool = asyncHandler(async (req, res) => {
  const school = await createSchoolService(req.body);

  return res.json({
    success: true,
    data: school,
    message: SUCCESS_MESSAGES.SCHOOL.CREATED_SUCCESSFULLY,
  });
});

// ✅ CORRECT - Service
export const createSchoolService = async (data: Omit<School, "school_id" | "created_at" | "is_active">) => {
  const schoolData: School = {
    school_id: nanoid(),
    ...data,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await schoolRepository.create(schoolData);
};
```

**Why**: Controllers should be thin and only handle HTTP concerns. Business logic belongs in services.

---

### ❌ Mistake #8: Forgetting to Register Routes

**Problem**: Created routes file but forgot to register in `routes/index.ts`

```typescript
// Created school.routes.ts but routes/index.ts remains unchanged
```

**Solution**: Always register new routes

```typescript
// ✅ CORRECT - routes/index.ts
import schoolRoutes from "./school.routes";

router.use("/schools", schoolRoutes);
```

**Why**: Routes won't be accessible unless registered in the main router.

---

## Naming Convention Errors

### Variables and Constants

```typescript
// ❌ WRONG
const STUDENT_Name = "John";           // Mixed case
const error-message = "Error";         // Hyphens
const SUCCESS_message = "Success";     // Inconsistent

// ✅ CORRECT
const studentName = "John";            // camelCase for variables
const ERROR_MESSAGE = "Error";         // SCREAMING_SNAKE_CASE for constants
const successMessage = "Success";      // camelCase for variables
```

### Functions

```typescript
// ❌ WRONG
function GetUserById() { }             // PascalCase
function get_user_by_id() { }          // snake_case

// ✅ CORRECT
function getUserById() { }             // camelCase
```

### Types and Interfaces

```typescript
// ❌ WRONG
interface student { }                  // lowercase
type userType = "parent" | "driver";   // camelCase

// ✅ CORRECT
interface Student { }                  // PascalCase
type UserType = "parent" | "driver";   // PascalCase
```

---

## File Placement Errors

### Checklist for File Placement

```
✅ DO:
- types/{entity}.type.ts
- validations/{entity}.validation.ts
- repositories/{entity}.repository.ts
- services/{entity}.service.ts
- controllers/{entity}.controller.ts
- routes/{entity}.routes.ts

❌ DON'T:
- features/{entity}/{entity}.type.ts
- src/{entity}/types.ts
- modules/{entity}/{entity}.controller.ts
```

---

## Type and Enum Errors

### ❌ Mistake: Enums as Type Unions

**Problem**: Defining enums as type unions in type files

```typescript
// ❌ WRONG - types/student.type.ts
export type Gender = "male" | "female" | "other";

export interface Student {
  gender?: Gender;
}
```

**Solution**: Define enums in `constants/enums.ts`

```typescript
// ✅ CORRECT - constants/enums.ts
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

// ✅ CORRECT - types/student.type.ts
import { Gender } from "@constants/enums";

export interface Student {
  gender?: Gender;
}
```

**Why**: Centralized enums in constants folder for consistency and reusability.

---

## Validation Errors

### ❌ Mistake: Hardcoded Validation Messages

**Problem**: Using hardcoded strings in validation schemas

```typescript
// ❌ WRONG
export const createStudentSchema = Joi.object({
  student_name: Joi.string().required().messages({
    "any.required": "Student name is required",
    "string.min": "Student name must be at least 2 characters",
  }),
});
```

**Solution**: Use VALIDATION_MESSAGES from constants

```typescript
// ✅ CORRECT
import { VALIDATION_MESSAGES } from "@constants";

export const createStudentSchema = Joi.object({
  student_name: Joi.string().min(2).required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.NAME_REQUIRED,
    "string.min": VALIDATION_MESSAGES.STUDENT.NAME_MIN,
  }),
});
```

**Why**: Centralized validation messages for consistency.

---

### ❌ Mistake: Accepting Foreign Keys in Request Body

**Problem**: Validating parent_id in create request

```typescript
// ❌ WRONG
export const createStudentSchema = Joi.object({
  parent_id: Joi.string().required(),  // Don't accept from client
  student_name: Joi.string().required(),
});
```

**Solution**: Derive parent_id from authenticated user

```typescript
// ✅ CORRECT
export const createStudentSchema = Joi.object({
  // parent_id removed - derived from authenticated user
  student_name: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.NAME_REQUIRED,
  }),
  school_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.SCHOOL_ID_REQUIRED,
  }),
});
```

**Why**: Security - prevents users from creating records for other parents.

---

## Controller Errors

### ❌ Mistake: Not Using asyncHandler

**Problem**: Not wrapping async controllers with asyncHandler

```typescript
// ❌ WRONG
export const getStudent = async (req: Request, res: Response) => {
  const student = await getStudentById(req.params.id);
  return res.json({ success: true, data: student });
};
```

**Solution**: Always use asyncHandler

```typescript
// ✅ CORRECT
export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await getStudentById(req.params.id);

  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.STUDENT.NOT_FOUND);
  }

  return res.json({ success: true, data: student });
});
```

**Why**: asyncHandler catches errors and passes them to error middleware.

---

### ❌ Mistake: Not Validating User Authentication

**Problem**: Not checking if user is authenticated

```typescript
// ❌ WRONG
export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;  // Might be undefined
  const student = await createStudentService(userId, req.body);  // Could fail
  // ...
});
```

**Solution**: Always validate authentication

```typescript
// ✅ CORRECT
export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
    );
  }

  const student = await createStudentService(userId, req.body);
  // ...
});
```

**Why**: Prevents errors when user is not authenticated.

---

## Service Layer Errors

### ❌ Mistake: Not Converting userId to Foreign Key

**Problem**: Using userId directly as parent_id

```typescript
// ❌ WRONG
export const createStudent = async (data: Student) => {
  const studentData = {
    student_id: nanoid(),
    parent_id: data.user_id,  // Wrong - user_id is not parent_id
    ...data,
  };
  return await studentRepository.create(studentData);
};
```

**Solution**: Convert userId to parent_id

```typescript
// ✅ CORRECT
const getParentIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const parent = await db.collection(PARENTS_COLLECTION).findOne({ user_id: userId });
  return parent ? String(parent._id) : null;
};

export const createStudent = async (userId: string, data: Omit<Student, "student_id" | "parent_id" | "created_at" | "is_active">) => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND);
  }

  const studentData: Student = {
    student_id: nanoid(),
    parent_id: parentId,  // Converted from userId
    ...data,
    is_active: true,
    created_at: new Date(),
  };

  return await studentRepository.create(studentData);
};
```

**Why**: user_id (from users table) ≠ parent_id (from parents table._id).

---

### ❌ Mistake: Not Implementing Duplicate Checking

**Problem**: Allowing duplicate records

```typescript
// ❌ WRONG
export const createStudent = async (data: Student) => {
  return await studentRepository.create(data);  // No duplicate check
};
```

**Solution**: Check for duplicates before creating

```typescript
// ✅ CORRECT
export const createStudent = async (userId: string, data: Omit<Student, "student_id" | "parent_id" | "created_at" | "is_active">) => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND);
  }

  // Check for duplicate
  const duplicate = await studentRepository.findDuplicateStudent(
    parentId,
    data.student_name,
    data.school_id,
    data.class,
  );

  if (duplicate) {
    throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.STUDENT.ALREADY_EXISTS);
  }

  // Proceed with creation
  const studentData: Student = {
    student_id: nanoid(),
    parent_id: parentId,
    ...data,
    is_active: true,
    created_at: new Date(),
  };

  return await studentRepository.create(studentData);
};
```

**Why**: Prevents duplicate data based on business logic.

---

## Repository Errors

### ❌ Mistake: Not Filtering by is_active

**Problem**: Returning soft-deleted records

```typescript
// ❌ WRONG
async findByParentId(parentId: string): Promise<WithId<Student>[]> {
  return await this.findMany({ parent_id: parentId });  // Includes deleted students
}
```

**Solution**: Filter by is_active

```typescript
// ✅ CORRECT
async findByParentId(parentId: string): Promise<WithId<Student>[]> {
  return await this.findMany({ parent_id: parentId, is_active: true });
}
```

**Why**: Soft-deleted records (is_active: false) should not be returned.

---

## Authentication Errors

### ❌ Mistake: Using Wrong Auth Middleware

**Problem**: Using generic middleware for role-specific routes

```typescript
// ❌ WRONG - Using generic middleware for parent-only route
router.get("/my-students", verifyToken_Middleware, getMyStudents);
```

**Solution**: Use role-specific middleware

```typescript
// ✅ CORRECT
router.get("/my-students", verifyParentToken, getMyStudents);
router.get("/my-trips", verifyDriverToken, getMyTrips);
```

**Why**: Role-specific middlewares enforce proper authorization.

---

## Common Runtime Errors

### Error: "Cannot find module '@constants'"

**Cause**: TypeScript path aliases not configured or not recognized

**Solution**:
1. Check `tsconfig.json` has correct path mappings
2. Restart TypeScript server in your IDE
3. Run `npm run build` to check for compilation errors

---

### Error: "Type 'ObjectId' is not assignable to type 'any'"

**Cause**: Using `_id?: ObjectId` instead of `_id?: any`

**Solution**:
```typescript
// ✅ CORRECT
interface Entity {
  _id?: any;  // MongoDB internal ID
  entity_id: string;
}
```

---

### Error: "ApiError is not a constructor"

**Cause**: Incorrect import of ApiError

**Solution**:
```typescript
// ❌ WRONG
import ApiError from "@middlewares";

// ✅ CORRECT
import { ApiError } from "@middlewares";
```

---

### Error: "Cannot read property 'userId' of undefined"

**Cause**: req.user is undefined (authentication middleware not applied)

**Solution**:
1. Ensure route has authentication middleware
2. Check middleware order
3. Validate token is being sent in Authorization header

---

## Debugging Tips

### 1. Check File Imports

```bash
# Verify all imports resolve correctly
npm run build
```

### 2. Validate Joi Schemas

```typescript
// Test validation schema
const { error, value } = schema.validate(testData);
console.log("Validation error:", error);
console.log("Validated value:", value);
```

### 3. Check Database Queries

```typescript
// Add logging to repository methods
async findByParentId(parentId: string): Promise<WithId<Student>[]> {
  console.log("Finding students for parent:", parentId);
  const result = await this.findMany({ parent_id: parentId, is_active: true });
  console.log("Found students:", result.length);
  return result;
}
```

### 4. Verify Middleware Execution

```typescript
// Add logging to middleware
router.use((req, res, next) => {
  console.log("Request:", req.method, req.path);
  console.log("User:", req.user);
  next();
});
```

---

## Quick Checklist

Before committing code, verify:

- [ ] All controller functions exported WITHOUT "Controller" suffix
- [ ] All files placed in correct layer folders (not feature folders)
- [ ] All strings use constants (no hardcoded messages)
- [ ] All database fields use snake_case
- [ ] All enums defined in `constants/enums.ts`
- [ ] All validation messages from `constants/validationMessages.ts`
- [ ] Middleware order: validate → auth → controller
- [ ] Business logic in services, not controllers
- [ ] Repository extends BaseRepository
- [ ] Routes registered in `routes/index.ts`
- [ ] Duplicate checking implemented for create/update
- [ ] userId converted to foreign key when needed
- [ ] Documentation updated (API_DOCUMENTATION.md, swagger.yaml)

---

## Related Documents

- [AI_CONTEXT.md](./AI_CONTEXT.md) - Core patterns and conventions
- [IMPLEMENTATION_EXAMPLES.md](./IMPLEMENTATION_EXAMPLES.md) - Complete implementation examples
- [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md) - API documentation guide

---

**Document Version**: 1.0
**Last Updated**: 2025
