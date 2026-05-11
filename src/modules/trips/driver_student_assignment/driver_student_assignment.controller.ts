import { Request, Response } from "express";

import { DriverRepository } from "@modules/users/driver/driver.repository";
import {
  AssignmentStatus,
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  SUCCESS_MESSAGES_COMMON,
  UserRole,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  adminApproveAssignmentOverride,
  adminAssignStudent,
  adminDeactivateAssignmentOverride,
  adminRejectAssignmentOverride,
  approveAssignment,
  createDriverStudentAssignment as createAssignmentService,
  deactivateAssignment,
  deleteAssignment,
  getActiveAssignmentsByDriverUserId,
  getAllAssignments,
  getAssignmentById,
  getAssignmentsByDriverUserId,
  getAssignmentsByStudentId,
  getParentRequestedAssignments,
  getParentRequestedAssignmentsByDriver,
  getPendingAssignmentsByDriverUserId,
  reassignDriver,
  rejectAssignment,
  updateAssignment,
} from "./driver_student_assignment.service";
import { AdminAssignStudentInput } from "./driver_student_assignment.type";

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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
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
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

/**
 * Get parent-requested assignments with driver, student, and parent address details
 */
export const getParentRequestedAssignmentsData = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignment_status } = req.query;
    let assignmentStatus: string | undefined;

    if (assignment_status) {
      assignmentStatus = String(assignment_status);
      // Validate against AssignmentStatus enum values
      const validStatuses = Object.values(AssignmentStatus);
      if (!validStatuses.includes(assignmentStatus as AssignmentStatus)) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Invalid assignment_status. Valid values are: ${validStatuses.join(", ")}`,
        );
      }
    }

    const assignments = await getParentRequestedAssignments(assignmentStatus);

    return res.json({
      success: true,
      data: assignments,
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

/**
 * Get parent-requested assignments for authenticated driver
 */
export const getDriverParentRequestedAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { assignment_status } = req.query;
    let assignmentStatus: string | undefined;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    if (assignment_status) {
      assignmentStatus = String(assignment_status);
      // Validate against AssignmentStatus enum values
      const validStatuses = Object.values(AssignmentStatus);
      if (!validStatuses.includes(assignmentStatus as AssignmentStatus)) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Invalid assignment_status. Valid values are: ${validStatuses.join(", ")}`,
        );
      }
    }

    const assignments = await getParentRequestedAssignmentsByDriver(
      userId,
      assignmentStatus,
    );

    return res.json({
      success: true,
      data: assignments,
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
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
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
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
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
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
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
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
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
      data: drivers,
    });
  },
);

const requireAdminId = (req: Request): string => {
  const adminId = req.admin?.adminId;
  if (!adminId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
    );
  }
  return adminId;
};

export const adminAssignStudentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = requireAdminId(req);
    const assignment = await adminAssignStudent(
      req.body as AdminAssignStudentInput,
      adminId,
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: assignment,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

export const adminApproveAssignmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const updated = await adminApproveAssignmentOverride(id);
    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }
    return res.json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.APPROVED_SUCCESSFULLY,
    });
  },
);

export const adminRejectAssignmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const updated = await adminRejectAssignmentOverride(id);
    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }
    return res.json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.REJECTED_SUCCESSFULLY,
    });
  },
);

export const adminDeactivateAssignmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const updated = await adminDeactivateAssignmentOverride(id);
    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.NOT_FOUND,
      );
    }
    return res.json({
      success: true,
      data: updated,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.DEACTIVATED_SUCCESSFULLY,
    });
  },
);

/**
 * Reassign driver for an existing assignment
 */
export const reassignDriverStudentAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const { driver_id, monthly_fee } = req.body;

    const result = await reassignDriver(id, userId, {
      driver_id,
      monthly_fee,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message:
        SUCCESS_MESSAGES.DRIVER_STUDENT_ASSIGNMENT.REASSIGNED_SUCCESSFULLY,
    });
  },
);
