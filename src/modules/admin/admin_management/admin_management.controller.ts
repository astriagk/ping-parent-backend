import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import {
  activateUser as activateUserService,
  deactivateUser as deactivateUserService,
  deleteUser as deleteUserService,
  getAllUsers as getAllUsersService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
} from "@modules/auth/auth.service";
import {
  getCompleteDriverDetailsById,
  updateDriverApprovalStatus as updateDriverApprovalStatusService,
} from "@modules/users/driver/driver.service";
import { getCompleteParentDetailsById } from "@modules/users/parent/parent.service";
import {
  ApprovalStatus,
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  SUCCESS_MESSAGES_COMMON,
  UserRole,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import {
  generateAdminAccessToken,
  verifyAdminAccessToken,
} from "@shared/services/token.service";

import {
  activateAdminByAdminId as activateAdminByAdminIdService,
  activateAdmin as activateAdminService,
  createAdmin as createAdminService,
  createInitialSuperAdmin as createInitialSuperAdminService,
  deactivateAdminByAdminId as deactivateAdminByAdminIdService,
  deactivateAdmin as deactivateAdminService,
  getAdminByAdminId,
  getAdminByAdminIdFormatted,
  getAdminById,
  getAdminsBySchool as getAdminsBySchoolService,
  getAllAdmins,
  loginAdmin as loginAdminService,
  updateAdminByAdminId as updateAdminByAdminIdService,
  updateAdmin as updateAdminService,
  verifyPasswordHash as verifyPasswordHashService,
} from "./admin_management.service";

// Verify password against hash (for debugging/testing)
export const verifyPasswordHash = asyncHandler(
  async (req: Request, res: Response) => {
    const { password, password_hash } = req.body;

    const result = await verifyPasswordHashService(password, password_hash);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: result.isValid
        ? "Password matches the hash"
        : "Password does not match the hash",
    });
  },
);

// Admin login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await loginAdminService({ email, password });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
    message: SUCCESS_MESSAGES.ADMIN.LOGIN_SUCCESSFUL,
  });
});

// Create initial super admin (one-time setup - no auth required)
export const createInitialSuperAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const adminData = req.body;

    const newSuperAdmin = await createInitialSuperAdminService(adminData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: newSuperAdmin,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

// Create admin (superadmin only)
export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const creatorAdminId = req.admin?.adminId;

  if (!creatorAdminId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
    );
  }

  const adminData = req.body;

  const newAdmin = await createAdminService(adminData, creatorAdminId);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: newAdmin,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
  });
});

// Get all admins
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const admins = await getAllAdmins();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: admins,
    message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
  });
});

// Get admin by ID
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;

  const admin = await getAdminById(id);

  if (!admin) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: admin,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
  });
});

// Update admin
export const updateAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const updaterAdminId = req.admin?.adminId;

  if (!updaterAdminId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
    );
  }

  const updates = req.body;

  const updatedAdmin = await updateAdminService(id, updates, updaterAdminId);

  if (!updatedAdmin) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: updatedAdmin,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
  });
});

// Activate admin
export const activateAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const activatorAdminId = req.admin?.adminId;

    if (!activatorAdminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
      );
    }

    const activatedAdmin = await activateAdminService(id, activatorAdminId);

    if (!activatedAdmin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: activatedAdmin,
      message: SUCCESS_MESSAGES.ADMIN.ACTIVATED_SUCCESSFULLY,
    });
  },
);

// Deactivate admin
export const deactivateAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const deactivatorAdminId = req.admin?.adminId;

    if (!deactivatorAdminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
      );
    }

    const deactivatedAdmin = await deactivateAdminService(
      id,
      deactivatorAdminId,
    );

    if (!deactivatedAdmin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: deactivatedAdmin,
      message: SUCCESS_MESSAGES.ADMIN.DEACTIVATED_SUCCESSFULLY,
    });
  },
);

// User Management Controllers

// Get all users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { user_type } = req.query;
  const users = await getAllUsersService(user_type as UserRole | undefined);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: users,
    message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;

  const user = await getUserByIdService(id);

  if (!user) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
    );
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
  });
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const updates = req.body;

  const updatedUser = await updateUserService(id, updates);

  if (!updatedUser) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
    );
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: updatedUser,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
  });
});

// Activate user
export const activateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const activatedUser = await activateUserService(id);

    if (!activatedUser) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: activatedUser,
      message: SUCCESS_MESSAGES.AUTH.USER_ACTIVATED_SUCCESSFULLY,
    });
  },
);

// Deactivate user
export const deactivateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const deactivatedUser = await deactivateUserService(id);

    if (!deactivatedUser) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: deactivatedUser,
      message: SUCCESS_MESSAGES.AUTH.USER_DEACTIVATED_SUCCESSFULLY,
    });
  },
);

// Delete user (soft delete)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;

  const deleted = await deleteUserService(id);

  if (!deleted) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
    );
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: null,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
  });
});

