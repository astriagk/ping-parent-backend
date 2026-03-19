import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES_COMMON,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  createRole as createRoleService,
  deleteRole as deleteRoleService,
  getRoleById as getRoleByIdService,
  getAllRoles as rolesService,
  updateRole as updateRoleService,
} from "./role.service";

// Create role
export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const roleData = req.body;

  const newRole = await createRoleService(roleData);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: newRole,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
  });
});

// Get all roles
export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await rolesService();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: roles,
    message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
  });
});

// Get role by ID
export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;

  const role = await getRoleByIdService(id);

  if (!role) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ROLE.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: role,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
  });
});

// Update role
export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const updates = req.body;

  const updatedRole = await updateRoleService(id, updates);

  if (!updatedRole) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ROLE.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: updatedRole,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
  });
});

// Delete role
export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;

  const deleted = await deleteRoleService(id);

  if (!deleted) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ROLE.NOT_FOUND);
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: null,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
  });
});
