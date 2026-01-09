import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import {
  createRole as createRoleService,
  deleteRole as deleteRoleService,
  getAllRoles,
  getRoleById,
  updateRole as updateRoleService,
} from "@shared/services/role.service";

// Create role
export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const roleData = req.body;

  const newRole = await createRoleService(roleData);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: newRole,
    message: SUCCESS_MESSAGES.ROLE.CREATED_SUCCESSFULLY,
  });
});

// Get all roles
export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const roles = await getAllRoles();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: roles,
    message: SUCCESS_MESSAGES.ROLE.LIST_FETCHED_SUCCESSFULLY,
  });
});

// Get role by ID
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await getRoleById(id);

  if (!role) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ROLE.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: role,
    message: SUCCESS_MESSAGES.ROLE.FETCHED_SUCCESSFULLY,
  });
});

// Update role
export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedRole = await updateRoleService(id, updates);

  if (!updatedRole) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ROLE.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: updatedRole,
    message: SUCCESS_MESSAGES.ROLE.UPDATED_SUCCESSFULLY,
  });
});

// Delete role
export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await deleteRoleService(id);

  if (!deleted) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ROLE.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: null,
    message: SUCCESS_MESSAGES.ROLE.DELETED_SUCCESSFULLY,
  });
});
