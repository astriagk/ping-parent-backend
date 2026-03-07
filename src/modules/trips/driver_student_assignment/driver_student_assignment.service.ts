import { WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  AssignmentStatus,
  DRIVERS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  USERS_COLLECTION,
  UserRole,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { driverStudentAssignmentRepository } from "./driver_student_assignment.repository";
import { DriverStudentAssignment } from "./driver_student_assignment.type";

/**
 * Helper function to convert userId to driver_id
 * This is needed because the assignment table stores driver_id (from drivers table._id)
 * but the authenticated user has user_id (from users table)
 */
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

/**
 * Helper function to get driver by driver_unique_id
 */
const getDriverByUniqueId = async (
  driverUniqueId: string,
): Promise<Record<string, unknown> | null> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ driver_unique_id: driverUniqueId });

  return driver;
};

type CreateAssignmentData = Omit<
  DriverStudentAssignment,
  "driver_id" | "created_at" | "assignment_status"
>;

/**
 * Create assignment - Used by drivers to add students OR parents to request assignment
 */
export const createDriverStudentAssignment = async (
  userId: string,
  userRole: UserRole.PARENT | UserRole.DRIVER,
  data: CreateAssignmentData,
): Promise<WithId<DriverStudentAssignment>> => {
  let driverId: string | null = null;
  let assignmentStatus: AssignmentStatus;

  if (userRole === UserRole.DRIVER) {
    // Driver creating assignment - convert userId to driver_id
    driverId = await getDriverIdByUserId(userId);

    if (!driverId) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    assignmentStatus = AssignmentStatus.PENDING;
  } else {
    // Parent requesting assignment - find driver by driver_unique_id
    const driver = await getDriverByUniqueId(data.driver_unique_id);

    if (!driver) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_NOT_FOUND,
      );
    }

    driverId = String(driver._id);
    assignmentStatus = AssignmentStatus.PARENT_REQUESTED;
  }

  // Check for duplicate assignment
  const duplicate =
    await driverStudentAssignmentRepository.findDuplicateAssignment(
      driverId,
      data.student_id,
    );

  if (duplicate) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.ALREADY_EXISTS,
    );
  }

  // Validate date range if both start_date and end_date are provided
  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) <= new Date(data.start_date)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.INVALID_DATE_RANGE,
      );
    }
  }

  const assignmentData: DriverStudentAssignment = {
    driver_id: driverId,
    ...data,
    assignment_status: assignmentStatus,
    assigned_date: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await driverStudentAssignmentRepository.create(assignmentData);
};

/**
 * Get assignment by ID
 */
export const getAssignmentById = async (
  id: string,
): Promise<WithId<DriverStudentAssignment> | null> => {
  console.log(id);
  return await driverStudentAssignmentRepository.findById(id);
};

/**
 * Get all assignments across the system (admin only)
 */
/**
 * Get all assignments (admin) — with driver, student, parent and school details joined
 */
export const getAllAssignments = async (): Promise<
  Record<string, unknown>[]
