import { ObjectId, WithId } from "mongodb";

import {
  DRIVERS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { Student } from "./student.type";

export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super(STUDENTS_COLLECTION);
  }

  async findByParentId(parentId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ parent_id: parentId });
  }

  async findByParentIdWithPopulate(parentId: string): Promise<any[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        {
          $match: { parent_id: parentId },
        },
        {
          $addFields: {
            school_object_id: { $toObjectId: "$school_id" },
          },
        },
        {
          $lookup: {
            from: SCHOOLS_COLLECTION,
            localField: "school_object_id",
            foreignField: "_id",
            as: "school",
          },
        },
        {
          $unwind: {
            path: "$school",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            pickup_address_object_id: { $toObjectId: "$pickup_address_id" },
          },
        },
        {
          $lookup: {
            from: PARENT_ADDRESSES_COLLECTION,
            localField: "pickup_address_object_id",
            foreignField: "_id",
            as: "pickup_address",
          },
        },
        {
          $unwind: {
            path: "$pickup_address",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
            let: { studentId: { $toString: "$_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$student_id", "$$studentId"] } } },
            ],
            as: "driver_assignment",
          },
        },
        {
          $unwind: {
            path: "$driver_assignment",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: DRIVERS_COLLECTION,
            let: { driverId: { $toObjectId: "$driver_assignment.driver_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$driverId"] } } }],
            as: "driver",
          },
        },
        {
          $unwind: {
            path: "$driver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            pickup_address_object_id: 0,
          },
        },
      ])
      .toArray();
  }

  async findBySchoolId(schoolId: string): Promise<WithId<Student>[]> {
    return await this.findMany({ school_id: schoolId });
  }

  async findActiveStudentsByParentId(
    parentId: string,
  ): Promise<WithId<Student>[]> {
    return await this.findMany({ parent_id: parentId, is_active: true });
  }

  async findActiveStudentsByParentIdWithPopulate(
    parentId: string,
  ): Promise<any[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        {
          $match: { parent_id: parentId, is_active: true },
        },
        {
          $addFields: {
            school_object_id: { $toObjectId: "$school_id" },
          },
        },
        {
          $lookup: {
            from: SCHOOLS_COLLECTION,
            localField: "school_object_id",
            foreignField: "_id",
            as: "school",
          },
        },
        {
          $unwind: {
            path: "$school",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            pickup_address_object_id: { $toObjectId: "$pickup_address_id" },
          },
        },
        {
          $lookup: {
            from: PARENT_ADDRESSES_COLLECTION,
            localField: "pickup_address_object_id",
            foreignField: "_id",
            as: "pickup_address",
          },
        },
        {
          $unwind: {
            path: "$pickup_address",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
            let: { studentId: { $toString: "$_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$student_id", "$$studentId"] } } },
            ],
            as: "driver_assignment",
          },
        },
        {
          $unwind: {
            path: "$driver_assignment",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: DRIVERS_COLLECTION,
            let: { driverId: { $toObjectId: "$driver_assignment.driver_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$driverId"] } } }],
            as: "driver",
          },
        },
        {
          $unwind: {
            path: "$driver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            school_object_id: 0,
            pickup_address_object_id: 0,
          },
        },
      ])
      .toArray();
  }

  async findByStudentId(studentId: string): Promise<WithId<Student> | null> {
    return await this.findOne({ _id: new ObjectId(studentId) });
  }

  async studentIdExists(studentId: string): Promise<boolean> {
    return await this.exists({ _id: new ObjectId(studentId) });
  }

  async findDuplicateStudent(
    parentId: string,
    studentName: string,
    schoolId: string,
    classValue: string,
  ): Promise<WithId<Student> | null> {
    return await this.findOne({
      parent_id: parentId,
      student_name: studentName,
      school_id: schoolId,
      class: classValue,
      is_active: true,
    });
  }
}

export const studentRepository = new StudentRepository();