export const verifyAdminAuthToken = asyncHandler(
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MALFORMED_AUTH_HEADER,
      );
    }

    try {
      const payload = verifyAdminAccessToken(token);
      const user = await getAdminByAdminId(payload.adminId);
      if (!user) {
        throw new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.AUTH.USER_NOT_FOUND,
        );
      }

      return res.json({
        success: true,
        data: {
          adminId: payload.adminId,
          role: payload.role || "",
          school_id: payload.school_id,
          tokenValid: true,
        },
      });
    } catch (err: any) {
      // handle expired token and optional refresh
      if (err instanceof jwt.TokenExpiredError) {
        const refresh = req.headers["x-refresh-token"] as string | undefined;
        if (refresh) {
          try {
            const refreshPayload = jwt.verify(
              refresh,
              process.env.JWT_SECRET || "dev-secret",
            ) as any;
            if (refreshPayload?.userId) {
              // issue new access token
              const newToken = generateAdminAccessToken({
                adminId: refreshPayload.adminId,
                role: refreshPayload.role,
                ...(refreshPayload.school_id && {
                  school_id: refreshPayload.school_id,
                }),
              });

              return res.json({
                success: true,
                data: {
                  adminId: refreshPayload.adminId,
                  role: refreshPayload.role || "",
                  school_id: refreshPayload.school_id,
                  tokenValid: true,
                  newToken,
                },
              });
            }
          } catch {
            throw new ApiError(
              HTTP_STATUS.UNAUTHORIZED,
              ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
            );
          }
        }

        throw new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
        );
      }

      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.INVALID_TOKEN,
      );
    }
  },
);

// Admin Management by admin_id (for frontend use)

// Get admin by admin_id
export const getByAdminId = asyncHandler(
  async (req: Request, res: Response) => {
    const { admin_id } = req.params as Record<string, string>;

    const admin = await getAdminByAdminIdFormatted(admin_id);

    if (!admin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: admin,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

// Update admin by admin_id
export const updateAdminByAdminId = asyncHandler(
  async (req: Request, res: Response) => {
    const { admin_id } = req.params as Record<string, string>;
    const updaterAdminId = req.admin?.adminId;

    if (!updaterAdminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
      );
    }

    const updates = req.body;

    const updatedAdmin = await updateAdminByAdminIdService(
      admin_id,
      updates,
      updaterAdminId,
    );

    if (!updatedAdmin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedAdmin,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

// Activate admin by admin_id
export const activateAdminByAdminId = asyncHandler(
  async (req: Request, res: Response) => {
    const { admin_id } = req.params as Record<string, string>;
    const activatorAdminId = req.admin?.adminId;

    if (!activatorAdminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
      );
    }

    const activatedAdmin = await activateAdminByAdminIdService(
      admin_id,
      activatorAdminId,
    );

    if (!activatedAdmin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: activatedAdmin,
      message: SUCCESS_MESSAGES.ADMIN.ACTIVATED_SUCCESSFULLY,
    });
  },
);

// Deactivate admin by admin_id
export const deactivateAdminByAdminId = asyncHandler(
  async (req: Request, res: Response) => {
    const { admin_id } = req.params as Record<string, string>;
    const deactivatorAdminId = req.admin?.adminId;

    if (!deactivatorAdminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
      );
    }

    const deactivatedAdmin = await deactivateAdminByAdminIdService(
      admin_id,
      deactivatorAdminId,
    );

    if (!deactivatedAdmin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: deactivatedAdmin,
      message: SUCCESS_MESSAGES.ADMIN.DEACTIVATED_SUCCESSFULLY,
    });
  },
);

// Get complete driver details by ID (for admin verification)
export const getDriverCompleteDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const driverDetails = await getCompleteDriverDetailsById(id);

    if (!driverDetails) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DETAILS_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: driverDetails,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

// Get complete parent details by ID (for admin verification)
export const getParentCompleteDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const parentDetails = await getCompleteParentDetailsById(id);

    if (!parentDetails) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT.DETAILS_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: parentDetails,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

// Get all admins for a specific school
export const getAdminsBySchool = asyncHandler(
  async (req: Request, res: Response) => {
    const { school_id } = req.params as Record<string, string>;

    const admins = await getAdminsBySchoolService(school_id);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: admins,
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

// Update driver approval status
export const updateDriverApprovalStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const { approval_status, rejection_reason } = req.body;
    const adminId = req.admin?.adminId;

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
      );
    }

    // Validate approval_status
    if (
      !approval_status ||
      !Object.values(ApprovalStatus).includes(approval_status)
    ) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.ADMIN.INVALID_APPROVAL_STATUS,
      );
    }

    // If rejecting, rejection_reason should be provided
    if (
      approval_status === ApprovalStatus.REJECTED &&
      !rejection_reason?.trim()
    ) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.ADMIN.REJECTION_REASON_REQUIRED,
      );
    }

    const updated = await updateDriverApprovalStatusService(
      id,
      approval_status as ApprovalStatus,
      adminId,
      rejection_reason,
    );

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: null,
      message: SUCCESS_MESSAGES.DRIVER.APPROVAL_STATUS_UPDATED,
    });
  },
);
