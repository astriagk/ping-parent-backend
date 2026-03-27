import { ObjectId, WithId } from "mongodb";

import {
  AssignmentStatus,
  DRIVERS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  USERS_COLLECTION,
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
              {
                $match: {
                  $expr: { $eq: ["$student_id", "$$studentId"] },
                  assignment_status: { $ne: AssignmentStatus.INACTIVE },
                },
              },
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
          $addFields: {
            driver_user_obj_id: {
              $cond: [
                { $ne: ["$driver.user_id", null] },
                { $toObjectId: "$driver.user_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: USERS_COLLECTION,
            localField: "driver_user_obj_id",
            foreignField: "_id",
            as: "driver_user",
          },
        },
        {
          $unwind: {
            path: "$driver_user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            "driver.phone_number": "$driver_user.phone_number",
          },
        },
        {
          $project: {
            pickup_address_object_id: 0,
            driver_user_obj_id: 0,
            driver_user: 0,
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
              {
                $match: {
                  $expr: { $eq: ["$student_id", "$$studentId"] },
                  assignment_status: { $ne: AssignmentStatus.INACTIVE },
                },
              },
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
          $addFields: {
            driver_user_obj_id: {
              $cond: [
                { $ne: ["$driver.user_id", null] },
                { $toObjectId: "$driver.user_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: USERS_COLLECTION,
            localField: "driver_user_obj_id",
            foreignField: "_id",
            as: "driver_user",
          },
        },
        {
          $unwind: {
            path: "$driver_user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            "driver.phone_number": "$driver_user.phone_number",
          },
        },
        {
          $project: {
            school_object_id: 0,
            pickup_address_object_id: 0,
            driver_user_obj_id: 0,
            driver_user: 0,
          },
        },
      ])
      .toArray();
  }

  async findByIdWithPopulate(studentId: string): Promise<any | null> {
    const collection = this.getCollection();
    const results = await collection
      .aggregate([
        {
          $match: { _id: new ObjectId(studentId) },
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
              {
                $match: {
                  $expr: { $eq: ["$student_id", "$$studentId"] },
                  assignment_status: { $ne: AssignmentStatus.INACTIVE },
                },
              },
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
          $addFields: {
            driver_user_obj_id: {
              $cond: [
                { $ne: ["$driver.user_id", null] },
                { $toObjectId: "$driver.user_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: USERS_COLLECTION,
            localField: "driver_user_obj_id",
            foreignField: "_id",
            as: "driver_user",
          },
        },
        {
          $unwind: {
            path: "$driver_user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            "driver.phone_number": "$driver_user.phone_number",
          },
        },
        {
          $project: {
            school_object_id: 0,
            pickup_address_object_id: 0,
            driver_user_obj_id: 0,
            driver_user: 0,
          },
        },
      ])
      .toArray();
    return results[0] ?? null;
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
