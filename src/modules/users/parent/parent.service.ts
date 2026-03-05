import { ObjectId } from "mongodb";

import { User } from "@modules/auth/auth.type";
import { getDB } from "@shared/config";
import {
  DRIVERS_COLLECTION,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
  TripStatus,
  USERS_COLLECTION,
} from "@shared/constants";
import { HTTP_STATUS } from "@shared/constants";
import { ERROR_MESSAGES } from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { Parent, ParentAddress, ParentAddressInput } from "./parent.type";

/**
 * Get parent profile by user_id
 * Returns combined data from users and parents tables
 */
export const getParentProfile = async (
  userId: string,
): Promise<(Parent & { user?: User }) | null> => {
  const db = await getDB();

  // Query users collection
  const userQuery: any = {
    _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
  };

  const user = await db.collection(USERS_COLLECTION).findOne(userQuery);

  if (!user) {
    return null;
  }

  // Query parents collection by user_id
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    return null;
  }

  // Return combined profile
  return {
    ...parent,
    user: {
      phone_number: user.phone_number,
      user_type: user.user_type,
      is_active: user.is_active,
      fcm_token: user.fcm_token,
      last_login: user.last_login,
    } as User,
  } as Parent & { user?: User };
};

/**
 * Update parent profile in parents table
 */
export const updateParentProfile = async (
  userId: string,
  updates: Partial<Parent>,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // Remove fields that shouldn't be updated
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, user_id, ...sanitizedUpdates } = updates;

    // Find parent by user_id
    const result = await db.collection(PARENTS_COLLECTION).updateOne(
      { user_id: userId },
      {
        $set: { ...sanitizedUpdates, updated_at: new Date() },
      },
    );

    return result.modifiedCount > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Create parent profile in parents table
 * Called after user is created during registration
 */
export const createParentProfile = async (
  userId: string,
  parentData: Partial<Parent>,
): Promise<boolean> => {
  try {
    const db = await getDB();

    const newParent = {
      user_id: userId,
      name: parentData.name || "",
      email: parentData.email,
      photo_url: parentData.photo_url,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection(PARENTS_COLLECTION).insertOne(newParent);
    return !!result.insertedId;
  } catch (error) {
    return false;
  }
};

/**
 * Check if parent profile exists for a user
 */
export const parentProfileExists = async (userId: string): Promise<boolean> => {
  const db = await getDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });
  return !!parent;
};

/**
 * Upsert address by user_id (finds parent first, then updates/creates address)
 */
export const upsertAddressByUserId = async (
  userId: string,
  address: ParentAddressInput,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // First, find the parent_id from the parents collection
    const parent = await db
      .collection(PARENTS_COLLECTION)
      .findOne({ user_id: userId });

    if (!parent) {
      return false;
    }

    const parentId = String(parent._id);

    // Try to update existing primary address first
    const updateResult = await db
      .collection(PARENT_ADDRESSES_COLLECTION)
      .updateOne(
        { parent_id: parentId, is_primary: true },
        {
          $set: {
            address_line1: address.address_line1,
            address_line2: address.address_line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: address.latitude,
            longitude: address.longitude,
            updated_at: new Date(),
          },
        },
      );

    // If no existing address found, create a new one
    if (updateResult.matchedCount === 0) {
      const newAddress = {
        parent_id: parentId,
        address_line1: address.address_line1,
        address_line2: address.address_line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        latitude: address.latitude,
        longitude: address.longitude,
        is_primary:
          address.is_primary !== undefined ? address.is_primary : true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const insertResult = await db
        .collection(PARENT_ADDRESSES_COLLECTION)
        .insertOne(newAddress);
      return !!insertResult.insertedId;
    }

    return updateResult.modifiedCount > 0;
  } catch {
    return false;
  }
};

/**
 * Get primary address by user_id (finds parent first, then gets address)
 */
