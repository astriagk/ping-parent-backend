import { WithId } from "mongodb";

import {
  AssignmentStatus,
  DRIVERS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  USERS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { DriverStudentAssignment } from "./driver_student_assignment.type";

export class DriverStudentAssignmentRepository extends BaseRepository<DriverStudentAssignment> {
  constructor() {
    super(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION);
  }

  async findByDriverId(
    driverId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({ driver_id: driverId });
  }

  async findByStudentId(
    studentId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({ student_id: studentId });
  }

  async findActiveAssignmentsByDriverId(
    driverId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({
      driver_id: driverId,
      assignment_status: AssignmentStatus.ACTIVE,
    });
  }

  async findActiveAssignmentsByStudentId(
    studentId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({
      student_id: studentId,
      assignment_status: AssignmentStatus.ACTIVE,
    });
  }

  async findPendingAssignmentsByDriverId(
    driverId: string,
  ): Promise<WithId<DriverStudentAssignment>[]> {
    return await this.findMany({
      driver_id: driverId,
      assignment_status: {
        $in: [AssignmentStatus.PENDING, AssignmentStatus.PARENT_REQUESTED],
      },
    });
  }

  async findDuplicateAssignment(
    driverId: string,
    studentId: string,
  ): Promise<WithId<DriverStudentAssignment> | null> {
    return await this.findOne({
      driver_id: driverId,
      student_id: studentId,
      assignment_status: {
        $in: [
          AssignmentStatus.ACTIVE,
          AssignmentStatus.PENDING,
          AssignmentStatus.PARENT_REQUESTED,
        ],
      },
    });
  }

  async findAssignmentByDriverAndStudent(
    driverId: string,
    studentId: string,
  ): Promise<WithId<DriverStudentAssignment> | null> {
    return await this.findOne({
      driver_id: driverId,
      student_id: studentId,
    });
  }

  async findAllWithDetails(): Promise<Record<string, unknown>[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        {
          $lookup: {
            from: DRIVERS_COLLECTION,
            let: { driverId: { $toObjectId: "$driver_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$driverId"] } } }],
            as: "driver",
          },
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
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
        { $unwind: { path: "$driver_user", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { studentId: { $toObjectId: "$student_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            parent_obj_id: {
              $cond: [
                { $ne: ["$student.parent_id", null] },
                { $toObjectId: "$student.parent_id" },
                null,
              ],
            },
            school_obj_id: {
              $cond: [
                { $ne: ["$student.school_id", null] },
                { $toObjectId: "$student.school_id" },
                null,
              ],
            },
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
        { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: SCHOOLS_COLLECTION,
            localField: "school_obj_id",
            foreignField: "_id",
            as: "school",
          },
        },
        { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            driver_user_obj_id: 0,
            parent_obj_id: 0,
            school_obj_id: 0,
          },
        },
        {
          $addFields: {
            driver: {
              $cond: {
                if: { $ne: ["$driver", null] },
                then: {
                  driver_id: { $toString: "$driver._id" },
                  name: "$driver.name",
                  driver_unique_id: "$driver.driver_unique_id",
                  vehicle_type: "$driver.vehicle_type",
                  vehicle_number: "$driver.vehicle_number",
                  phone_number: "$driver_user.phone_number",
                },
                else: null,
              },
            },
            student: {
              $cond: {
                if: { $ne: ["$student", null] },
                then: {
                  student_id: { $toString: "$student._id" },
                  student_name: "$student.student_name",
                  class: "$student.class",
                  section: "$student.section",
                },
                else: null,
              },
            },
            parent_name: "$parent.name",
            school_name: "$school.school_name",
          },
        },
        { $project: { driver_user: 0, parent: 0, school: 0 } },
      ])
      .toArray();
  }

  async findByDriverIdWithDetails(
    driverId: string,
  ): Promise<Record<string, unknown>[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        { $match: { driver_id: driverId } },
        {
          $addFields: {
            student_obj_id: {
              $cond: [
                { $ne: ["$student_id", null] },
                { $toObjectId: "$student_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            localField: "student_obj_id",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            school_obj_id: {
              $cond: [
                { $ne: ["$student.school_id", null] },
                { $toObjectId: "$student.school_id" },
                null,
              ],
            },
            parent_obj_id: {
              $cond: [
                { $ne: ["$student.parent_id", null] },
                { $toObjectId: "$student.parent_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: SCHOOLS_COLLECTION,
            localField: "school_obj_id",
            foreignField: "_id",
            as: "school",
          },
        },
        { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: PARENTS_COLLECTION,
            localField: "parent_obj_id",
            foreignField: "_id",
            as: "parent",
          },
        },
        { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
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
        { $unwind: { path: "$parent_user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            assignment_status: 1,
            monthly_fee: 1,
            assigned_date: 1,
            start_date: 1,
            end_date: 1,
            assignment_source: 1,
            created_at: 1,
            updated_at: 1,
            student: {
              $cond: {
                if: { $ne: ["$student", null] },
                then: {
                  student_id: { $toString: "$student._id" },
                  student_name: "$student.student_name",
                  class: "$student.class",
                  photo_url: "$student.photo_url",
                  school_name: "$school.school_name",
                },
                else: null,
              },
            },
            parent: {
              $cond: {
                if: { $ne: ["$parent", null] },
                then: {
                  parent_id: { $toString: "$parent._id" },
                  name: "$parent.name",
                  phone_number: "$parent_user.phone_number",
                },
                else: null,
              },
            },
          },
        },
      ])
      .toArray();
  }

  async findByStudentIdWithDetails(
    studentId: string,
  ): Promise<Record<string, unknown>[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        { $match: { student_id: studentId } },
        {
          $addFields: {
            driver_obj_id: {
              $cond: [
                { $ne: ["$driver_id", null] },
                { $toObjectId: "$driver_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: DRIVERS_COLLECTION,
            localField: "driver_obj_id",
            foreignField: "_id",
            as: "driver",
          },
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
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
        { $unwind: { path: "$driver_user", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            student_obj_id: {
              $cond: [
                { $ne: ["$student_id", null] },
                { $toObjectId: "$student_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            localField: "student_obj_id",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            assignment_status: 1,
            monthly_fee: 1,
            assigned_date: 1,
            start_date: 1,
            end_date: 1,
            assignment_source: 1,
            created_at: 1,
            updated_at: 1,
            driver: {
              $cond: {
                if: { $ne: ["$driver", null] },
                then: {
                  driver_id: { $toString: "$driver._id" },
                  name: "$driver.name",
                  phone_number: "$driver_user.phone_number",
                  rating: "$driver.rating",
                  vehicle_type: "$driver.vehicle_type",
                  vehicle_number: "$driver.vehicle_number",
                  photo_url: "$driver.photo_url",
                },
                else: null,
              },
            },
            student: {
              $cond: {
                if: { $ne: ["$student", null] },
                then: {
                  student_id: { $toString: "$student._id" },
                  student_name: "$student.student_name",
                  class: "$student.class",
                  photo_url: "$student.photo_url",
                },
                else: null,
              },
            },
          },
        },
      ])
      .toArray();
  }

  async findParentRequestedWithDetails(
    matchStage: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: DRIVERS_COLLECTION,
            let: { driverId: { $toObjectId: "$driver_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$driverId"] } } }],
            as: "driver",
          },
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { studentId: { $toObjectId: "$student_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            school_object_id: {
              $cond: [
                { $ne: ["$student.school_id", null] },
                { $toObjectId: "$student.school_id" },
                null,
              ],
            },
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
        { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            pickup_address_object_id: {
              $cond: [
                { $ne: ["$student.pickup_address_id", null] },
                { $toObjectId: "$student.pickup_address_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: PARENT_ADDRESSES_COLLECTION,
            localField: "pickup_address_object_id",
            foreignField: "_id",
            as: "parent_address",
          },
        },
        {
          $unwind: {
            path: "$parent_address",
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

  async findParentRequestedByDriverWithDetails(
    matchStage: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: DRIVERS_COLLECTION,
            let: { driverId: { $toObjectId: "$driver_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$driverId"] } } }],
            as: "driver",
          },
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { studentId: { $toObjectId: "$student_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            school_object_id: {
              $cond: [
                { $ne: ["$student.school_id", null] },
                { $toObjectId: "$student.school_id" },
                null,
              ],
            },
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
        { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            pickup_address_object_id: {
              $cond: [
                { $ne: ["$student.pickup_address_id", null] },
                { $toObjectId: "$student.pickup_address_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: PARENT_ADDRESSES_COLLECTION,
            localField: "pickup_address_object_id",
            foreignField: "_id",
            as: "parent_address",
          },
        },
        {
          $unwind: {
            path: "$parent_address",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            parent_object_id: {
              $cond: [
                { $ne: ["$student.parent_id", null] },
                { $toObjectId: "$student.parent_id" },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: PARENTS_COLLECTION,
            localField: "parent_object_id",
            foreignField: "_id",
            as: "parent",
          },
        },
        { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            parent_user_object_id: {
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
            localField: "parent_user_object_id",
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
        {
          $project: {
            school_object_id: 0,
            pickup_address_object_id: 0,
            parent_object_id: 0,
            parent_user_object_id: 0,
            parent_user: 0,
            "parent.user_id": 0,
          },
        },
      ])
      .toArray();
  }
}

export const driverStudentAssignmentRepository =
  new DriverStudentAssignmentRepository();
