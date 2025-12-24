import { connectDB } from "../db/mongo";
import { USERS_COLLECTION } from "../config/collections";
import { ObjectId } from "mongodb";

export interface CallParentRequest {
  _id?: any;
  studentId: string;
  parentId: string;
  requestedBy: string;
  requestedAt: Date;
  reason?: string;
  status: "pending" | "completed" | "cancelled";
}

export const createCallParentRequest = async (
  studentId: string,
  parentId: string,
  requestedBy: string,
  reason?: string
): Promise<CallParentRequest> => {
  const db = await connectDB();

  const callRequest: CallParentRequest = {
    studentId,
    parentId,
    requestedBy,
    requestedAt: new Date(),
    reason,
    status: "pending",
  };

  const result = await db.collection("call_requests").insertOne(callRequest);

  return {
    ...callRequest,
    _id: result.insertedId,
  };
};

export const getParentPhoneNumber = async (parentId: string): Promise<string | null> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(parentId) ? new ObjectId(parentId) : parentId,
  };

  const parent = await db.collection(USERS_COLLECTION).findOne(query);

  return parent?.phone || null;
};
