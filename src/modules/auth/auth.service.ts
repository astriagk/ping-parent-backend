import { ObjectId, WithId } from "mongodb";

import { UserRole } from "@shared/constants";

import { userRepository } from "./auth.repository";
import { User, UserWithProfile } from "./auth.type";

// User management

export const createUser = async (data: User) => {
  return await userRepository.create(data);
};

export const getUserById = async (id: string): Promise<WithId<User> | null> => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return await userRepository.findById(id);
};

export const getUserByEmail = async (
  email: string,
): Promise<WithId<User> | null> => {
  return await userRepository.findByEmail(email);
};

export const getUserByPhone = async (
  phone: string,
): Promise<WithId<User> | null> => {
  return await userRepository.findByPhoneNumber(phone);
};

export const emailExists = async (email: string): Promise<boolean> => {
  return await userRepository.emailExists(email);
};

export const phoneExists = async (phoneNumber: string): Promise<boolean> => {
  return await userRepository.phoneExists(phoneNumber);
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (
  userType?: UserRole,
): Promise<UserWithProfile[]> => {
  const filter: Partial<User> = {};
  if (userType) {
    filter.user_type = userType;
  }
  return await userRepository.findAllWithProfile(filter);
};

/**
 * Activate user (admin only)
 */
export const activateUser = async (
  userId: string,
): Promise<WithId<User> | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }
  return await userRepository.updateById(userId, {
    $set: { is_active: true, updated_at: new Date() },
  });
};

/**
 * Deactivate user (admin only)
 */
export const deactivateUser = async (
  userId: string,
): Promise<WithId<User> | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }
  return await userRepository.updateById(userId, {
    $set: { is_active: false, updated_at: new Date() },
  });
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  if (!ObjectId.isValid(userId)) return;
  await userRepository.updateById(userId, {
    $set: { last_login: new Date(), updated_at: new Date() },
  });
};
