import { WithId } from "mongodb";

import { studentRepository } from "@modules/users/student/student.repository";
import { Student } from "@modules/users/student/student.type";
import { getDB } from "@shared/config";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

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

export const getStudentByStudentId = async (
  studentId: string,
): Promise<WithId<Student> | null> => {
  return await studentRepository.findByStudentId(studentId);
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
  // Get current student
  const currentStudent = await studentRepository.findByStudentId(studentId);

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
    if (duplicate && duplicate.student_id !== studentId) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.STUDENT.ALREADY_EXISTS,
      );
    }
  }

  return await studentRepository.updateOne(
    { student_id: studentId },
    {
      $set: { ...updates, updated_at: new Date() },
    },
  );
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
  // Soft delete - set is_active to false
  const result = await studentRepository.updateOne(
    { student_id: studentId },
    {
      $set: { is_active: false, updated_at: new Date() },
    },
  );
  return result !== null;
};

/**
 * Get students by user_id (converts user_id to parent_id internally)
 */
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

/**
 * Get active students by user_id (converts user_id to parent_id internally)
 */
export const getActiveStudentsByUserId = async (
  userId: string,
): Promise<WithId<Student>[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await studentRepository.findActiveStudentsByParentId(parentId);
};
