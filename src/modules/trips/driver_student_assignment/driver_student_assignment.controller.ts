import { Request, Response } from "express";

import { DriverRepository } from "@modules/users/driver/driver.repository";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  UserRole,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  approveAssignment,
  createDriverStudentAssignment as createAssignmentService,
  deactivateAssignment,
  deleteAssignment,
  getActiveAssignmentsByDriverUserId,
  getAllAssignments,
  getAssignmentById,
  getAssignmentsByDriverUserId,
  getAssignmentsByStudentId,
  getPendingAssignmentsByDriverUserId,
  rejectAssignment,
  updateAssignment,
} from "./driver_student_assignment.service";

/**
 * Create driver-student assignment
 * Can be used by driver to add student OR by parent to request driver
 */
export const createDriverStudentAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const assignmentData = req.body;

    const assignment = await createAssignmentService(
      userId,
      userRole as UserRole.PARENT | UserRole.DRIVER,
      assignmentData,
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: assignment,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.CREATED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all assignments (admin only)
 */
export const getAllDriverStudentAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const assignments = await getAllAssignments();

    return res.json({
      success: true,
      data: assignments,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get assignment by ID
 */
export const getAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const assignment = await getAssignmentById(id);

    if (!assignment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: assignment,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all assignments for authenticated driver
 */
export const getMyAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const assignments = await getAssignmentsByDriverUserId(userId);

    return res.json({
      success: true,
      data: assignments,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get active assignments for authenticated driver
 */
export const getMyActiveAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const assignments = await getActiveAssignmentsByDriverUserId(userId);

    return res.json({
      success: true,
      data: assignments,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get pending assignments for authenticated driver
 */
export const getMyPendingAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const assignments = await getPendingAssignmentsByDriverUserId(userId);

    return res.json({
      success: true,
      data: assignments,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get assignments by student ID
 */
export const getAssignmentsByStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { studentId } = req.params as Record<string, string>;

    const assignments = await getAssignmentsByStudentId(studentId);

    return res.json({
      success: true,
      data: assignments,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Update assignment
 */
export const updateDriverStudentAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const updates = req.body;

    const assignment = await updateAssignment(id, updates);

    if (!assignment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: assignment,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.UPDATED_SUCCESSFULLY,
    });
  },
);

/**
 * Approve assignment (driver approving parent request)
 */
export const approveDriverStudentAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const assignment = await approveAssignment(id, userId);

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
 * Reject assignment (driver rejecting parent request or pending assignment)
 */
export const rejectDriverStudentAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const assignment = await rejectAssignment(id, userId);

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
 * Deactivate assignment
 */
export const deactivateDriverStudentAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const assignment = await deactivateAssignment(id);
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
 * Delete assignment (soft delete)
 */
export const deleteDriverStudentAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const deleted = await deleteAssignment(id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DELETED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all drivers
 */
export const getAllDrivers = asyncHandler(
  async (req: Request, res: Response) => {
    const driverRepo = new DriverRepository();
    const drivers = await driverRepo.findMany();

    return res.json({
      success: true,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT
          .DRIVERS_RETRIEVED_SUCCESSFULLY,
      data: drivers,
    });
  },
);