> => {
  const db = await getDB();
  return await db
    .collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION)
    .aggregate([
      {
        $lookup: {
          from: DRIVERS_COLLECTION,
          localField: "driver_unique_id",
          foreignField: "driver_unique_id",
          as: "driver",
        },
      },
      { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          driver_user_obj_id: {
            $cond: [
              { $ne: ["$driver.user_id", null] },
              { $toObjectId: "$driver.user_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: USERS_COLLECTION,
          localField: "driver_user_obj_id",
          foreignField: "_id",
          as: "driver_user",
        },
      },
      { $unwind: { path: "$driver_user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: STUDENTS_COLLECTION,
          let: { studentId: { $toObjectId: "$student_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
          as: "student",
        },
      },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          parent_obj_id: {
            $cond: [
              { $ne: ["$student.parent_id", null] },
              { $toObjectId: "$student.parent_id" },
              null,
            ],
          },
          school_obj_id: {
            $cond: [
              { $ne: ["$student.school_id", null] },
              { $toObjectId: "$student.school_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: PARENTS_COLLECTION,
          localField: "parent_obj_id",
          foreignField: "_id",
          as: "parent",
        },
      },
      { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: SCHOOLS_COLLECTION,
          localField: "school_obj_id",
          foreignField: "_id",
          as: "school",
        },
      },
      { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          driver_user_obj_id: 0,
          parent_obj_id: 0,
          school_obj_id: 0,
        },
      },
      {
        $addFields: {
          driver: {
            $cond: {
              if: { $ne: ["$driver", null] },
              then: {
                driver_id: { $toString: "$driver._id" },
                name: "$driver.name",
                driver_unique_id: "$driver.driver_unique_id",
                vehicle_type: "$driver.vehicle_type",
                vehicle_number: "$driver.vehicle_number",
                phone_number: "$driver_user.phone_number",
              },
              else: null,
            },
          },
          student: {
            $cond: {
              if: { $ne: ["$student", null] },
              then: {
                student_id: { $toString: "$student._id" },
                student_name: "$student.student_name",
                class: "$student.class",
                section: "$student.section",
              },
              else: null,
            },
          },
          parent_name: "$parent.name",
          school_name: "$school.school_name",
        },
      },
      { $project: { driver_user: 0, parent: 0, school: 0 } },
    ])
    .toArray();
};

/**
 * Get all assignments for a driver (by userId)
 */
export const getAssignmentsByDriverUserId = async (
  userId: string,
): Promise<WithId<DriverStudentAssignment>[]> => {
  const driverId = await getDriverIdByUserId(userId);

  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  return await driverStudentAssignmentRepository.findByDriverId(driverId);
};

/**
 * Get active assignments for a driver (by userId)
 */
export const getActiveAssignmentsByDriverUserId = async (
  userId: string,
): Promise<WithId<DriverStudentAssignment>[]> => {
  const driverId = await getDriverIdByUserId(userId);

  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  return await driverStudentAssignmentRepository.findActiveAssignmentsByDriverId(
    driverId,
  );
};

/**
 * Get pending assignments for a driver (by userId)
 */
export const getPendingAssignmentsByDriverUserId = async (
  userId: string,
): Promise<WithId<DriverStudentAssignment>[]> => {
  const driverId = await getDriverIdByUserId(userId);

  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  return await driverStudentAssignmentRepository.findPendingAssignmentsByDriverId(
    driverId,
  );
};

/**
 * Get assignments by student ID
 */
export const getAssignmentsByStudentId = async (
  studentId: string,
): Promise<WithId<DriverStudentAssignment>[]> => {
  return await driverStudentAssignmentRepository.findByStudentId(studentId);
};

/**
 * Update assignment
 */
export const updateAssignment = async (
  id: string,
  updates: Partial<DriverStudentAssignment>,
): Promise<WithId<DriverStudentAssignment> | null> => {
  const currentAssignment =
    await driverStudentAssignmentRepository.findById(id);

  if (!currentAssignment) {
    return null;
  }

  // Validate date range if updating dates
  if (updates.start_date || updates.end_date) {
    const startDate = updates.start_date || currentAssignment.start_date;
    const endDate = updates.end_date || currentAssignment.end_date;

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.INVALID_DATE_RANGE,
      );
    }
  }

  return await driverStudentAssignmentRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

/**
 * Approve assignment (driver approving parent request)
 */
export const approveAssignment = async (
  id: string,
  userId: string,
): Promise<WithId<DriverStudentAssignment> | null> => {
  const assignment = await driverStudentAssignmentRepository.findById(id);
  if (!assignment) {
    return null;
  }

  // Only parent_requested assignments can be approved
  if (assignment.assignment_status !== AssignmentStatus.PARENT_REQUESTED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.CREATOR_CANNOT_APPROVE,
    );
  }

  // Verify the driver owns this assignment
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId || assignment.driver_id !== driverId) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.COMMON.FORBIDDEN);
  }

  return await driverStudentAssignmentRepository.updateById(id, {
    $set: {
      assignment_status: AssignmentStatus.ACTIVE,
      start_date: new Date(),
      updated_at: new Date(),
    },
  });
};

/**
 * Reject assignment (driver rejecting parent request or pending assignment)
 */
export const rejectAssignment = async (
  id: string,
  userId: string,
): Promise<WithId<DriverStudentAssignment> | null> => {
  const assignment = await driverStudentAssignmentRepository.findById(id);
  if (!assignment) {
    return null;
  }

  // Only pending or parent_requested assignments can be rejected
  if (
    assignment.assignment_status !== AssignmentStatus.PENDING &&
    assignment.assignment_status !== AssignmentStatus.PARENT_REQUESTED
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.CANNOT_REJECT,
    );
  }

  // Verify the driver owns this assignment
  const driverId = await getDriverIdByUserId(userId);
  if (!driverId || assignment.driver_id !== driverId) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.COMMON.FORBIDDEN);
  }

  return await driverStudentAssignmentRepository.updateById(id, {
    $set: {
      assignment_status: AssignmentStatus.REJECTED,
      updated_at: new Date(),
    },
  });
};

