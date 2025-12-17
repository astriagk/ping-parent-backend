import { connectDB } from "../db/mongo";
import { User } from "../types/user.type";
import { ObjectId } from "mongodb";

const COLLECTION = "users";

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
