import {
  USERS_COLLECTION,
  OTP_VERIFICATION_COLLECTION,
} from "@config/collections";
import { connectDB } from "@db/mongo";
import { User } from "@models/index";
import { ObjectId } from "mongodb";

const COLLECTION = USERS_COLLECTION;

export const createUser = async (data: User) => {
  const db = await connectDB();
  return db.collection(COLLECTION).insertOne(data);
};

export const getUserById = async (id: string) => {
  const db = await connectDB();
  if (ObjectId.isValid(id)) {
    return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  }
  return db.collection(COLLECTION).findOne({ _id: id } as any);
};

export const getUserByEmail = async (email: string) => {
  const db = await connectDB();
  return db.collection(COLLECTION).findOne({ email: email.toLowerCase() });
};

export const updateUserPassword = async (
  email: string,
  passwordHash: string,
) => {
  const db = await connectDB();
  return db
    .collection(COLLECTION)
    .updateOne({ email: email.toLowerCase() }, { $set: { passwordHash } });
};

export const getUserByPhone = async (phone: string) => {
  const db = await connectDB();
  return db.collection(COLLECTION).findOne({ phone_number: phone });
};

export const createPhoneOtp = async (
  phone: string,
  otp: string,
  ttlMinutes = 10,
) => {
  const db = await connectDB();
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
  const db = await connectDB();
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