export const getAddressByUserId = async (
  userId: string,
): Promise<ParentAddress | null> => {
  try {
    const db = await getDB();

    // First, find the parent_id from the parents collection
    const parent = await db
      .collection(PARENTS_COLLECTION)
      .findOne({ user_id: userId });

    if (!parent) {
      return null;
    }

    const parentId = String(parent._id);

    // Get the primary address for this parent
    const address = await db
      .collection(PARENT_ADDRESSES_COLLECTION)
      .findOne({ parent_id: parentId, is_primary: true });

    return address as ParentAddress | null;
  } catch {
    return null;
  }
};

/**
 * Get complete parent details by parent_id (for admin verification)
 * Includes parent info, user info, addresses, and students
 */
export const getCompleteParentDetailsById = async (
  parentId: string,
): Promise<any> => {
  try {
    const db = await getDB();
    console.log(parentId);
    const result = await db
      .collection(PARENTS_COLLECTION)
      .aggregate([
        {
          $match: {
            user_id: parentId,
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
  } catch (_) {
    return null;
  }
};

/**
 * Get active trips for a parent's children
 * Uses aggregation pipeline for efficient querying
 * Flow: user_id -> parent_id -> students -> trip_students -> trips (with status = in_progress/started)
 */
export const getParentActiveTrips = async (userId: string): Promise<any[]> => {
  const db = await getDB();

  const result = await db
    .collection(PARENTS_COLLECTION)
    .aggregate([
      // Match parent by user_id
      {
        $match: { user_id: userId },
      },
      // Lookup students for this parent
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
      // Check if parent exists (parent is the starting point)
      {
        $facet: {
          parentData: [{ $limit: 1 }],
          studentsWithTrips: [
            // If no students, this will be empty
            {
              $unwind: {
                path: "$students",
                preserveNullAndEmptyArrays: false,
              },
            },
            // Lookup trip_students for each student
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
            // Lookup trips with status filter
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
            // Group by trip to consolidate students
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
                  },
                },
              },
            },
            // Lookup driver details by driver_id with user data
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
            // Lookup user details for driver by user_id
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
            // Shape the final response for active trips
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
                created_at: "$trip.created_at",
                updated_at: "$trip.updated_at",
              },
            },
          ],
        },
      },
      // Check if parent was found
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

  const faceTResult = result[0];

  if (faceTResult.error === "PARENT_NOT_FOUND") {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT?.PARENT_PROFILE_NOT_FOUND || "Parent not found",
    );
  }

  return faceTResult.trips || [];
};

/**
 * Get all trips (active + completed) for a parent's children
 * Uses aggregation pipeline for efficient querying
 */
export const getParentAllTrips = async (userId: string): Promise<any[]> => {
  const db = await getDB();

  const result = await db
    .collection(PARENTS_COLLECTION)
    .aggregate([
      // Match parent by user_id
      {
        $match: { user_id: userId },
      },
      // Lookup students for this parent
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
      // Check if parent exists and has students
      {
        $facet: {
          parentData: [{ $limit: 1 }],
          studentsWithTrips: [
            // If no students, this will be empty
            {
              $unwind: {
                path: "$students",
                preserveNullAndEmptyArrays: false,
              },
            },
            // Lookup trip_students for each student
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
            // Lookup all trips (no status filter)
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
            // Group by trip to consolidate students
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
                  },
                },
              },
            },
            // Sort by trip_date descending
            {
              $sort: { "trip.trip_date": -1 },
            },
            // Lookup driver details by driver_id with user data
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
            // Lookup user details for driver by user_id
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
            // Shape the final response for all trips
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
                created_at: "$trip.created_at",
                updated_at: "$trip.updated_at",
              },
            },
          ],
        },
      },
      // Check if parent was found
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

  const facetResult = result[0];

  if (facetResult.error === "PARENT_NOT_FOUND") {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT?.PARENT_PROFILE_NOT_FOUND || "Parent not found",
    );
  }

  return facetResult.trips || [];
};
