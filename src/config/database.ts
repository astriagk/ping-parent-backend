/* eslint-disable no-console */
import { Db, MongoClient } from "mongodb";

let db: Db;

export const connectDB = async (): Promise<Db> => {
  if (db) return db;

  const client = new MongoClient(process.env.MONGO_URI as string);
  await client.connect();

  db = client.db(process.env.DB_NAME);
  console.log("✅ MongoDB connected");

  return db;
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};
