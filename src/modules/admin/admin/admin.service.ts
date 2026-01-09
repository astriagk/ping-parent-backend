import { WithId } from "mongodb";

import {
  AdminRole,
  ERROR_MESSAGES,
  HTTP_STATUS,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateAdminTokenPair } from "@shared/services/token.service";
import {
  comparePassword,
  generateUniqueCode,
  hashPassword,
} from "@shared/utils";

import { adminRepository } from "./admin.repository";
import {
  Admin,
  AdminCreateInput,
  AdminLoginInput,
  AdminLoginResponse,
  AdminResponse,
  AdminUpdateInput,
} from "./admin.type";

/**
 * Format admin response by removing sensitive fields
 */
const formatAdminResponse = (admin: WithId<Admin>): AdminResponse => {
  const { password_hash, _id, ...adminData } = admin;
  return adminData as AdminResponse;
};

/**
 * Admin login with email and password
 */
export const loginAdmin = async (
  loginData: AdminLoginInput,
): Promise<AdminLoginResponse> => {
  const { email, password } = loginData;

  // Find admin by email
  const admin = await adminRepository.findByEmail(email);

  if (!admin || !admin.is_active) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.ADMIN.INVALID_CREDENTIALS,
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, admin.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.ADMIN.INVALID_CREDENTIALS,
    );
  }

  // Update last login
  await adminRepository.updateOne(
    { email },
    { $set: { last_login: new Date() } },
  );

  // Generate tokens
  const tokens = generateAdminTokenPair({
    adminId: admin.admin_id,
    role: admin.admin_role,
  });

  return {
    admin: formatAdminResponse(admin),
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  };
};

/**
 * Create super admin (no authentication required - for initial setup)
 * Allows creating multiple super admins without existing authentication
 */
export const createInitialSuperAdmin = async (
  createData: AdminCreateInput,
): Promise<AdminResponse> => {
  // Check if email already exists
  const emailExists = await adminRepository.emailExists(createData.email);
  if (emailExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS,
    );
  }

  // Check if username already exists
  const usernameExists = await adminRepository.usernameExists(
    createData.username,
  );
  if (usernameExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ADMIN.USERNAME_ALREADY_EXISTS,
    );
  }

  // Hash password
  const password_hash = await hashPassword(createData.password);

  // Create super admin (force role to superadmin)
  const adminData: Admin = {
    admin_id: generateUniqueCode(UniqueCodeTypes.ADMIN),
    username: createData.username,
    email: createData.email,
    password_hash,
    phone_number: createData.phone_number,
    admin_role: AdminRole.SUPERADMIN, // Always create as superadmin
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const newAdmin = await adminRepository.create(adminData);

  return formatAdminResponse(newAdmin);
};

/**
 * Create new admin (superadmin only)
 */
export const createAdmin = async (
  createData: AdminCreateInput,
  creatorAdminId: string,
): Promise<AdminResponse> => {
  // Verify creator is superadmin
  const creator = await adminRepository.findByAdminId(creatorAdminId);

  if (!creator || creator.admin_role !== AdminRole.SUPERADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.ONLY_SUPERADMIN_CAN_CREATE,
    );
  }

  // Check if email already exists
  const emailExists = await adminRepository.emailExists(createData.email);
  if (emailExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS,
    );
  }

  // Check if username already exists
  const usernameExists = await adminRepository.usernameExists(
    createData.username,
  );
  if (usernameExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ADMIN.USERNAME_ALREADY_EXISTS,
    );
  }

  // Hash password
  const password_hash = await hashPassword(createData.password);

  // Create admin
  const adminData: Admin = {
    admin_id: generateUniqueCode(UniqueCodeTypes.ADMIN),
    username: createData.username,
    email: createData.email,
    password_hash,
    phone_number: createData.phone_number,
    admin_role: createData.admin_role,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const newAdmin = await adminRepository.create(adminData);

  return formatAdminResponse(newAdmin);
};

/**
 * Get all admins
 */
export const getAllAdmins = async (): Promise<AdminResponse[]> => {
  const admins = await adminRepository.findMany();
  return admins.map(formatAdminResponse);
};

/**
 * Get admin by ID
 */
export const getAdminById = async (
  id: string,
): Promise<AdminResponse | null> => {
  const admin = await adminRepository.findById(id);
  if (!admin) {
    return null;
  }
  return formatAdminResponse(admin);
};

/**
 * Get admin by admin_id
 */
export const getAdminByAdminId = async (
  adminId: string,
): Promise<WithId<Admin> | null> => {
  return await adminRepository.findByAdminId(adminId);
};

/**
 * Update admin
 */
