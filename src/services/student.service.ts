import { connectDB } from "../db/mongo";
import { STUDENTS_COLLECTION } from "../config/collections";
import { Student } from "../types/student.type";
import { ObjectId } from "mongodb";

export const getStudentsByParentId = async (parentId: string): Promise<Student[]> => {
  const db = await connectDB();

  const students = await db
    .collection(STUDENTS_COLLECTION)
    .find({ parentId })
    .sort({ createdAt: -1 })
    .toArray();

  return students as Student[];
};

export const getStudentById = async (
  studentId: string,
  parentId: string
): Promise<Student | null> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId,
    parentId,
  };

  const student = await db.collection(STUDENTS_COLLECTION).findOne(query);

  return student as Student | null;
};

export const createStudent = async (studentData: Student): Promise<Student> => {
  const db = await connectDB();

  const newStudent = {
    ...studentData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection(STUDENTS_COLLECTION).insertOne(newStudent);

  return {
    ...newStudent,
    _id: result.insertedId,
  };
};

export const updateStudent = async (
  studentId: string,
  parentId: string,
  updates: Partial<Student>
): Promise<boolean> => {
  const db = await connectDB();

  const sanitizedUpdates = { ...updates };
  delete sanitizedUpdates._id;
  delete sanitizedUpdates.parentId;

  const query: any = {
    _id: ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId,
    parentId,
  };

  const result = await db
    .collection(STUDENTS_COLLECTION)
    .updateOne(query, { $set: { ...sanitizedUpdates, updatedAt: new Date() } });

  return result.modifiedCount > 0;
};

export const deleteStudent = async (
  studentId: string,
  parentId: string
): Promise<boolean> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId,
    parentId,
  };

  const result = await db.collection(STUDENTS_COLLECTION).deleteOne(query);

  return result.deletedCount > 0;
};
