import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  approveSchoolAssignment as approveService,
  createSchoolAssignment as createService,
  getAssignmentsBySchool,
  getDriverAssignmentsBySchool,
  getPendingAssignmentsBySchool,
  reassignSchoolAssignment as reassignService,
  rejectSchoolAssignment as rejectService,
  removeSchoolAssignment as removeService,
} from "./school_assignment.service";

/**
 * Get all assignments for a school (school admin)
 * @route GET /api/v1/admin/school-assignments/:schoolId
 */
export const getSchoolAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    const assignments = await getAssignmentsBySchool(schoolId);

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
 * @route GET /api/v1/admin/school-assignments/:schoolId/pending
 */
export const getSchoolPendingAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    const assignments = await getPendingAssignmentsBySchool(schoolId);

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
 * @route POST /api/v1/admin/school-assignments/:assignmentId/approve
 */
export const approveSchoolAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params as Record<string, string>;
    const adminId = req.admin?.adminId;

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const assignment = await approveService(assignmentId, adminId);

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
 * @route POST /api/v1/admin/school-assignments/:assignmentId/reject
 */
export const rejectSchoolAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params as Record<string, string>;
    const { rejection_reason } = req.body;

    const assignment = await rejectService(assignmentId, rejection_reason);

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
 * @route GET /api/v1/admin/school-assignments/:schoolId/driver/:driverId
 */
export const getSchoolDriverAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId, driverId } = req.params as Record<string, string>;

    const assignments = await getDriverAssignmentsBySchool(schoolId, driverId);

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
 * @route POST /api/v1/admin/school-assignments/:schoolId/create
 */
export const createSchoolAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;
    const adminId = req.admin?.adminId;

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const assignments = await createService(schoolId, adminId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: assignments,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.CREATED_SUCCESSFULLY,
    });
  },
);

/**
 * Remove school assignment (soft-delete)
 * @route POST /api/v1/admin/school-assignments/:assignmentId/remove
 */
export const removeSchoolAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params as Record<string, string>;

    const assignment = await removeService(assignmentId);

    if (!assignment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: assignment,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DEACTIVATED_SUCCESSFULLY,
    });
  },
);

/**
 * Reassign driver for school assignment
 * @route POST /api/v1/admin/school-assignments/:assignmentId/reassign
 */
export const reassignSchoolAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params as Record<string, string>;
    const adminId = req.admin?.adminId;

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const result = await reassignService(assignmentId, adminId, req.body);

    return res.json({
      success: true,
      data: result,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.REASSIGNED_SUCCESSFULLY,
    });
  },
);
