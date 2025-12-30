# Implementation Examples - Ping Parent Backend

This document provides a complete, working example of implementing a new module in the Ping Parent backend. Use this example as a template when creating new features.

## Table of Contents

1. [Complete Student Module Example](#complete-student-module-example)
2. [User ID to Foreign Key Conversion (Detailed)](#user-id-to-foreign-key-conversion-detailed)
3. [Duplicate Checking Implementation](#duplicate-checking-implementation)

---

## Complete Student Module Example

This section demonstrates a complete implementation of the Student module, following all best practices and patterns.

### Database Schema

Based on `Database/ping_parent_dbdiagram.dbml`:

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

---

### 1. Add Enums (`constants/enums.ts`)

**IMPORTANT**: ALL enums must be defined in `constants/enums.ts`, NOT as type unions in type files.

```typescript
// constants/enums.ts

// ... existing enums

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}
```

---

### 2. Type Definition (`types/student.type.ts`)

```typescript
import { Gender } from "@constants";

// Import enum from constants

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
  gender?: Gender; // Use enum from constants/enums.ts
  pickup_address_id: string;
  emergency_contact?: string;
  medical_info?: string;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
```

---

### 3. Constants Updates

**Add to `constants/collections.ts`**:

```typescript
export const COLLECTIONS = {
  // ... existing collections
  STUDENTS: "students",
};

export const STUDENTS_COLLECTION = COLLECTIONS.STUDENTS;
```

**Add unique code prefix to `constants/enums.ts`** (if creating new entity):

```typescript
export enum UniqueCodeTypes {
  SCHOOL = "SCH",
  STUDENT = "STU",
  USER = "USR",
  // Add new entity prefix here
}
```

**Add to `constants/messages.ts`**:

```typescript
export const ERROR_MESSAGES = {
  // ... existing
  STUDENT: {
    NOT_FOUND: "Student not found",
    FAILED_TO_CREATE: "Failed to create student",
    FAILED_TO_UPDATE: "Failed to update student",
    NAME_REQUIRED: "Student name is required",
    PARENT_ID_REQUIRED: "Parent ID is required",
    SCHOOL_ID_REQUIRED: "School ID is required",
    ALREADY_EXISTS:
      "A student with the same name, school, and class already exists for this parent",
  },
};

export const SUCCESS_MESSAGES = {
  // ... existing
  STUDENT: {
    CREATED_SUCCESSFULLY: "Student created successfully",
    UPDATED_SUCCESSFULLY: "Student updated successfully",
    DELETED_SUCCESSFULLY: "Student deleted successfully",
    FETCHED_SUCCESSFULLY: "Student fetched successfully",
  },
};
```

**Validation messages are already present in `constants/validationMessages.ts`**:

```typescript
export const VALIDATION_MESSAGES = {
  // ... existing
  STUDENT: {
    NAME_REQUIRED: "Student name is required",
    NAME_MIN: "Student name must be at least 2 characters",
    NAME_MAX: "Student name cannot exceed 100 characters",
    PARENT_ID_REQUIRED: "Parent ID is required",
    SCHOOL_ID_REQUIRED: "School ID is required",
    CLASS_REQUIRED: "Class is required",
    CLASS_MAX: "Class cannot exceed 20 characters",
    SECTION_MAX: "Section cannot exceed 10 characters",
    ROLL_NUMBER_MAX: "Roll number cannot exceed 20 characters",
    PHOTO_URL_INVALID: "Photo URL must be a valid URL",
    DATE_OF_BIRTH_INVALID: "Date of birth must be a valid date",
    GENDER_INVALID: "Gender must be male, female, or other",
    PICKUP_ADDRESS_ID_REQUIRED: "Pickup address ID is required",
    EMERGENCY_CONTACT_PATTERN: "Emergency contact must be a valid phone number",
    MEDICAL_INFO_MAX: "Medical info cannot exceed 500 characters",
  },
};
```

---

### 4. Validation (`validations/student.validation.ts`)

**IMPORTANT**:
- Use `VALIDATION_MESSAGES` from constants for all validation error messages
- **Check database schema notes** - exclude fields marked as "calculated", "derived", or "optimized" from validation schemas

```typescript
import Joi from "joi";

import { VALIDATION_MESSAGES } from "@constants";
import { Gender } from "@constants";

export const createStudentSchema = Joi.object({
  // NOTE: parent_id is NOT included - it's derived from authenticated user
  school_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.SCHOOL_ID_REQUIRED,
  }),
  student_name: Joi.string().min(2).max(100).required().messages({
    "string.min": VALIDATION_MESSAGES.STUDENT.NAME_MIN,
    "string.max": VALIDATION_MESSAGES.STUDENT.NAME_MAX,
    "any.required": VALIDATION_MESSAGES.STUDENT.NAME_REQUIRED,
  }),
  class: Joi.string().max(20).required().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.CLASS_MAX,
    "any.required": VALIDATION_MESSAGES.STUDENT.CLASS_REQUIRED,
  }),
  section: Joi.string().max(10).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.SECTION_MAX,
  }),
  roll_number: Joi.string().max(20).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.ROLL_NUMBER_MAX,
  }),
  date_of_birth: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.STUDENT.DATE_OF_BIRTH_INVALID,
  }),
  gender: Joi.string()
    .valid(...Object.values(Gender)) // Use enum values
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.STUDENT.GENDER_INVALID,
    }),
  pickup_address_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.PICKUP_ADDRESS_ID_REQUIRED,
  }),
  emergency_contact: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base":
        VALIDATION_MESSAGES.STUDENT.EMERGENCY_CONTACT_PATTERN,
    }),
  medical_info: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.MEDICAL_INFO_MAX,
  }),
  photo_url: Joi.string().uri().optional().messages({
    "string.uri": VALIDATION_MESSAGES.STUDENT.PHOTO_URL_INVALID,
  }),
});

export const updateStudentSchema = Joi.object({
  student_name: Joi.string().min(2).max(100).optional().messages({
    "string.min": VALIDATION_MESSAGES.STUDENT.NAME_MIN,
    "string.max": VALIDATION_MESSAGES.STUDENT.NAME_MAX,
  }),
  class: Joi.string().max(20).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.CLASS_MAX,
  }),
  section: Joi.string().max(10).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.SECTION_MAX,
  }),
  roll_number: Joi.string().max(20).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.ROLL_NUMBER_MAX,
  }),
  date_of_birth: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.STUDENT.DATE_OF_BIRTH_INVALID,
  }),
  gender: Joi.string()
    .valid(...Object.values(Gender))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.STUDENT.GENDER_INVALID,
    }),
  pickup_address_id: Joi.string().optional(),
  emergency_contact: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      "string.pattern.base":
        VALIDATION_MESSAGES.STUDENT.EMERGENCY_CONTACT_PATTERN,
    }),
  medical_info: Joi.string().max(500).optional().messages({
    "string.max": VALIDATION_MESSAGES.STUDENT.MEDICAL_INFO_MAX,
  }),
  photo_url: Joi.string().uri().optional().messages({
    "string.uri": VALIDATION_MESSAGES.STUDENT.PHOTO_URL_INVALID,
  }),
});
```

---

### 5. Repository (`repositories/student.repository.ts`)

```typescript
import { WithId } from "mongodb";

import { STUDENTS_COLLECTION } from "@constants";
import { Student } from "@models/student.type";

import { BaseRepository } from "./base.repository";

export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super(STUDENTS_COLLECTION);
  }

  async findByParentId(parentId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ parent_id: parentId, is_active: true });
  }

  async findBySchoolId(schoolId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ school_id: schoolId, is_active: true });
  }

  async findActiveStudents(parentId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ parent_id: parentId, is_active: true });
  }

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
      is_active: true,
    });
  }
}

export const studentRepository = new StudentRepository();
```

---

### 6. Service (`services/student.service.ts`)

```typescript
import { WithId } from "mongodb";

import { getDB } from "@config";
import {
  AlphabetType,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  UniqueCodeTypes,
} from "@constants";
import { ApiError } from "@middlewares";
import { Student } from "@models/student.type";
import { studentRepository } from "@repositories/student.repository";
import { generateUniqueCode } from "@utils";

/**
 * Helper function to convert userId to parent_id
 * This is needed because the student table stores parent_id (from parents table)
 * but the authenticated user has user_id (from users table)
 */
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

  // Check for duplicate student
  const duplicate = await studentRepository.findDuplicateStudent(
    parentId,
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

  const studentData: Student = {
    student_id: generateUniqueCode(UniqueCodeTypes.STUDENT),
    parent_id: parentId,
    ...data,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await studentRepository.create(studentData);
};

export const getStudentById = async (
  id: string,
): Promise<WithId<Student> | null> => {
  return await studentRepository.findById(id);
};

export const getStudentsByUserId = async (
  userId: string,
): Promise<WithId<Student>[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await studentRepository.findByParentId(parentId);
};

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

---

### 7. Controller (`controllers/student.controller.ts`)

```typescript
import { Request, Response } from "express";

import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from "@constants";
import { ApiError, asyncHandler } from "@middlewares";
import {
  createStudent as createStudentService,
  deleteStudent,
  getStudentById,
  getStudentsByUserId,
  updateStudent,
} from "@services/student.service";

// NOTE: Exports WITHOUT "Controller" suffix
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

export const getStudentProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const student = await getStudentById(id);

    if (!student) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: student,
    });
  },
);

