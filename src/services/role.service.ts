import { COLLECTIONS } from "@config/collections";
import { connectDB } from "@db/mongo";

const COLLECTION = COLLECTIONS.ROLES || "roles";

export const getAllRoles = async (): Promise<string[]> => {
  const db = await connectDB();
  const rows = await db.collection(COLLECTION).find().toArray();
  // Expect documents like { name: 'parent' }
  return rows
    .map((r: any) => (r.code ? String(r.code) : String(r)))
    .filter(Boolean);
};
