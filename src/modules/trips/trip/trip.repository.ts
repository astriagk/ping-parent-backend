import { ObjectId, WithId } from "mongodb";

import {
  DRIVERS_COLLECTION,
  LOCATION_TRACKING_COLLECTION,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
  TripStatus,
  TripType,
  USERS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { CompletedTripDetails, Trip } from "./trip.type";

export class TripRepository extends BaseRepository<Trip> {
  constructor() {
    super(TRIPS_COLLECTION);
  }

  async findByDriverId(driverId: string): Promise<WithId<Trip>[]> {
    return await this.findMany({ driver_id: driverId });
  }

  async findBySchoolId(schoolId: string): Promise<WithId<Trip>[]> {
    return await this.findMany({ school_id: schoolId });
  }

  async findByDriverIdAndDate(
    driverId: string,
    tripDate: Date,
  ): Promise<WithId<Trip>[]> {
    const startOfDay = new Date(tripDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(tripDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return await this.findMany({
      driver_id: driverId,
      trip_date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  async findByStatus(status: TripStatus): Promise<WithId<Trip>[]> {
    return await this.findMany({ trip_status: status });
  }

  async findDuplicateTrip(
    driverId: string,
    tripType: TripType,
    tripDate: Date,
  ): Promise<WithId<Trip> | null> {
    const startOfDay = new Date(tripDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(tripDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return await this.findOne({
      driver_id: driverId,
      trip_type: tripType,
      trip_date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  async findActiveTrips(driverId: string): Promise<WithId<Trip>[]> {
    return await this.findMany({
      driver_id: driverId,
      trip_status: {
        $in: [TripStatus.SCHEDULED, TripStatus.STARTED, TripStatus.IN_PROGRESS],
      },
    });
  }

  async findByIdWithDetails(
    id: string,
  ): Promise<Record<string, unknown> | null> {
    const collection = this.getCollection();
    const results = await collection
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $addFields: {
            school_obj_id: { $toObjectId: "$school_id" },
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
            from: TRIP_STUDENTS_COLLECTION,
            let: { tripIdStr: { $toString: "$_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$trip_id", "$$tripIdStr"] } } },
              {
                $addFields: {
                  student_obj_id: { $toObjectId: "$student_id" },
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
              {
                $unwind: { path: "$student", preserveNullAndEmptyArrays: true },
              },
              {
                $addFields: {
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
                  from: PARENTS_COLLECTION,
                  localField: "parent_obj_id",
                  foreignField: "_id",
                  as: "parent",
                },
              },
              {
                $unwind: { path: "$parent", preserveNullAndEmptyArrays: true },
              },
              {
                $addFields: {
                  parent_user_obj_id: {
                    $cond: [
                      { $ne: ["$parent.user_id", null] },
                      { $toObjectId: "$parent.user_id" },
                      null,
                    ],
                  },
                  pickup_address_obj_id: {
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
                $lookup: {
                  from: PARENT_ADDRESSES_COLLECTION,
                  localField: "pickup_address_obj_id",
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
              { $sort: { sequence_order: 1 } },
              {
                $project: {
                  _id: 0,
                  trip_student_id: { $toString: "$_id" },
                  student_id: "$student_id",
                  student_name: "$student.student_name",
                  parent_phone_number: "$parent_user.phone_number",
                  pickup_address: "$pickup_address.full_address",
                  sequence_order: "$sequence_order",
                  attendance_status: "$attendance_status",
                  pickup_status: "$pickup_status",
                },
              },
            ],
            as: "trip_students",
          },
        },
        {
          $project: {
            _id: 1,
            driver_id: 1,
            school_id: 1,
            trip_type: 1,
            trip_date: 1,
            trip_status: 1,
            start_time: 1,
            end_time: 1,
            total_distance: 1,
            optimized_route_data: 1,
            route_provider: 1,
            created_at: 1,
            updated_at: 1,
            student_count: { $size: "$trip_students" },
            trip_students: 1,
            school: {
              $cond: {
                if: { $ne: ["$school", null] },
                then: {
                  school_id: { $toString: "$school._id" },
                  school_name: "$school.school_name",
                  address: "$school.address",
                  city: "$school.city",
                  latitude: "$school.latitude",
                  longitude: "$school.longitude",
                },
                else: null,
              },
            },
          },
        },
      ])
      .toArray();

    return results[0] ?? null;
  }

  async findAllWithDetails(
    statuses?: string[],
  ): Promise<Record<string, unknown>[]> {
    const collection = this.getCollection();

    const pipeline: object[] = [];

    if (statuses && statuses.length > 0) {
      pipeline.push({ $match: { trip_status: { $in: statuses } } });
    }

    pipeline.push(
      {
        $addFields: {
          driver_obj_id: { $toObjectId: "$driver_id" },
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
          school_obj_id: {
            $cond: [
              {
                $ne: [{ $ifNull: ["$school_id", "$driver.school_id"] }, null],
              },
              {
                $toObjectId: {
                  $ifNull: ["$school_id", "$driver.school_id"],
                },
              },
              null,
            ],
          },
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
      { $unwind: { path: "$driver_user", preserveNullAndEmptyArrays: true } },
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
          from: TRIP_STUDENTS_COLLECTION,
          let: { tripIdStr: { $toString: "$_id" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$trip_id", "$$tripIdStr"] } } },
            {
              $addFields: {
                student_obj_id: { $toObjectId: "$student_id" },
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
                parent_obj_id: {
                  $cond: [
                    { $ne: ["$student.parent_id", null] },
                    { $toObjectId: "$student.parent_id" },
                    null,
                  ],
                },
                pickup_address_obj_id: {
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
            {
              $unwind: {
                path: "$parent_user",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: PARENT_ADDRESSES_COLLECTION,
                localField: "pickup_address_obj_id",
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
            { $sort: { sequence_order: 1 } },
            {
              $group: {
                _id: "$student.parent_id",
                parent_id: { $first: { $toString: "$parent._id" } },
                parent_name: { $first: "$parent.name" },
                parent_phone: { $first: "$parent_user.phone_number" },
                pickup_address: { $first: "$pickup_address.full_address" },
                students: {
                  $push: {
                    trip_student_id: { $toString: "$_id" },
                    student_id: "$student_id",
                    student_name: "$student.student_name",
                    attendance_status: "$attendance_status",
                    pickup_status: "$pickup_status",
                    sequence_order: "$sequence_order",
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                parent_id: 1,
                parent_name: 1,
                parent_phone: 1,
                pickup_address: 1,
                students: 1,
              },
            },
          ],
          as: "students_by_parent",
        },
      },
      {
        $lookup: {
          from: LOCATION_TRACKING_COLLECTION,
          let: { tripIdStr: { $toString: "$_id" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$trip_id", "$$tripIdStr"] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 0,
                latitude: 1,
                longitude: 1,
                speed: 1,
                heading: 1,
                accuracy: 1,
                timestamp: 1,
              },
            },
          ],
          as: "current_position_arr",
        },
      },
      {
        $project: {
          _id: 1,
          driver_id: 1,
          school_id: 1,
          trip_type: 1,
          trip_date: 1,
          trip_status: 1,
          start_time: 1,
          end_time: 1,
          total_distance: 1,
          created_at: 1,
          updated_at: 1,
          student_count: {
            $reduce: {
              input: "$students_by_parent",
              initialValue: 0,
              in: { $add: ["$$value", { $size: "$$this.students" }] },
            },
          },
          students_by_parent: 1,
          current_position: {
            $ifNull: [{ $arrayElemAt: ["$current_position_arr", 0] }, null],
          },
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
          school: {
            $cond: {
              if: { $ne: ["$school", null] },
              then: {
                school_id: { $toString: "$school._id" },
                school_name: "$school.school_name",
                city: "$school.city",
              },
              else: { school_id: null },
            },
          },
        },
      },
    );

    return await collection.aggregate(pipeline).toArray();
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
            school_obj_id: { $toObjectId: "$school_id" },
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
            from: TRIP_STUDENTS_COLLECTION,
            let: { tripIdStr: { $toString: "$_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$trip_id", "$$tripIdStr"] } } },
              {
                $addFields: {
                  student_obj_id: { $toObjectId: "$student_id" },
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
              {
                $unwind: { path: "$student", preserveNullAndEmptyArrays: true },
              },
              {
                $addFields: {
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
                  from: PARENTS_COLLECTION,
                  localField: "parent_obj_id",
                  foreignField: "_id",
                  as: "parent",
                },
              },
              {
                $unwind: { path: "$parent", preserveNullAndEmptyArrays: true },
              },
              {
                $addFields: {
                  parent_user_obj_id: {
                    $cond: [
                      { $ne: ["$parent.user_id", null] },
                      { $toObjectId: "$parent.user_id" },
                      null,
                    ],
                  },
                  pickup_address_obj_id: {
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
                $lookup: {
                  from: PARENT_ADDRESSES_COLLECTION,
                  localField: "pickup_address_obj_id",
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
              { $sort: { sequence_order: 1 } },
              {
                $project: {
                  _id: 0,
                  trip_student_id: { $toString: "$_id" },
                  student_id: "$student_id",
                  student_name: "$student.student_name",
                  parent_phone_number: "$parent_user.phone_number",
                  pickup_address: "$pickup_address.full_address",
                  sequence_order: "$sequence_order",
                  attendance_status: "$attendance_status",
                  pickup_status: "$pickup_status",
                },
              },
            ],
            as: "trip_students",
          },
        },
        {
          $project: {
            _id: 1,
            driver_id: 1,
            school_id: 1,
            trip_type: 1,
            trip_date: 1,
            trip_status: 1,
            start_time: 1,
            end_time: 1,
            total_distance: 1,
            optimized_route_data: 1,
            route_provider: 1,
            created_at: 1,
            updated_at: 1,
            student_count: { $size: "$trip_students" },
            trip_students: 1,
            school: {
              $cond: {
                if: { $ne: ["$school", null] },
                then: {
                  school_id: { $toString: "$school._id" },
                  school_name: "$school.school_name",
                  address: "$school.address",
                  city: "$school.city",
                  latitude: "$school.latitude",
                  longitude: "$school.longitude",
                },
                else: null,
              },
            },
          },
        },
        { $sort: { trip_date: -1 } },
      ])
      .toArray();
  }

  async findCompletedTripWithDetails(
    tripId: string,
  ): Promise<CompletedTripDetails | null> {
    const collection = this.getCollection();
    const result = await collection
      .aggregate<CompletedTripDetails>([
        { $match: { _id: new ObjectId(tripId) } },
        {
          $lookup: {
            from: TRIP_STUDENTS_COLLECTION,
            let: { tripId: { $toString: "$_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$trip_id", "$$tripId"] } } },
            ],
            as: "tripStudents",
          },
        },
        {
          $unwind: {
            path: "$tripStudents",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { studentId: { $toObjectId: "$tripStudents.student_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
            as: "studentDetails",
          },
        },
        {
          $unwind: {
            path: "$studentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: PARENTS_COLLECTION,
            let: { parentId: { $toObjectId: "$studentDetails.parent_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$parentId"] } } }],
            as: "parentDetails",
          },
        },
        {
          $unwind: {
            path: "$parentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: USERS_COLLECTION,
            let: { userId: { $toObjectId: "$parentDetails.user_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            trip_id: { $first: { $toString: "$_id" } },
            driver_id: { $first: "$driver_id" },
            school_id: { $first: "$school_id" },
            trip_type: { $first: "$trip_type" },
            trip_date: { $first: "$trip_date" },
            trip_status: { $first: "$trip_status" },
            start_time: { $first: "$start_time" },
            end_time: { $first: "$end_time" },
            total_distance: { $first: "$total_distance" },
            created_at: { $first: "$created_at" },
            students: {
              $push: {
                $cond: {
                  if: { $ne: ["$tripStudents", null] },
                  then: {
                    trip_student_id: { $toString: "$tripStudents._id" },
                    student_id: "$tripStudents.student_id",
                    student_name: "$studentDetails.student_name",
                    student_class: "$studentDetails.class",
                    student_section: "$studentDetails.section",
                    student_roll_number: "$studentDetails.roll_number",
                    student_photo_url: "$studentDetails.photo_url",
                    student_gender: "$studentDetails.gender",
                    attendance_status: "$tripStudents.attendance_status",
                    pickup_status: "$tripStudents.pickup_status",
                    pickup_time: "$tripStudents.pickup_time",
                    drop_time: "$tripStudents.drop_time",
                    parent: {
                      parent_id: { $toString: "$parentDetails._id" },
                      name: "$parentDetails.name",
                      email: "$parentDetails.email",
                      photo_url: "$parentDetails.photo_url",
                      phone_number: "$userDetails.phone_number",
                    },
                  },
                  else: "$$REMOVE",
                },
              },
            },
          },
        },
        {
          $project: {
            trip_id: 1,
            driver_id: 1,
            school_id: 1,
            trip_type: 1,
            trip_date: 1,
            trip_status: 1,
            start_time: 1,
            end_time: 1,
            total_distance: 1,
            created_at: 1,
            students: 1,
          },
        },
      ])
      .toArray();

    return result[0] ?? null;
  }
}

export const tripRepository = new TripRepository();
