import { connectDB } from "../db/mongo";
import { USERS_COLLECTION } from "../config/collections";
import { User } from "../types/user.type";
import { ObjectId } from "mongodb";

export const getParentProfile = async (
  userId: string
): Promise<User | null> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
  };

  const parent = await db.collection(USERS_COLLECTION).findOne(query);

  if (!parent) {
    return null;
  }

  delete parent.passwordHash;
  delete parent.verificationToken;

  return parent as User;
};

export const updateParentProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<boolean> => {
  try {
    const db = await connectDB();

    // Remove sensitive fields
    const { _id, passwordHash, verificationToken, ...sanitizedUpdates } =
      updates;

    // Only allow ObjectId as _id
    if (!ObjectId.isValid(userId)) {
      return false;
    }

    const query = { _id: new ObjectId(userId) };

    const result = await db.collection(USERS_COLLECTION).updateOne(query, {
      $set: { ...sanitizedUpdates, updatedAt: new Date() },
    });

    return result.modifiedCount > 0;
  } catch (error) {
    // Optionally log error
    return false;
  }
};
