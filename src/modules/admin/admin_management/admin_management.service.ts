import { WithId } from "mongodb";

import { ERROR_MESSAGES, HTTP_STATUS, UserRole } from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateAdminTokenPair } from "@shared/services/token.service";
import { comparePassword, hashPassword } from "@shared/utils";

import { adminRepository } from "./admin_management.repository";
import {
  Admin,
  AdminCreateInput,
  AdminLoginInput,
  AdminLoginResponse,
  AdminResponse,
  AdminUpdateInput,
} from "./admin_management.type";

/**
 * Verify password against hash
 */
export const verifyPasswordHash = async (
  password: string,
  passwordHash: string,
): Promise<{ isValid: boolean }> => {
  const isValid = await comparePassword(password, passwordHash);
  return { isValid };
};

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

  // Generate tokens (include school_id for school admins)
  const tokens = generateAdminTokenPair({
    adminId: String(admin._id),
    role: admin.admin_role,
    ...(admin.school_id && { school_id: admin.school_id }),
  });

  return {
    admin: formatAdminResponse(admin),
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  };
};

/**
 * Create super admin (no authentication required - for initial setup)
 */
export const createInitialSuperAdmin = async (
  createData: AdminCreateInput,
): Promise<AdminResponse> => {
  const emailExists = await adminRepository.emailExists(createData.email);
  if (emailExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS,
    );
  }

  const usernameExists = await adminRepository.usernameExists(
    createData.username,
  );
  if (usernameExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ADMIN.USERNAME_ALREADY_EXISTS,
    );
  }

  const password_hash = await hashPassword(createData.password);

  const adminData: Admin = {
    username: createData.username,
    email: createData.email,
    password_hash,
    phone_number: createData.phone_number,
    admin_role: UserRole.SUPERADMIN,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const newAdmin = await adminRepository.create(adminData);
  return formatAdminResponse(newAdmin);
};

/**
 * Create new admin
 * - superadmin can create: admin, school_admin
 * - admin can create: school_admin only
 * - school_admin cannot create anyone
 */