/**
 * Deactivate assignment
 */
export const deactivateAssignment = async (
  id: string,
): Promise<WithId<DriverStudentAssignment> | null> => {
  const assignment = await driverStudentAssignmentRepository.findById(id);
  if (!assignment) {
    return null;
  }

  return await driverStudentAssignmentRepository.updateById(id, {
    $set: {
      assignment_status: AssignmentStatus.INACTIVE,
      end_date: new Date(),
      updated_at: new Date(),
    },
  });
};

/**
 * Delete assignment (soft delete by setting to inactive)
 */
export const deleteAssignment = async (id: string): Promise<boolean> => {
  const result = await driverStudentAssignmentRepository.updateById(id, {
    $set: {
      assignment_status: AssignmentStatus.INACTIVE,
      end_date: new Date(),
      updated_at: new Date(),
    },
  });
  return result !== null;
};

/**
 * Get all parent-requested assignments with driver, student, and parent address details
 */
export const getParentRequestedAssignments = async (
  assignmentStatus?: string,
): Promise<Array<Record<string, unknown>>> => {
  const db = await getDB();
  const matchStage: Record<string, unknown> = {};

  if (assignmentStatus) {
    matchStage.assignment_status = assignmentStatus;
  }

  const assignments = await db
    .collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION)
    .aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: DRIVERS_COLLECTION,
          localField: "driver_unique_id",
          foreignField: "driver_unique_id",
          as: "driver",
        },
      },
      {
        $unwind: {
          path: "$driver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: STUDENTS_COLLECTION,
          let: { studentId: { $toObjectId: "$student_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          school_object_id: {
            $cond: [
              { $ne: ["$student.school_id", null] },
              { $toObjectId: "$student.school_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: SCHOOLS_COLLECTION,
          localField: "school_object_id",
          foreignField: "_id",
          as: "school",
        },
      },
      {
        $unwind: {
          path: "$school",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          pickup_address_object_id: {
            $cond: [
              { $ne: ["$student.pickup_address_id", null] },
              { $toObjectId: "$student.pickup_address_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: PARENT_ADDRESSES_COLLECTION,
          localField: "pickup_address_object_id",
          foreignField: "_id",
          as: "parent_address",
        },
      },
      {
        $unwind: {
          path: "$parent_address",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          school_object_id: 0,
          pickup_address_object_id: 0,
        },
      },
    ])
    .toArray();

  return assignments;
};

/**
 * Get parent-requested assignments for a specific driver with student and parent address details
 */
export const getParentRequestedAssignmentsByDriver = async (
  userId: string,
  assignmentStatus?: string,
): Promise<Array<Record<string, unknown>>> => {
  // Convert userId to driver_id
  const driverId = await getDriverIdByUserId(userId);

  if (!driverId) {
    return [];
  }

  const db = await getDB();
  const matchStage: Record<string, unknown> = {
    driver_id: driverId,
  };

  if (assignmentStatus) {
    matchStage.assignment_status = assignmentStatus;
  }

  const assignments = await db
    .collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION)
    .aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: DRIVERS_COLLECTION,
          localField: "driver_unique_id",
          foreignField: "driver_unique_id",
          as: "driver",
        },
      },
      {
        $unwind: {
          path: "$driver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: STUDENTS_COLLECTION,
          let: { studentId: { $toObjectId: "$student_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          school_object_id: {
            $cond: [
              { $ne: ["$student.school_id", null] },
              { $toObjectId: "$student.school_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: SCHOOLS_COLLECTION,
          localField: "school_object_id",
          foreignField: "_id",
          as: "school",
        },
      },
      {
        $unwind: {
          path: "$school",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          pickup_address_object_id: {
            $cond: [
              { $ne: ["$student.pickup_address_id", null] },
              { $toObjectId: "$student.pickup_address_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: PARENT_ADDRESSES_COLLECTION,
          localField: "pickup_address_object_id",
          foreignField: "_id",
          as: "parent_address",
        },
      },
      {
        $unwind: {
          path: "$parent_address",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          school_object_id: 0,
          pickup_address_object_id: 0,
        },
      },
    ])
    .toArray();

  return assignments;
};
