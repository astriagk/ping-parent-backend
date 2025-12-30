import { Request, Response } from "express";

import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from "@constants";
import { ApiError, asyncHandler } from "@middlewares";
import {
  activateAdmin as activateAdminService,
  createAdmin as createAdminService,
  deactivateAdmin as deactivateAdminService,
  getAdminById,
  getAllAdmins,
  loginAdmin as loginAdminService,
  updateAdmin as updateAdminService,
} from "@services/admin.service";
import {
  activateUser as activateUserService,
  deactivateUser as deactivateUserService,
  deleteUser as deleteUserService,
  getAllUsers as getAllUsersService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
} from "@services/auth.service";

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
    message: SUCCESS_MESSAGES.ADMIN.CREATED_SUCCESSFULLY,
  });
});

// Get all admins
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const admins = await getAllAdmins();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: admins,
    message: SUCCESS_MESSAGES.ADMIN.LIST_FETCHED_SUCCESSFULLY,
  });
});

// Get admin by ID
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const admin = await getAdminById(id);

  if (!admin) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: admin,
    message: SUCCESS_MESSAGES.ADMIN.FETCHED_SUCCESSFULLY,
  });
});

// Update admin
export const updateAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
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
    message: SUCCESS_MESSAGES.ADMIN.UPDATED_SUCCESSFULLY,
  });
});

// Activate admin
export const activateAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
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
    const { id } = req.params;
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
  const users = await getAllUsersService();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: users,
    message: "Users list fetched successfully",
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

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
    message: SUCCESS_MESSAGES.AUTH.USER_FETCHED_SUCCESSFULLY,
  });
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
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
    message: "User updated successfully",
  });
});

// Activate user
export const activateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

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
    const { id } = req.params;

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
  const { id } = req.params;

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
    message: "User deleted successfully",
  });
});