export const getMyStudents = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const students = await getStudentsByUserId(userId);

    return res.json({
      success: true,
      data: students,
    });
  },
);

export const updateStudentProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const student = await updateStudent(id, updates);

    if (!student) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.UPDATED_SUCCESSFULLY,
    });
  },
);

export const deleteStudentProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await deleteStudent(id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.STUDENT.DELETED_SUCCESSFULLY,
    });
  },
);
```

---

### 8. Routes (`routes/student.routes.ts`)

```typescript
import { Router } from "express";

import {
  createStudent,
  deleteStudentProfile,
  getMyStudents,
  getStudentProfile,
  updateStudentProfile,
} from "@controllers/student.controller";
import { validate, verifyParentToken } from "@middlewares";
import {
  createStudentSchema,
  updateStudentSchema,
} from "@validations/student.validation";

const router = Router();

// All routes require parent authentication
router.use(verifyParentToken);

// Student CRUD operations
router.post("/", validate(createStudentSchema), createStudent);
router.get("/my-students", getMyStudents);
router.get("/:id", getStudentProfile);
router.put("/:id", validate(updateStudentSchema), updateStudentProfile);
router.delete("/:id", deleteStudentProfile);

export default router;
```

---

### 9. Register Routes (`routes/index.ts`)

Add to existing routes/index.ts:

```typescript
import studentRoutes from "./student.routes";