export const createAdmin = async (
  createData: AdminCreateInput,
  creatorAdminId: string,
): Promise<AdminResponse> => {
  const creator = await adminRepository.findById(creatorAdminId);

  if (!creator) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.ONLY_SUPERADMIN_CAN_CREATE,
    );
  }

  // school_admin cannot create anyone
  if (creator.admin_role === UserRole.SCHOOL_ADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.ONLY_SUPERADMIN_CAN_CREATE,
    );
  }

  // admin can only create school_admin
  if (
    creator.admin_role === UserRole.ADMIN &&
    createData.admin_role !== UserRole.SCHOOL_ADMIN
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.ONLY_SUPERADMIN_CAN_CREATE,
    );
  }

  const emailExists = await adminRepository.emailExists(createData.email);
  if (emailExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS,
    );
  }

  const usernameExists = await adminRepository.usernameExists(
    createData.username,
  );
  if (usernameExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.ADMIN.USERNAME_ALREADY_EXISTS,
    );
  }

  const password_hash = await hashPassword(createData.password);

  const adminData: Admin = {
    username: createData.username,
    email: createData.email,
    password_hash,
    phone_number: createData.phone_number,
    admin_role: createData.admin_role,
    ...(createData.school_id && { school_id: createData.school_id }),
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
 * Get all school admins for a specific school
 */
export const getAdminsBySchool = async (
  schoolId: string,
): Promise<AdminResponse[]> => {
  const admins = await adminRepository.findBySchoolId(schoolId);
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
 * Get admin by _id (raw, for internal use)
 */
export const getAdminByAdminId = async (
  adminId: string,
): Promise<WithId<Admin> | null> => {
  return await adminRepository.findById(adminId);
};

/**
 * Update admin
 */
export const updateAdmin = async (
  id: string,
  updates: AdminUpdateInput,
  updaterAdminId: string,
): Promise<AdminResponse | null> => {
  const adminToUpdate = await adminRepository.findById(id);

  if (!adminToUpdate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  const updater = await adminRepository.findById(updaterAdminId);
  if (
    adminToUpdate.admin_role === UserRole.SUPERADMIN &&
    updater?.admin_role !== UserRole.SUPERADMIN
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  if (updates.email && updates.email !== adminToUpdate.email) {
    const emailExists = await adminRepository.emailExists(updates.email);
    if (emailExists) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS,
      );
    }
  }

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
  const adminToActivate = await adminRepository.findById(id);

  if (!adminToActivate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  const activator = await adminRepository.findById(activatorAdminId);
  if (
    adminToActivate.admin_role === UserRole.SUPERADMIN &&
    activator?.admin_role !== UserRole.SUPERADMIN
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
  const adminToDeactivate = await adminRepository.findById(id);

  if (!adminToDeactivate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  if (adminToDeactivate.admin_role === UserRole.SUPERADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  const deactivator = await adminRepository.findById(deactivatorAdminId);
  if (deactivator?.admin_role !== UserRole.SUPERADMIN) {
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
 * Get admin by ID (formatted for frontend)
 */
export const getAdminByAdminIdFormatted = async (
  adminId: string,
): Promise<AdminResponse | null> => {
  const admin = await adminRepository.findById(adminId);
  if (!admin) {
    return null;
  }
  return formatAdminResponse(admin);
};

/**
 * Update admin by ID
 */
export const updateAdminByAdminId = async (
  adminId: string,
  updates: AdminUpdateInput,
  updaterAdminId: string,
): Promise<AdminResponse | null> => {
  const adminToUpdate = await adminRepository.findById(adminId);

  if (!adminToUpdate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  const updater = await adminRepository.findById(updaterAdminId);
  if (
    adminToUpdate.admin_role === UserRole.SUPERADMIN &&
    updater?.admin_role !== UserRole.SUPERADMIN
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  if (updates.email && updates.email !== adminToUpdate.email) {
    const emailExists = await adminRepository.emailExists(updates.email);
    if (emailExists) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.ADMIN.EMAIL_ALREADY_EXISTS,
      );
    }
  }

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

  const updatedAdmin = await adminRepository.updateById(adminId, {
    $set: { ...updates, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};

/**
 * Activate admin by ID
 */
export const activateAdminByAdminId = async (
  adminId: string,
  activatorAdminId: string,
): Promise<AdminResponse | null> => {
  const adminToActivate = await adminRepository.findById(adminId);

  if (!adminToActivate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  const activator = await adminRepository.findById(activatorAdminId);
  if (
    adminToActivate.admin_role === UserRole.SUPERADMIN &&
    activator?.admin_role !== UserRole.SUPERADMIN
  ) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  const updatedAdmin = await adminRepository.updateById(adminId, {
    $set: { is_active: true, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};

/**
 * Deactivate admin by ID
 */
export const deactivateAdminByAdminId = async (
  adminId: string,
  deactivatorAdminId: string,
): Promise<AdminResponse | null> => {
  const adminToDeactivate = await adminRepository.findById(adminId);

  if (!adminToDeactivate) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ADMIN.NOT_FOUND);
  }

  if (adminToDeactivate.admin_role === UserRole.SUPERADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.CANNOT_MODIFY_SUPERADMIN,
    );
  }

  const deactivator = await adminRepository.findById(deactivatorAdminId);
  if (deactivator?.admin_role !== UserRole.SUPERADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.ADMIN.ONLY_SUPERADMIN_CAN_CREATE,
    );
  }

  const updatedAdmin = await adminRepository.updateById(adminId, {
    $set: { is_active: false, updated_at: new Date() },
  });

  if (!updatedAdmin) {
    return null;
  }

  return formatAdminResponse(updatedAdmin);
};
