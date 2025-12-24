import { ADDRESSES_COLLECTION } from "../config/collections";
import { connectDB } from "../db/mongo";
import { Address } from "../types/address.type";

export const upsertAddressByUserId = async (
  userId: string,
  address: Omit<Address, "userId" | "createdAt" | "updatedAt">
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
): Promise<Address | null> => {
  const db = await connectDB();
  const query = { userId };
  const address = await db.collection(ADDRESSES_COLLECTION).findOne(query);
  return address as Address | null;
};
