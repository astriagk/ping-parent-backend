import { connectDB } from "../db/mongo";
import { Ping } from "../types/ping.type";
import { PINGS_COLLECTION } from "../config/collections";

const COLLECTION = PINGS_COLLECTION;

export const createPing = async (data: Ping) => {
  const db = await connectDB();
  return db.collection(COLLECTION).insertOne(data);
};

export const getPings = async () => {
  const db = await connectDB();
  return db.collection(COLLECTION).find().toArray();
};
