import { Request, Response } from "express";

import {
  AssignmentSource,
  AssignmentStatus,
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import { driverStudentAssignmentRepository } from "../driver_student_assignment/driver_student_assignment.repository";
import {
  approveAssignment as approveAssignmentService,
  rejectAssignment as rejectAssignmentService,
} from "../driver_student_assignment/driver_student_assignment.service";

/**
 * Get all assignments for a school (school admin)
 * @route GET /api/v1/assignments/school/:schoolId
 */
export const getSchoolAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    if (!schoolId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.COMMON.VALIDATION_ERROR,
      );
    }

    const assignments = await driverStudentAssignmentRepository.findMany({
      school_id: schoolId,
    });

    return res.json({
      success: true,
      data: assignments,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get pending assignments for school (school admin)
 * @route GET /api/v1/assignments/school/:schoolId/pending
 */
export const getSchoolPendingAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    if (!schoolId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.COMMON.VALIDATION_ERROR,
      );
    }

    const assignments = await driverStudentAssignmentRepository.findMany({
      school_id: schoolId,
      assignment_status: AssignmentStatus.PENDING,
    });

    return res.json({
      success: true,
      data: assignments,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Approve school assignment (school admin)
 * @route POST /api/v1/assignments/school/:assignmentId/approve
 */
export const approveSchoolAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params as Record<string, string>;

    if (!assignmentId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_ID_REQUIRED,
      );
    }

    const adminId = req.user?.userId;
    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const assignment = await approveAssignmentService(assignmentId, adminId);

    if (!assignment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: assignment,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.APPROVED_SUCCESSFULLY,
    });
  },
);

/**
 * Reject school assignment (school admin)
 * @route POST /api/v1/assignments/school/:assignmentId/reject
 */
export const rejectSchoolAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params as Record<string, string>;
    const { rejection_reason } = req.body;

    if (!assignmentId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_ID_REQUIRED,
      );
    }

    const assignment = await rejectAssignmentService(
      assignmentId,
      rejection_reason,
    );

    if (!assignment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: assignment,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.REJECTED_SUCCESSFULLY,
    });
  },
);

/**
 * Get assignments by driver for school (school admin)
 * @route GET /api/v1/assignments/school/:schoolId/driver/:driverId
 */
export const getSchoolDriverAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId, driverId } = req.params as Record<string, string>;

    if (!schoolId || !driverId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_ID_REQUIRED,
      );
    }

    const assignments = await driverStudentAssignmentRepository.findMany({
      school_id: schoolId,
      driver_id: driverId,
    });

    return res.json({
      success: true,
      data: assignments,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Create school-based assignment (school admin assigning driver to student)
 * @route POST /api/v1/assignments/school/:schoolId/create
 */
export const createSchoolAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;
    const { driver_id, student_id, monthly_fee, start_date } = req.body;
    const adminId = req.user?.userId;

    if (!schoolId || !driver_id || !student_id) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DRIVER_ID_REQUIRED,
      );
    }

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const assignment = await driverStudentAssignmentRepository.create({
      driver_id,
      student_id,
      school_id: schoolId,
      driver_unique_id: "",
      monthly_fee,
      assignment_status: AssignmentStatus.ACTIVE,
      assigned_date: new Date(start_date || Date.now()),
      start_date: new Date(start_date || Date.now()),
      assigned_by: adminId,
      assignment_source: AssignmentSource.SCHOOL_ADMIN,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: assignment,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.CREATED_SUCCESSFULLY,
    });
  },
);
