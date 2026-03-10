import { WithId } from "mongodb";
import { ObjectId } from "mongodb";

import { getDB } from "@shared/config";
import {
  AssignmentSource,
  AssignmentStatus,
  DRIVERS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  STUDENTS_COLLECTION,
  USERS_COLLECTION,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { driverStudentAssignmentRepository } from "../driver_student_assignment/driver_student_assignment.repository";
import { DriverStudentAssignment } from "../driver_student_assignment/driver_student_assignment.type";
import { CreateSchoolAssignmentBody } from "./school_assignment.type";

/**
 * Internal helper: fetch assignments with driver/student/parent joins
 */
const getAssignmentsWithJoins = async (
  filter: Record<string, unknown>,
): Promise<Record<string, unknown>[]> => {
  const db = await getDB();
  return await db
    .collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION)
    .aggregate([
      { $match: filter },
      {
        $addFields: {
          driver_obj_id: { $toObjectId: "$driver_id" },
          student_obj_id: { $toObjectId: "$student_id" },
        },
      },
      {
        $lookup: {
          from: DRIVERS_COLLECTION,
          localField: "driver_obj_id",
          foreignField: "_id",
          as: "driver_doc",
        },
      },
      { $unwind: { path: "$driver_doc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          driver_user_obj_id: {
            $cond: [
              { $ne: ["$driver_doc.user_id", null] },
              { $toObjectId: "$driver_doc.user_id" },
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
          localField: "student_obj_id",
          foreignField: "_id",
          as: "student_doc",
        },
      },
      { $unwind: { path: "$student_doc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          parent_obj_id: {
            $cond: [
              { $ne: ["$student_doc.parent_id", null] },
              { $toObjectId: "$student_doc.parent_id" },
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
          as: "parent_doc",
        },
      },
      { $unwind: { path: "$parent_doc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          driver: {
            $cond: {
              if: { $ne: ["$driver_doc._id", null] },
              then: {
                driver_id: { $toString: "$driver_doc._id" },
                name: "$driver_doc.name",
                driver_unique_id: "$driver_doc.driver_unique_id",
                vehicle_type: "$driver_doc.vehicle_type",
                vehicle_number: "$driver_doc.vehicle_number",
                phone_number: "$driver_user.phone_number",
              },
              else: null,
            },
          },
          student: {
            $cond: {
              if: { $ne: ["$student_doc._id", null] },
              then: {
                student_id: { $toString: "$student_doc._id" },
                student_name: "$student_doc.student_name",
                class: "$student_doc.class",
                section: "$student_doc.section",
              },
              else: null,
            },
          },
          parent_name: "$parent_doc.name",
        },
      },
      {
        $project: {
          driver_obj_id: 0,
          student_obj_id: 0,
          driver_user_obj_id: 0,
          parent_obj_id: 0,
          driver_doc: 0,
          driver_user: 0,
          student_doc: 0,
          parent_doc: 0,
        },
      },
    ])
    .toArray();
};

/**
 * Get all assignments for a school
 */
export const getAssignmentsBySchool = async (
  schoolId: string,
): Promise<Record<string, unknown>[]> => {
  return await getAssignmentsWithJoins({ school_id: schoolId });
};

/**
 * Get pending assignments for a school
 */
export const getPendingAssignmentsBySchool = async (
  schoolId: string,
): Promise<Record<string, unknown>[]> => {
  return await getAssignmentsWithJoins({
    school_id: schoolId,
    assignment_status: AssignmentStatus.PENDING,
  });
};

/**
 * Get assignments for a specific driver within a school
 */
export const getDriverAssignmentsBySchool = async (
  schoolId: string,
  driverId: string,
): Promise<Record<string, unknown>[]> => {
  return await getAssignmentsWithJoins({
    school_id: schoolId,
    driver_id: driverId,
  });
};

/**
 * Approve a school assignment (school admin flow — no driver ownership check)
 */
export const approveSchoolAssignment = async (
  assignmentId: string,
  adminId: string,
): Promise<WithId<DriverStudentAssignment> | null> => {
  const assignment =
    await driverStudentAssignmentRepository.findById(assignmentId);
  if (!assignment) {
    return null;
  }

  if (
    assignment.assignment_status !== AssignmentStatus.PENDING &&
    assignment.assignment_status !== AssignmentStatus.PARENT_REQUESTED
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.CREATOR_CANNOT_APPROVE,
    );
  }

  return await driverStudentAssignmentRepository.updateById(assignmentId, {
    $set: {
      assignment_status: AssignmentStatus.ACTIVE,
      start_date: new Date(),
      approved_by: adminId,
      updated_at: new Date(),
    },
  });
};

/**
 * Reject a school assignment (school admin flow — no driver ownership check)
 */
export const rejectSchoolAssignment = async (
  assignmentId: string,
  rejectionReason?: string,
): Promise<WithId<DriverStudentAssignment> | null> => {
  const assignment =
    await driverStudentAssignmentRepository.findById(assignmentId);
  if (!assignment) {
    return null;
  }

  if (
    assignment.assignment_status !== AssignmentStatus.PENDING &&
    assignment.assignment_status !== AssignmentStatus.PARENT_REQUESTED
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.CANNOT_REJECT,
    );
  }

  return await driverStudentAssignmentRepository.updateById(assignmentId, {
    $set: {
      assignment_status: AssignmentStatus.REJECTED,
      rejection_reason: rejectionReason,
      updated_at: new Date(),
    },
  });
};

/**
 * Create a school-based assignment (school admin assigning driver to student)
 */
export const createSchoolAssignment = async (
  schoolId: string,
  adminId: string,
  data: CreateSchoolAssignmentBody,
): Promise<WithId<DriverStudentAssignment>[]> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ _id: new ObjectId(data.driver_id) });

  if (!driver) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  const assignments: WithId<DriverStudentAssignment>[] = [];

  for (const studentId of data.student_ids) {
    const duplicate =
      await driverStudentAssignmentRepository.findDuplicateAssignment(
        data.driver_id,
        studentId,
      );

    if (duplicate) {
      continue;
    }

    const assignment = await driverStudentAssignmentRepository.create({
      driver_id: data.driver_id,
      student_id: studentId,
      school_id: schoolId,
      monthly_fee: data.monthly_fee,
      assignment_status: AssignmentStatus.ACTIVE,
      assigned_date: new Date(data.start_date || Date.now()),
      start_date: new Date(data.start_date || Date.now()),
      assigned_by: adminId,
      assignment_source: AssignmentSource.SCHOOL_ADMIN,
      created_at: new Date(),
      updated_at: new Date(),
    });

    assignments.push(assignment);
  }

  return assignments;
};
