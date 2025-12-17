import { connectDB } from "../db/mongo";
import { COLLECTIONS } from "../config/collections";
import crypto from "crypto";

const COLLECTION = COLLECTIONS.PASSWORD_RESETS || "password_resets";

export const createOtpForEmail = async (
  email: string,
  otp: string,
  ttlMinutes = 10
) => {
  const db = await connectDB();
  const now = new Date();
  const doc = {
    email: email.toLowerCase(),
    otp,
    otpExpiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000),
    used: false,
    createdAt: now,
  } as any;
  const res = await db.collection(COLLECTION).insertOne(doc);
  return res.insertedId;
};

export const verifyOtpAndCreateResetToken = async (
  email: string,
  otp: string,
  resetTtlMinutes = 60
) => {
  const db = await connectDB();
  const now = new Date();
  const row = await db.collection(COLLECTION).findOne({
    email: email.toLowerCase(),
    otp,
    used: false,
    otpExpiresAt: { $gt: now },
  } as any);

  if (!row) return null;

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiresAt = new Date(
    now.getTime() + resetTtlMinutes * 60 * 1000
  );

  await db
    .collection(COLLECTION)
    .updateOne(
      { _id: row._id },
      { $set: { used: true, resetToken, resetTokenExpiresAt } }
    );

  return resetToken;
};

export const consumeResetToken = async (resetToken: string) => {
  const db = await connectDB();
  const now = new Date();
  const row = await db
    .collection(COLLECTION)
    .findOne({ resetToken, resetTokenExpiresAt: { $gt: now } } as any);
  if (!row) return null;
  // mark consumed: remove token
  await db
    .collection(COLLECTION)
    .updateOne(
      { _id: row._id },
      { $set: { resetToken: null, resetTokenExpiresAt: null, consumedAt: now } }
    );
  return row.email;
};
