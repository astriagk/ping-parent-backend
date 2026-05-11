import { ObjectId, WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  AssignmentStatus,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { studentRepository } from "./student.repository";
import {
  AdminBulkStudentResult,
  AdminStudentInput,
  Student,
} from "./student.type";

/**
 * Get parent_id from user_id
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

/**
 * Create student using user_id (converts user_id to parent_id internally)
 */
export const createStudent = async (
  userId: string,
  data: Omit<Student, "parent_id" | "created_at" | "is_active">,
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
    parent_id: parentId,
    ...data,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await studentRepository.create(studentData);
};

export const getStudentsBySchoolId = async (
  schoolId: string,
): Promise<any[]> => {
  return await studentRepository.findBySchoolIdWithDetails(schoolId);
};

export const getStudentById = async (id: string): Promise<any | null> => {
  return await studentRepository.findByIdWithPopulate(id);
};

export const getStudentByStudentId = async (
  studentId: string,
): Promise<WithId<Student> | null> => {
  return await studentRepository.findById(studentId);
};

export const updateStudent = async (
  id: string,
  updates: Partial<Student>,
): Promise<WithId<Student> | null> => {
  // Get current student
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

export const updateStudentByStudentId = async (
  studentId: string,
  updates: Partial<Student>,
): Promise<WithId<Student> | null> => {
  // Get current student (now using _id)
  const currentStudent = await studentRepository.findById(studentId);

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
    if (duplicate && String(duplicate._id) !== studentId) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.STUDENT.ALREADY_EXISTS,
      );
    }
  }

  return await studentRepository.updateById(studentId, {
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

export const deleteStudentByStudentId = async (
  studentId: string,
): Promise<boolean> => {
  // Soft delete - set is_active to false (now using _id)
  const result = await studentRepository.updateById(studentId, {
    $set: { is_active: false, updated_at: new Date() },
  });
  return result !== null;
};

/**
 * Get students by user_id (converts user_id to parent_id internally)
 */
export const getStudentsByUserId = async (userId: string): Promise<any[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await studentRepository.findByParentIdWithPopulate(parentId);
};

/**
 * Get active students by user_id (converts user_id to parent_id internally)
 */
export const getActiveStudentsByUserId = async (
  userId: string,
): Promise<any[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await studentRepository.findActiveStudentsByParentIdWithPopulate(
    parentId,
  );
};

const assertPickupAddressOwnership = async (
  pickupAddressId: string,
  parentId: string,
): Promise<void> => {
  if (!ObjectId.isValid(pickupAddressId)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.STUDENT.PICKUP_ADDRESS_ID_REQUIRED,
    );
  }

  const db = await getDB();
  const address = await db
    .collection(PARENT_ADDRESSES_COLLECTION)
    .findOne({ _id: new ObjectId(pickupAddressId) });

  if (!address || String(address.parent_id) !== parentId) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "pickup_address_id does not belong to this parent",
    );
  }
};

export const adminGetStudentsByParentId = async (
  parentId: string,
): Promise<any[]> => {
  if (!ObjectId.isValid(parentId)) {
    return [];
  }
  return await studentRepository.findByParentIdWithPopulate(parentId);
};

export const adminCreateStudentForParent = async (
  parentId: string,
  data: AdminStudentInput,
): Promise<WithId<Student>> => {
  if (!ObjectId.isValid(parentId)) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  const db = await getDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ _id: new ObjectId(parentId) });
  if (!parent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  await assertPickupAddressOwnership(data.pickup_address_id, parentId);

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
    parent_id: parentId,
    ...data,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await studentRepository.create(studentData);
};

export const adminBulkCreateStudentsForParent = async (
  parentId: string,
  students: AdminStudentInput[],
): Promise<{
  results: AdminBulkStudentResult[];
  created: number;
  skipped: number;
}> => {
  const results: AdminBulkStudentResult[] = [];
  let created = 0;
  let skipped = 0;

  if (!ObjectId.isValid(parentId)) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  for (const item of students) {
    try {
      const student = await adminCreateStudentForParent(parentId, item);
      results.push({
        student_name: item.student_name,
        status: "created",
        student_id: String(student._id),
      });
      created++;
    } catch (err: any) {
      results.push({
        student_name: item.student_name,
        status: "skipped",
        reason: err?.message || "create failed",
      });
      skipped++;
    }
  }

  return { results, created, skipped };
};

export const adminUpdateStudent = async (
  studentId: string,
  updates: Partial<Student>,
): Promise<WithId<Student> | null> => {
  if (!ObjectId.isValid(studentId)) {
    return null;
  }

  const current = await studentRepository.findById(studentId);
  if (!current) {
    return null;
  }

  if (
    updates.pickup_address_id &&
    updates.pickup_address_id !== current.pickup_address_id
  ) {
    await assertPickupAddressOwnership(
      updates.pickup_address_id,
      current.parent_id,
    );
  }

  if (
    updates.student_name ||
    updates.school_id ||
    updates.class ||
    updates.parent_id
  ) {
    const duplicate = await studentRepository.findDuplicateStudent(
      updates.parent_id || current.parent_id,
      updates.student_name || current.student_name,
      updates.school_id || current.school_id,
      updates.class || current.class,
    );
    if (duplicate && String(duplicate._id) !== studentId) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.STUDENT.ALREADY_EXISTS,
      );
    }
  }

  if (updates.school_id && updates.school_id !== current.school_id) {
    const db = await getDB();
    const now = new Date();
    await db.collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION).updateMany(
      {
        student_id: studentId,
        assignment_status: {
          $in: [
            AssignmentStatus.ACTIVE,
            AssignmentStatus.PENDING,
            AssignmentStatus.PARENT_REQUESTED,
          ],
        },
      },
      {
        $set: {
          assignment_status: AssignmentStatus.INACTIVE,
          end_date: now,
          updated_at: now,
        },
      },
    );
  }

  return await studentRepository.updateById(studentId, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const adminSoftDeleteStudent = async (
  studentId: string,
): Promise<boolean> => {
  if (!ObjectId.isValid(studentId)) {
    return false;
  }

  const current = await studentRepository.findById(studentId);
  if (!current) {
    return false;
  }

  const now = new Date();
  await studentRepository.updateById(studentId, {
    $set: { is_active: false, updated_at: now },
  });

  const db = await getDB();
  await db.collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION).updateMany(
    {
      student_id: studentId,
      assignment_status: {
        $in: [
          AssignmentStatus.ACTIVE,
          AssignmentStatus.PENDING,
          AssignmentStatus.PARENT_REQUESTED,
        ],
      },
    },
    {
      $set: {
        assignment_status: AssignmentStatus.INACTIVE,
        end_date: now,
        updated_at: now,
      },
    },
  );

  return true;
};