// ... existing route registrations

router.use("/students", studentRoutes);
```

---

## User ID to Foreign Key Conversion (Detailed)

### Problem Statement

When a user authenticates, they receive a JWT with `userId` from the `users` table. However, child tables like `students` or `parent_addresses` reference `parent_id` or `driver_id`, which are MongoDB `_id` values from the `parents` or `drivers` tables.

### Database Relationship Chain

```
Authentication:
users.user_id (in JWT)

Profile Lookup:
users.user_id → parents.user_id → parents._id

Child Records:
students.parent_id = parents._id
parent_addresses.parent_id = parents._id
```

### Implementation Steps

**Step 1: Create Helper Function in Service Layer**

```typescript
// services/student.service.ts (or create a shared service)
import { getDB } from "@config";
import { DRIVERS_COLLECTION, PARENTS_COLLECTION } from "@constants";

/**
 * Convert authenticated userId to parent_id for child records
 * @param userId - The user_id from JWT token (users table)
 * @returns parent_id (MongoDB _id from parents table) or null
 */
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

// For drivers, create similar function
const getDriverIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ user_id: userId });

  if (!driver) {
    return null;
  }

  return String(driver._id);
};
```

**Step 2: Modify Service Functions to Accept userId**

```typescript
export const createStudent = async (
  userId: string, // Accept userId from controller
  data: Omit<Student, "student_id" | "parent_id" | "created_at" | "is_active">,
): Promise<WithId<Student>> => {
  // Convert userId to parent_id
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // Now use parent_id to create student
  const studentData: Student = {
    student_id: generateUniqueCode(UniqueCodeTypes.STUDENT),
    parent_id: parentId, // Converted from userId
    ...data,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await studentRepository.create(studentData);
};
```

**Step 3: Update Controllers to Pass userId**

```typescript
export const createStudent = asyncHandler(
  async (req: Request, res: Response) => {
    // Extract userId from authenticated request
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    // Request body does NOT contain parent_id
    const studentData = req.body;

    // Pass userId to service for conversion
    const student = await createStudentService(userId, studentData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.CREATED_SUCCESSFULLY,
    });
  },
);
```

**Step 4: Update Validation to Remove Foreign Key**

```typescript
// BEFORE (Wrong - accepting parent_id from client)
export const createStudentSchema = Joi.object({
  parent_id: Joi.string().required(), // ❌ Don't do this
  student_name: Joi.string().required(),
  // ...
});

