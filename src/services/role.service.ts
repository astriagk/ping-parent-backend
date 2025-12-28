import { getDB } from "@config";
import { ROLES_COLLECTION } from "@constants";

export const getAllRoles = async (): Promise<string[]> => {
  const db = await getDB();
  const rows = await db.collection(ROLES_COLLECTION).find().toArray();
  // Expect documents like { name: 'parent' }
  return rows
    .map((r: any) => (r.code ? String(r.code) : String(r)))
    .filter(Boolean);
};
