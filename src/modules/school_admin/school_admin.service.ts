import { WithId } from "mongodb";

import { ERROR_MESSAGES, HTTP_STATUS } from "@shared/constants";
import {
  ApiError,
  comparePassword,
  generateUniqueCode,
  hashPassword,
} from "@shared/utils";

import { schoolAdminRepository } from "./school_admin.repository";
import {
  SchoolAdmin,
  SchoolAdminLoginInput,
  SchoolAdminRegisterInput,
  SchoolAdminUpdateInput,
} from "./school_admin.type";

/**
 * Register new school admin
 */
export const registerSchoolAdmin = async (
  input: SchoolAdminRegisterInput,
): Promise<Omit<WithId<SchoolAdmin>, "password_hash">> => {
  // Check if admin already exists for this email
  const existingAdmin = await schoolAdminRepository.findByEmail(input.email);

  if (existingAdmin) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.SCHOOL_ADMIN.ALREADY_EXISTS,
    );
  }

  const admin_id = generateUniqueCode("SCHADM");
  const password_hash = await hashPassword(input.password);

  const newAdmin: SchoolAdmin = {
    admin_id,
    school_id: input.school_id,
    email: input.email,
    password_hash,
    phone_number: input.phone_number,
    name: input.name,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const admin = await schoolAdminRepository.create(newAdmin);

  // Remove password_hash from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _hash, ...adminWithoutPassword } = admin;
  return adminWithoutPassword as Omit<WithId<SchoolAdmin>, "password_hash">;
};

/**
 * Login school admin
 */
export const loginSchoolAdmin = async (
  input: SchoolAdminLoginInput,
): Promise<{
  admin: Omit<WithId<SchoolAdmin>, "password_hash">;
  tokens: { access_token: string; refresh_token: string };
}> => {
  const admin = await schoolAdminRepository.findByEmail(input.email);

  if (!admin) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.SCHOOL_ADMIN.NOT_FOUND,
    );
  }

  if (!admin.is_active) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.SCHOOL_ADMIN.INACTIVE,
    );
  }

  const isPasswordValid = await comparePassword(
    input.password,
    admin.password_hash,
  );

  if (!isPasswordValid) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.SCHOOL_ADMIN.NOT_FOUND,
    );
  }

  // Update last login
  await schoolAdminRepository.updateById(admin._id.toString(), {
    $set: { last_login: new Date() },
  });

  // Generate tokens (implementation depends on your auth service)
  const access_token = ""; // TODO: Generate access token
  const refresh_token = ""; // TODO: Generate refresh token

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _loginHash, ...adminWithoutPassword } = admin;
  return {
    admin: adminWithoutPassword as Omit<WithId<SchoolAdmin>, "password_hash">,
    tokens: { access_token, refresh_token },
  };
};

/**
 * Get school admin by ID
 */
export const getSchoolAdminById = async (
  adminId: string,
): Promise<Omit<WithId<SchoolAdmin>, "password_hash"> | null> => {
  const admin = await schoolAdminRepository.findByAdminId(adminId);

  if (!admin) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _byIdHash, ...adminWithoutPassword } = admin;
  return adminWithoutPassword as Omit<WithId<SchoolAdmin>, "password_hash">;
};

/**
 * Get all admins for a school
 */
export const getSchoolAdmins = async (
  schoolId: string,
): Promise<Omit<WithId<SchoolAdmin>, "password_hash">[]> => {
  const admins = await schoolAdminRepository.findBySchoolId(schoolId);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return admins.map(({ password_hash: _, ...admin }) => admin) as Omit<
    WithId<SchoolAdmin>,
    "password_hash"
  >[];
};

/**
 * Update school admin
 */
export const updateSchoolAdmin = async (
  adminId: string,
  updates: SchoolAdminUpdateInput,
): Promise<Omit<WithId<SchoolAdmin>, "password_hash"> | null> => {
  const admin = await schoolAdminRepository.findByAdminId(adminId);

  if (!admin) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.SCHOOL_ADMIN.NOT_FOUND,
    );
  }

  const updated = await schoolAdminRepository.updateById(admin._id.toString(), {
    $set: { ...updates, updated_at: new Date() },
  });

  if (!updated) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _updateHash, ...adminWithoutPassword } = updated;
  return adminWithoutPassword as Omit<WithId<SchoolAdmin>, "password_hash">;
};

/**
 * Change school admin password
 */
export const changeSchoolAdminPassword = async (
  adminId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> => {
  const admin = await schoolAdminRepository.findByAdminId(adminId);

  if (!admin) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.SCHOOL_ADMIN.NOT_FOUND,
    );
  }

  const isPasswordValid = await comparePassword(
    currentPassword,
    admin.password_hash,
  );

  if (!isPasswordValid) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.COMMON.UNAUTHORIZED,
    );
  }

  const password_hash = await hashPassword(newPassword);

  await schoolAdminRepository.updateById(admin._id.toString(), {
    $set: { password_hash, updated_at: new Date() },
  });

  return true;
};

/**
 * Deactivate school admin
 */
export const deactivateSchoolAdmin = async (
  adminId: string,
): Promise<boolean> => {
  const admin = await schoolAdminRepository.findByAdminId(adminId);

  if (!admin) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.SCHOOL_ADMIN.NOT_FOUND,
    );
  }

  await schoolAdminRepository.updateById(admin._id.toString(), {
    $set: { is_active: false, updated_at: new Date() },
  });

  return true;
};
