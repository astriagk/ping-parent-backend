import { connectDB } from "../db/mongo";
import { User } from "../types/user.type";
import { ObjectId } from "mongodb";
import { USERS_COLLECTION } from "../config/collections";

const COLLECTION = USERS_COLLECTION;

export const createUser = async (data: User) => {
  const db = await connectDB();
  return db.collection(COLLECTION).insertOne(data);
};

export const getUsers = async () => {
  const db = await connectDB();
  return db.collection(COLLECTION).find().toArray();
};

export const getUserById = async (id: string) => {
  const db = await connectDB();
  // If the collection uses ObjectId for _id, convert when possible.
  if (ObjectId.isValid(id)) {
    return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  }

  // Fallback: query by string _id (some projects store string IDs).
  return db.collection(COLLECTION).findOne({ _id: id } as any);
};

export const getUserByEmail = async (email: string) => {
  const db = await connectDB();
  return db.collection(COLLECTION).findOne({ email: email.toLowerCase() });
};

export const updateUserPassword = async (
  email: string,
  passwordHash: string
) => {
  const db = await connectDB();
  return db
    .collection(COLLECTION)
    .updateOne({ email: email.toLowerCase() }, { $set: { passwordHash } });
};

export const getUserByPhone = async (phone: string) => {
  const db = await connectDB();
  return db.collection(COLLECTION).findOne({ phone });
};

export const createPhoneOtp = async (
  phone: string,
  otp: string,
  ttlMinutes = 10
) => {
  const db = await connectDB();
  const now = new Date();
  const doc = {
    phone,
    otp,
    otpExpiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000),
    verified: false,
    createdAt: now,
  };
  const res = await db.collection(USERS_COLLECTION).insertOne(doc);
  return res.insertedId;
};

export const verifyPhoneOtp = async (phone: string, otp: string) => {
  const db = await connectDB();
  const now = new Date();
  const row = await db.collection(USERS_COLLECTION).findOne({
    phone,
    otp,
    verified: false,
    otpExpiresAt: { $gt: now },
  });

  if (!row) return false;

  await db
    .collection(USERS_COLLECTION)
    .updateOne({ _id: row._id }, { $set: { verified: true, verifiedAt: now } });

  return true;
};

export const isPhoneVerified = async (phone: string) => {
  const db = await connectDB();
  const row = await db.collection(USERS_COLLECTION).findOne({
    phone,
    verified: true,
  });
  return !!row;
};

export const deletePhoneOtpRecords = async (phone: string) => {
  const db = await connectDB();
  await db.collection(USERS_COLLECTION).deleteMany({ phone });
};

// Login OTP functions - using USERS collection for tracking

export const updateLoginOtp = async (
  phone: string,
  otp: string,
  ttlMinutes = 10
) => {
  const db = await connectDB();
  const now = new Date();
  const update = {
    $set: {
      otp,
      otpExpiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000),
      updatedAt: now,
    },
  };
  const res = await db
    .collection(USERS_COLLECTION)
    .updateOne({ phone }, update);
  return res.modifiedCount > 0;
};

export const verifyLoginOtp = async (phone: string, otp: string) => {
  const db = await connectDB();
  const now = new Date();
  const row = await db.collection(USERS_COLLECTION).findOne({
    phone,
    otp,
    otpExpiresAt: { $gt: now },
  });

  console.log(row);

  if (!row) return false;

  return true;
};
