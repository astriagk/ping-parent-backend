import { WithId } from "mongodb";

import {
  DRIVERS_COLLECTION,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
  TripStatus,
  USERS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { Parent, ParentAddress } from "./parent.type";

export class ParentRepository extends BaseRepository<Parent> {
  constructor() {
    super(PARENTS_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<Parent> | null> {
    return await this.findOne({ user_id: userId });
  }

  async createParent(data: Partial<Parent>): Promise<WithId<Parent>> {
    return await this.create(data as any);
  }

  async updateByUserId(
    userId: string,
    data: Partial<Parent>,
  ): Promise<WithId<Parent> | null> {
    return await this.updateOne({ user_id: userId }, { $set: data });
  }

  async updateRawByUserId(
    userId: string,
    update: Record<string, any>,
  ): Promise<WithId<Parent> | null> {
    return await this.updateOne({ user_id: userId }, update as any);
  }

  async findByIdWithDetails(userId: string): Promise<any> {
    const collection = this.getCollection();
    const result = await collection
      .aggregate([
        {
          $match: {
            user_id: userId,
          },
        },
        {
          $lookup: {
            from: USERS_COLLECTION,
            let: { userId: { $toObjectId: "$user_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: PARENT_ADDRESSES_COLLECTION,
            let: { parentId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$parent_id", "$$parentId"] },
                },
              },
            ],
            as: "addresses",
          },
        },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { parentId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$parent_id", "$$parentId"] },
                },
              },
            ],
            as: "students",
          },
        },
        {
          $project: {
            _id: 1,
            parent_id: 1,
            user_id: 1,
            name: 1,
            email: 1,
            photo_url: 1,
            created_at: 1,
            updated_at: 1,
            user: {
              phone_number: "$user.phone_number",
              user_type: "$user.user_type",
              is_active: "$user.is_active",
              fcm_token: "$user.fcm_token",
              last_login: "$user.last_login",
            },
            addresses: 1,
            students: 1,
          },
        },
      ])
      .toArray();

    return result.length > 0 ? result[0] : null;
  }

  async findActiveTripsWithDetails(
    userId: string,
  ): Promise<Record<string, unknown>[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        {
          $match: { user_id: userId },
        },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { parentId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$parent_id", "$$parentId"] },
                },
              },
            ],
            as: "students",
          },
        },
        {
          $facet: {
            parentData: [{ $limit: 1 }],
            studentsWithTrips: [
              {
                $unwind: {
                  path: "$students",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $lookup: {
                  from: TRIP_STUDENTS_COLLECTION,
                  let: { studentId: { $toString: "$students._id" } },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$student_id", "$$studentId"] },
                      },
                    },
                  ],
                  as: "tripStudentRecords",
                },
              },
              {
                $unwind: {
                  path: "$tripStudentRecords",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $lookup: {
                  from: TRIPS_COLLECTION,
                  let: { tripId: "$tripStudentRecords.trip_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [{ $toString: "$_id" }, "$$tripId"],
                        },
                        trip_status: {
                          $in: [TripStatus.STARTED, TripStatus.IN_PROGRESS],
                        },
                      },
                    },
                  ],
                  as: "trip",
                },
              },
              {
                $unwind: {
                  path: "$trip",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $group: {
                  _id: "$trip._id",
                  trip: { $first: "$trip" },
                  students: {
                    $addToSet: {
                      _id: { $toString: "$students._id" },
                      student_name: "$students.student_name",
                      class: "$students.class",
                      section: "$students.section",
                      roll_number: "$students.roll_number",
                      attendance_status:
                        "$tripStudentRecords.attendance_status",
                      pickup_status: "$tripStudentRecords.pickup_status",
                      sequence_order: "$tripStudentRecords.sequence_order",
                    },
                  },
                },
              },
              {
                $lookup: {
                  from: DRIVERS_COLLECTION,
                  let: { driverId: "$trip.driver_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            { $convert: { input: "$_id", to: "string" } },
                            "$$driverId",
                          ],
                        },
                      },
                    },
                  ],
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
                $lookup: {
                  from: USERS_COLLECTION,
                  let: { userId: "$driver.user_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            { $convert: { input: "$_id", to: "string" } },
                            "$$userId",
                          ],
                        },
                      },
                    },
                  ],
                  as: "driverUser",
                },
              },
              {
                $unwind: {
                  path: "$driverUser",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  school_obj_id: {
                    $cond: [
                      { $ne: ["$trip.school_id", null] },
                      { $toObjectId: "$trip.school_id" },
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
              {
                $unwind: {
                  path: "$school",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: "$trip._id",
                  trip_type: "$trip.trip_type",
                  trip_status: "$trip.trip_status",
                  trip_date: "$trip.trip_date",
                  start_time: "$trip.start_time",
                  end_time: "$trip.end_time",
                  driver_id: "$trip.driver_id",
                  school_id: "$trip.school_id",
                  total_distance: "$trip.total_distance",
                  optimized_route_data: "$trip.optimized_route_data",
                  students: 1,
                  driver: {
                    _id: "$driver._id",
                    driver_unique_id: "$driver.driver_unique_id",
                    name: "$driver.name",
                    email: "$driver.email",
                    photo_url: "$driver.photo_url",
                    vehicle_type: "$driver.vehicle_type",
                    vehicle_number: "$driver.vehicle_number",
                    vehicle_capacity: "$driver.vehicle_capacity",
                    current_student_count: "$driver.current_student_count",
                    approval_status: "$driver.approval_status",
                    is_available: "$driver.is_available",
                    rating: "$driver.rating",
                    total_trips: "$driver.total_trips",
                    user: {
                      _id: "$driverUser._id",
                      phone_number: "$driverUser.phone_number",
                      user_type: "$driverUser.user_type",
                      is_active: "$driverUser.is_active",
                    },
                  },
                  school: {
                    $cond: {
                      if: { $ne: ["$school", null] },
                      then: {
                        school_id: { $toString: "$school._id" },
                        school_name: "$school.school_name",
                        address: "$school.address",
                        city: "$school.city",
                      },
                      else: null,
                    },
                  },
                  created_at: "$trip.created_at",
                  updated_at: "$trip.updated_at",
                },
              },
            ],
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $cond: [
                { $eq: [{ $size: "$parentData" }, 0] },
                { error: "PARENT_NOT_FOUND" },
                { trips: "$studentsWithTrips" },
              ],
            },
          },
        },
      ])
      .toArray();
  }

  async findAllTripsWithDetails(
    userId: string,
  ): Promise<Record<string, unknown>[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        {
          $match: { user_id: userId },
        },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { parentId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$parent_id", "$$parentId"] },
                },
              },
            ],
            as: "students",
          },
        },
        {
          $facet: {
            parentData: [{ $limit: 1 }],
            studentsWithTrips: [
              {
                $unwind: {
                  path: "$students",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $lookup: {
                  from: TRIP_STUDENTS_COLLECTION,
                  let: { studentId: { $toString: "$students._id" } },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$student_id", "$$studentId"] },
                      },
                    },
                  ],
                  as: "tripStudentRecords",
                },
              },
              {
                $unwind: {
                  path: "$tripStudentRecords",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $lookup: {
                  from: TRIPS_COLLECTION,
                  let: { tripId: "$tripStudentRecords.trip_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [{ $toString: "$_id" }, "$$tripId"],
                        },
                      },
                    },
                  ],
                  as: "trip",
                },
              },
              {
                $unwind: {
                  path: "$trip",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $group: {
                  _id: "$trip._id",
                  trip: { $first: "$trip" },
                  students: {
                    $addToSet: {
                      _id: { $toString: "$students._id" },
                      student_name: "$students.student_name",
                      class: "$students.class",
                      section: "$students.section",
                      roll_number: "$students.roll_number",
                      attendance_status:
                        "$tripStudentRecords.attendance_status",
                      pickup_status: "$tripStudentRecords.pickup_status",
                      sequence_order: "$tripStudentRecords.sequence_order",
                    },
                  },
                },
              },
              {
                $sort: { "trip.trip_date": -1 },
              },
              {
                $lookup: {
                  from: DRIVERS_COLLECTION,
                  let: { driverId: "$trip.driver_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            { $convert: { input: "$_id", to: "string" } },
                            "$$driverId",
                          ],
                        },
                      },
                    },
                  ],
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
                $lookup: {
                  from: USERS_COLLECTION,
                  let: { userId: "$driver.user_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            { $convert: { input: "$_id", to: "string" } },
                            "$$userId",
                          ],
                        },
                      },
                    },
                  ],
                  as: "driverUser",
                },
              },
              {
                $unwind: {
                  path: "$driverUser",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  school_obj_id: {
                    $cond: [
                      { $ne: ["$trip.school_id", null] },
                      { $toObjectId: "$trip.school_id" },
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
              {
                $unwind: {
                  path: "$school",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: "$trip._id",
                  trip_type: "$trip.trip_type",
                  trip_status: "$trip.trip_status",
                  trip_date: "$trip.trip_date",
                  start_time: "$trip.start_time",
                  end_time: "$trip.end_time",
                  driver_id: "$trip.driver_id",
                  school_id: "$trip.school_id",
                  total_distance: "$trip.total_distance",
                  optimized_route_data: "$trip.optimized_route_data",
                  students: 1,
                  driver: {
                    _id: "$driver._id",
                    driver_unique_id: "$driver.driver_unique_id",
                    name: "$driver.name",
                    email: "$driver.email",
                    photo_url: "$driver.photo_url",
                    vehicle_type: "$driver.vehicle_type",
                    vehicle_number: "$driver.vehicle_number",
                    vehicle_capacity: "$driver.vehicle_capacity",
                    current_student_count: "$driver.current_student_count",
                    approval_status: "$driver.approval_status",
                    is_available: "$driver.is_available",
                    rating: "$driver.rating",
                    total_trips: "$driver.total_trips",
                    user: {
                      _id: "$driverUser._id",
                      phone_number: "$driverUser.phone_number",
                      user_type: "$driverUser.user_type",
                      is_active: "$driverUser.is_active",
                    },
                  },
                  school: {
                    $cond: {
                      if: { $ne: ["$school", null] },
                      then: {
                        school_id: { $toString: "$school._id" },
                        school_name: "$school.school_name",
                        address: "$school.address",
                        city: "$school.city",
                      },
                      else: null,
                    },
                  },
                  created_at: "$trip.created_at",
                  updated_at: "$trip.updated_at",
                },
              },
            ],
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $cond: [
                { $eq: [{ $size: "$parentData" }, 0] },
                { error: "PARENT_NOT_FOUND" },
                { trips: "$studentsWithTrips" },
              ],
            },
          },
        },
      ])
      .toArray();
  }
}

export class ParentAddressRepository extends BaseRepository<ParentAddress> {
  constructor() {
    super(PARENT_ADDRESSES_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<ParentAddress> | null> {
    // Find parent first to get parent_id
    const parentRepo = new ParentRepository();
    const parent = await parentRepo.findByUserId(userId);
    if (!parent || !parent._id) return null;

    const parentId = String(parent._id);
    return await this.findOne({ parent_id: parentId, is_primary: true });
  }

  async upsertByUserId(
    userId: string,
    data: Partial<ParentAddress>,
  ): Promise<boolean> {
    const parentRepo = new ParentRepository();
    const parent = await parentRepo.findByUserId(userId);
    if (!parent || !parent._id) return false;

    const parentId = String(parent._id);
    const existing = await this.findOne({
      parent_id: parentId,
      is_primary: true,
    });

    if (existing) {
      const result = await this.updateOne(
        { parent_id: parentId, is_primary: true },
        { $set: { ...data, updated_at: new Date() } },
      );
      return !!result;
    } else {
      await this.create({
        ...data,
        parent_id: parentId,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
      return true;
    }
  }
}

export const parentRepository = new ParentRepository();
export const parentAddressRepository = new ParentAddressRepository();
