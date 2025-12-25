import { ADDRESSES_COLLECTION } from "../config/collections";
import { connectDB } from "../db/mongo";
import { ParentAddress } from "../types/parent.type";

// Legacy address interface for backward compatibility
interface LegacyAddress {
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: { lat: number; lng: number };
  createdAt?: Date;
  updatedAt?: Date;
}

export const upsertAddressByUserId = async (
  userId: string,
  address: Omit<LegacyAddress, "userId" | "createdAt" | "updatedAt">
): Promise<boolean> => {
  const db = await connectDB();
  const query = { userId };
  const update = {
    $set: { ...address, updatedAt: new Date() },
    $setOnInsert: { userId, createdAt: new Date() },
  };
  const result = await db
    .collection(ADDRESSES_COLLECTION)
    .updateOne(query, update, { upsert: true });
  return result.modifiedCount > 0 || result.upsertedCount > 0;
};

export const getAddressByUserId = async (
  userId: string
): Promise<LegacyAddress | null> => {
  const db = await connectDB();
  const query = { userId };
  const address = await db.collection(ADDRESSES_COLLECTION).findOne(query);
  return address as LegacyAddress | null;
};
