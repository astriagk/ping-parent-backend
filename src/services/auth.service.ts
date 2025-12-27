import { ObjectId, WithId } from "mongodb";

import { getDB } from "@config";
import { OTP_VERIFICATION_COLLECTION } from "@constants";
import { User } from "@models";
import { userRepository } from "@repositories";

// User management
export const createUser = async (data: Partial<User>) => {
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