// AFTER (Correct - parent_id derived from authenticated user)
export const createStudentSchema = Joi.object({
  // parent_id removed ✅
  student_name: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.NAME_REQUIRED,
  }),
  school_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.SCHOOL_ID_REQUIRED,
  }),
  class: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.STUDENT.CLASS_REQUIRED,
  }),
  // ...
});
```

### Benefits

1. **Security**: Users cannot create records for other parents
2. **Simplified Client**: No need to pass parent_id/driver_id
3. **Data Integrity**: Foreign keys are always correct
4. **Better UX**: Automatic association based on authentication

---

## Duplicate Checking Implementation

### When to Add Duplicate Checking

Implement duplicate checking when:

- Creating records that should be unique based on business logic
- Multiple fields together form a logical unique constraint
- Database doesn't enforce the uniqueness constraint

### Example: Student Duplicate Checking

**Business Rule**: A parent cannot have two students with the same name, school, and class.

**Step 1: Add Repository Method**

```typescript
// repositories/student.repository.ts
export class StudentRepository extends BaseRepository<Student> {
  // ...

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
}
```

**Step 2: Check in Create Service**

```typescript
// services/student.service.ts
export const createStudent = async (
  userId: string,
  data: Omit<Student, "student_id" | "parent_id" | "created_at" | "is_active">,
): Promise<WithId<Student>> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // ✅ Check for duplicate BEFORE creating
  const duplicate = await studentRepository.findDuplicateStudent(
    parentId,
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
  const studentData: Student = {
    student_id: generateUniqueCode(UniqueCodeTypes.STUDENT),
    parent_id: parentId,
    ...data,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await studentRepository.create(studentData);
};
```

**Step 3: Check in Update Service**

```typescript
// services/student.service.ts
export const updateStudent = async (
  id: string,
  updates: Partial<Student>,
): Promise<WithId<Student> | null> => {
  const currentStudent = await studentRepository.findById(id);

  if (!currentStudent) {
    return null;
  }

  // ✅ Only check if updating fields that affect uniqueness
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

    // ✅ Exclude the current student from duplicate check
    if (duplicate && duplicate._id.toString() !== id) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.STUDENT.ALREADY_EXISTS,
      );
    }
  }

  // Proceed with update...
  return await studentRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};
```

**Step 4: Add Error Message**

```typescript
// constants/messages.ts
export const ERROR_MESSAGES = {
  STUDENT: {
    ALREADY_EXISTS:
      "A student with the same name, school, and class already exists for this parent",
    // ...
  },
};
```

### Different Duplicate Patterns

**Pattern 1: Simple Field Uniqueness**

```typescript
// Example: School name must be unique
async findDuplicateSchool(schoolName: string): Promise<WithId<School> | null> {
  return await this.findOne({
    school_name: schoolName,
    is_active: true,
  });
}
```

**Pattern 2: Scoped Uniqueness**

```typescript
// Example: Address label must be unique per parent
async findDuplicateAddress(
  parentId: string,
  label: string,
): Promise<WithId<Address> | null> {
  return await this.findOne({
    parent_id: parentId,
    label: label,
    is_active: true,
  });
}
```

**Pattern 3: Composite Key Uniqueness**

```typescript
// Example: Driver-vehicle combination must be unique
async findDuplicateDriverVehicle(
  driverId: string,
  vehicleNumber: string,
): Promise<WithId<Vehicle> | null> {
  return await this.findOne({
    driver_id: driverId,
    vehicle_number: vehicleNumber,
    is_active: true,
  });
}
```

---

## Summary

This document demonstrates:

1. Complete module implementation following all patterns
2. **Proper handling of enums** - ALL enums defined in `constants/enums.ts`
3. **Proper validation messages** - ALL messages from `constants/validationMessages.ts`
4. User ID to foreign key conversion for security
5. Duplicate checking to prevent data integrity issues
6. Proper layered architecture (types → validation → repository → service → controller → routes)
7. Correct naming conventions and file placement

Use this example as a template when implementing new features in the Ping Parent backend.

---

**Related Documents**:

- [AI_CONTEXT.md](./AI_CONTEXT.md) - Core patterns and conventions
- [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md) - API documentation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common mistakes
