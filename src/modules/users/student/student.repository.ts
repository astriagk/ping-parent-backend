import { ObjectId, WithId } from "mongodb";

import {
  AssignmentStatus,
  DRIVERS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  SCHOOL_STUDENT_CODES_COLLECTION,
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

  async findBySchoolIdWithDetails(schoolId: string): Promise<any[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        {
          $match: { school_id: schoolId },
        },
        // Join parent
        {
          $addFields: {
            parent_obj_id: { $toObjectId: "$parent_id" },
          },
        },
        {
          $lookup: {
            from: PARENTS_COLLECTION,
            localField: "parent_obj_id",
            foreignField: "_id",
            as: "parent",
          },
        },
        {
          $unwind: {
            path: "$parent",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Join parent user for phone number
        {
          $addFields: {
            parent_user_obj_id: {
              $cond: [
                { $ne: ["$parent.user_id", null] },
                { $toObjectId: "$parent.user_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: USERS_COLLECTION,
            localField: "parent_user_obj_id",
            foreignField: "_id",
            as: "parent_user",
          },
        },
        {
          $unwind: {
            path: "$parent_user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            "parent.phone_number": "$parent_user.phone_number",
          },
        },
        // Join active driver assignment
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
        // Join driver
        {
          $lookup: {
            from: DRIVERS_COLLECTION,
            let: {
              driverId: {
                $cond: [
                  { $ne: ["$driver_assignment.driver_id", null] },
                  { $toObjectId: "$driver_assignment.driver_id" },
                  null,
                ],
              },
            },
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
        // Join driver user for phone number
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
        // Join redemption code for this student
        {
          $lookup: {
            from: SCHOOL_STUDENT_CODES_COLLECTION,
            let: { studentId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$student_id", "$$studentId"] },
                },
              },
              { $sort: { created_at: -1 } },
              { $limit: 1 },
            ],
            as: "redemption_code_doc",
          },
        },
        {
          $unwind: {
            path: "$redemption_code_doc",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Shape final output
        {
          $addFields: {
            parent: {
              $cond: {
                if: { $ne: ["$parent", null] },
                then: {
                  parent_id: { $toString: "$parent._id" },
                  name: "$parent.name",
                  email: "$parent.email",
                  photo_url: "$parent.photo_url",
                  phone_number: "$parent_user.phone_number",
                },
                else: null,
              },
            },
            driver_assignment: {
              $cond: {
                if: { $ne: ["$driver_assignment", null] },
                then: {
                  assignment_id: { $toString: "$driver_assignment._id" },
                  assignment_status: "$driver_assignment.assignment_status",
                  assignment_source: "$driver_assignment.assignment_source",
                  monthly_fee: "$driver_assignment.monthly_fee",
                  assigned_date: "$driver_assignment.assigned_date",
                  driver: {
                    $cond: {
                      if: { $ne: ["$driver", null] },
                      then: {
                        driver_id: { $toString: "$driver._id" },
                        name: "$driver.name",
                        phone_number: "$driver_user.phone_number",
                        vehicle_type: "$driver.vehicle_type",
                        vehicle_number: "$driver.vehicle_number",
                        driver_unique_id: "$driver.driver_unique_id",
                      },
                      else: null,
                    },
                  },
                },
                else: null,
              },
            },
            redemption_code: {
              $cond: {
                if: { $ne: ["$redemption_code_doc", null] },
                then: {
                  code: "$redemption_code_doc.code",
                  is_redeemed: "$redemption_code_doc.is_redeemed",
                  end_date: "$redemption_code_doc.end_date",
                  redeemed_at: "$redemption_code_doc.redeemed_at",
                },
                else: null,
              },
            },
          },
        },
        {
          $project: {
            parent_obj_id: 0,
            parent_user_obj_id: 0,
            parent_user: 0,
            driver: 0,
            driver_user_obj_id: 0,
            driver_user: 0,
            redemption_code_doc: 0,
          },
        },
      ])
      .toArray();
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
