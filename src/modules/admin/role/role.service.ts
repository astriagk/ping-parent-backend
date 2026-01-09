import { WithId } from "mongodb";

import { roleRepository } from "@modules/admin/role/role.repository";
import {
  Role,
  RoleCreateInput,
  RoleResponse,
  RoleUpdateInput,
} from "@modules/admin/role/role.type";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

/**
 * Format role response by removing MongoDB _id
 */
const formatRoleResponse = (role: WithId<Role>): RoleResponse => {
  const { _id, ...roleData } = role;
  return roleData as RoleResponse;
};

/**
 * Create new role
 */
export const createRole = async (
  createData: RoleCreateInput,
): Promise<RoleResponse> => {
  // Check if role name already exists
  const roleNameExists = await roleRepository.roleNameExists(
    createData.role_name,
  );
  if (roleNameExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ROLE.ROLE_NAME_ALREADY_EXISTS,
    );
  }

  // Create role
  const roleData: Role = {
    role_id: generateUniqueCode(UniqueCodeTypes.ROLE),
    role_name: createData.role_name,
    description: createData.description,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const newRole = await roleRepository.create(roleData);

  return formatRoleResponse(newRole);
};

/**
 * Get all roles
 */
export const getAllRoles = async (): Promise<RoleResponse[]> => {
  const roles = await roleRepository.findMany();
  return roles.map(formatRoleResponse);
};

/**
 * Get role by ID
 */
export const getRoleById = async (id: string): Promise<RoleResponse | null> => {
  const role = await roleRepository.findById(id);
  if (!role) {
    return null;
  }
  return formatRoleResponse(role);
};

/**
 * Get role by role_id
 */
export const getRoleByRoleId = async (
  roleId: string,
): Promise<WithId<Role> | null> => {
  return await roleRepository.findByRoleId(roleId);
};

/**
 * Update role
 */
export const updateRole = async (
  id: string,
  updates: RoleUpdateInput,
): Promise<RoleResponse | null> => {
  // Get role to update
  const roleToUpdate = await roleRepository.findById(id);

  if (!roleToUpdate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ROLE.NOT_FOUND);
  }

  // Check role name uniqueness if updating role_name
  if (updates.role_name && updates.role_name !== roleToUpdate.role_name) {
    const roleNameExists = await roleRepository.roleNameExists(
      updates.role_name,
    );
    if (roleNameExists) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.ROLE.ROLE_NAME_ALREADY_EXISTS,
      );
    }
  }

  const updatedRole = await roleRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });

  if (!updatedRole) {
    return null;
  }

  return formatRoleResponse(updatedRole);
};

/**
 * Delete role
 */
export const deleteRole = async (id: string): Promise<boolean> => {
  const role = await roleRepository.findById(id);

  if (!role) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ROLE.NOT_FOUND);
  }

  // Note: In a production system, you'd want to check if the role is assigned to any users
  // and prevent deletion if it is. For now, we'll allow deletion.
  // You can add this check by querying the users collection for user_type matching the role_name

  return await roleRepository.deleteById(id);
};
