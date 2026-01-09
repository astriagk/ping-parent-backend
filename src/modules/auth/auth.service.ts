import { ObjectId, WithId } from "mongodb";

import { getDB } from "@shared/config";
import { OTP_VERIFICATION_COLLECTION, UserRole } from "@shared/constants";

import { userRepository } from "./auth.repository";
import { User } from "./auth.type";

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
): Promise<WithId<User>[]> => {
  const filter: Partial<User> = {};
  if (userType) {
    filter.user_type = userType;
  }
  return await userRepository.findMany(filter);
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
 * Update user (admin only)
 */
export const updateUser = async (
  userId: string,
  updates: Partial<
    Pick<User, "phone_number" | "user_type" | "is_active" | "fcm_token">
  >,
): Promise<WithId<User> | null> => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }
  return await userRepository.updateById(userId, {
    $set: { ...updates, updated_at: new Date() },
  });
};

/**
 * Delete user (admin only) - Soft delete by deactivating
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  if (!ObjectId.isValid(userId)) {
    return false;
  }
  // Soft delete by deactivating the user
  const result = await userRepository.updateById(userId, {
    $set: { is_active: false, updated_at: new Date() },
  });
  return result !== null;
};

// OTP management
export const createPhoneOtp = async (
  phone: string,
  otp: string,
  ttlMinutes = 10,
) => {
  const db = await getDB();
  const now = new Date();
  const doc = {
    phone_number: phone,
    otp_code: otp,
    expires_at: new Date(now.getTime() + ttlMinutes * 60 * 1000),
    is_verified: false,
    created_at: now,
  };
  const res = await db.collection(OTP_VERIFICATION_COLLECTION).insertOne(doc);
  return res.insertedId;
};

export const verifyPhoneOtp = async (phone: string, otp: string) => {
  const db = await getDB();
  const now = new Date();
  const row = await db.collection(OTP_VERIFICATION_COLLECTION).findOne({
    phone_number: phone,
    otp_code: otp,
    is_verified: false,
    expires_at: { $gt: now },
  });

  if (!row) return false;

  await db.collection(OTP_VERIFICATION_COLLECTION).deleteOne({ _id: row._id });

  return true;
};