export const updateAdmin = async (
  id: string,
  updates: AdminUpdateInput,
  updaterAdminId: string,
): Promise<AdminResponse | null> => {
  // Get admin to update
  const adminToUpdate = await adminRepository.findById(id);

  if (!adminToUpdate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  // Prevent modification of superadmin by non-superadmin
  const updater = await adminRepository.findByAdminId(updaterAdminId);
  if (
    adminToUpdate.admin_role === AdminRole.SUPERADMIN &&
    updater?.admin_role !== AdminRole.SUPERADMIN
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  // Check email uniqueness if updating email
  if (updates.email && updates.email !== adminToUpdate.email) {
    const emailExists = await adminRepository.emailExists(updates.email);
    if (emailExists) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS,
      );
    }
  }

  // Check username uniqueness if updating username
  if (updates.username && updates.username !== adminToUpdate.username) {
    const usernameExists = await adminRepository.usernameExists(
      updates.username,
    );
    if (usernameExists) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.ADMIN.USERNAME_ALREADY_EXISTS,
      );
    }
  }

  const updatedAdmin = await adminRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};

/**
 * Activate admin
 */
export const activateAdmin = async (
  id: string,
  activatorAdminId: string,
): Promise<AdminResponse | null> => {
  // Get admin to activate
  const adminToActivate = await adminRepository.findById(id);

  if (!adminToActivate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  // Verify activator is superadmin for superadmin accounts
  const activator = await adminRepository.findByAdminId(activatorAdminId);
  if (
    adminToActivate.admin_role === AdminRole.SUPERADMIN &&
    activator?.admin_role !== AdminRole.SUPERADMIN
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  const updatedAdmin = await adminRepository.updateById(id, {
    $set: { is_active: true, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};

/**
 * Deactivate admin
 */
export const deactivateAdmin = async (
  id: string,
  deactivatorAdminId: string,
): Promise<AdminResponse | null> => {
  // Get admin to deactivate
  const adminToDeactivate = await adminRepository.findById(id);

  if (!adminToDeactivate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  // Prevent deactivation of superadmin
  if (adminToDeactivate.admin_role === AdminRole.SUPERADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  // Verify deactivator is superadmin
  const deactivator = await adminRepository.findByAdminId(deactivatorAdminId);
  if (deactivator?.admin_role !== AdminRole.SUPERADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.ONLY_SUPERADMIN_CAN_CREATE,
    );
  }

  const updatedAdmin = await adminRepository.updateById(id, {
    $set: { is_active: false, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};

/**
 * Get admin by admin_id (for frontend use)
 */
export const getAdminByAdminIdFormatted = async (
  adminId: string,
): Promise<AdminResponse | null> => {
  const admin = await adminRepository.findByAdminId(adminId);
  if (!admin) {
    return null;
  }
  return formatAdminResponse(admin);
};

/**
 * Update admin by admin_id
 */
export const updateAdminByAdminId = async (
  adminId: string,
  updates: AdminUpdateInput,
  updaterAdminId: string,
): Promise<AdminResponse | null> => {
  // Get admin to update
  const adminToUpdate = await adminRepository.findByAdminId(adminId);

  if (!adminToUpdate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  // Prevent modification of superadmin by non-superadmin
  const updater = await adminRepository.findByAdminId(updaterAdminId);
  if (
    adminToUpdate.admin_role === AdminRole.SUPERADMIN &&
    updater?.admin_role !== AdminRole.SUPERADMIN
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  // Check email uniqueness if updating email
  if (updates.email && updates.email !== adminToUpdate.email) {
    const emailExists = await adminRepository.emailExists(updates.email);
    if (emailExists) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS,
      );
    }
  }

  // Check username uniqueness if updating username
  if (updates.username && updates.username !== adminToUpdate.username) {
    const usernameExists = await adminRepository.usernameExists(
      updates.username,
    );
    if (usernameExists) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.ADMIN.USERNAME_ALREADY_EXISTS,
      );
    }
  }

  const updatedAdmin = await adminRepository.updateByAdminId(adminId, {
    $set: { ...updates, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};

/**
 * Activate admin by admin_id
 */
export const activateAdminByAdminId = async (
  adminId: string,
  activatorAdminId: string,
): Promise<AdminResponse | null> => {
  // Get admin to activate
  const adminToActivate = await adminRepository.findByAdminId(adminId);

  if (!adminToActivate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  // Verify activator is superadmin for superadmin accounts
  const activator = await adminRepository.findByAdminId(activatorAdminId);
  if (
    adminToActivate.admin_role === AdminRole.SUPERADMIN &&
    activator?.admin_role !== AdminRole.SUPERADMIN
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  const updatedAdmin = await adminRepository.updateByAdminId(adminId, {
    $set: { is_active: true, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};

/**
 * Deactivate admin by admin_id
 */
export const deactivateAdminByAdminId = async (
  adminId: string,
  deactivatorAdminId: string,
): Promise<AdminResponse | null> => {
  // Get admin to deactivate
  const adminToDeactivate = await adminRepository.findByAdminId(adminId);

  if (!adminToDeactivate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  // Prevent deactivation of superadmin
  if (adminToDeactivate.admin_role === AdminRole.SUPERADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  // Verify deactivator is superadmin
  const deactivator = await adminRepository.findByAdminId(deactivatorAdminId);
  if (deactivator?.admin_role !== AdminRole.SUPERADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.ONLY_SUPERADMIN_CAN_CREATE,
    );
  }

  const updatedAdmin = await adminRepository.updateByAdminId(adminId, {
    $set: { is_active: false, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};
