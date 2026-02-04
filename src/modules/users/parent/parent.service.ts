import { ObjectId } from "mongodb";

import { User } from "@modules/auth/auth.type";
import { getDB } from "@shared/config";
import {
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
    const { _id, parent_id, user_id, ...sanitizedUpdates } = updates;

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

    const result = await db
      .collection(PARENTS_COLLECTION)
      .aggregate([
        {
          $match: {
            _id: ObjectId.isValid(parentId) ? new ObjectId(parentId) : parentId,
          },
        },
        {
          $lookup: {
            from: USERS_COLLECTION,
            localField: "user_id",
            foreignField: "user_id",
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
 * Flow: user_id -> parent_id -> students -> trip_students -> trips (with status = in_progress/started)
 */
export const getParentActiveTrips = async (userId: string): Promise<any[]> => {
  const db = await getDB();

  // Step 1: Get parent_id from user_id
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT?.PARENT_PROFILE_NOT_FOUND || "Parent not found",
    );
  }

  const parentId = parent.parent_id || String(parent._id);

  // Step 2: Get all students for this parent
  const students = await db
    .collection(STUDENTS_COLLECTION)
    .find({ parent_id: parentId })
    .toArray();

  if (students.length === 0) {
    return []; // Parent has no students
  }

  const studentIds = students.map((s) => s.student_id || String(s._id));

  // Step 3: Get trip_students records for these students
  const tripStudents = await db
    .collection(TRIP_STUDENTS_COLLECTION)
    .find({ student_id: { $in: studentIds } })
    .toArray();

  if (tripStudents.length === 0) {
    return []; // No trips assigned to these students
  }

  const tripIds = tripStudents.map((ts) => ts.trip_id);

  // Step 4: Get active trips
  const activeTrips = await db
    .collection(TRIPS_COLLECTION)
    .find({
      trip_id: { $in: tripIds },
      trip_status: { $in: [TripStatus.STARTED, TripStatus.IN_PROGRESS] },
    })
    .toArray();

  // Step 5: Enrich trips with student info
  const enrichedTrips = activeTrips.map((trip) => {
    const tripStudentRecords = tripStudents.filter(
      (ts) => ts.trip_id === trip.trip_id,
    );
    const tripStudentIds = tripStudentRecords.map((ts) => ts.student_id);
    const tripStudentsData = students.filter((s) =>
      tripStudentIds.includes(s.student_id || String(s._id)),
    );

    return {
      _id: trip._id,
      trip_id: trip.trip_id,
      trip_type: trip.trip_type,
      trip_status: trip.trip_status,
      trip_date: trip.trip_date,
      start_time: trip.start_time,
      end_time: trip.end_time,
      driver_id: trip.driver_id,
      school_id: trip.school_id,
      total_distance: trip.total_distance,
      optimized_route_data: trip.optimized_route_data,
      students: tripStudentsData.map((s) => ({
        student_id: s.student_id || String(s._id),
        student_name: s.student_name,
        class: s.class,
        section: s.section,
        roll_number: s.roll_number,
      })),
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    };
  });

  return enrichedTrips;
};

/**
 * Get all trips (active + completed) for a parent's children
 */
export const getParentAllTrips = async (userId: string): Promise<any[]> => {
  const db = await getDB();

  // Step 1: Get parent_id from user_id
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT?.PARENT_PROFILE_NOT_FOUND || "Parent not found",
    );
  }

  const parentId = parent.parent_id || String(parent._id);

  // Step 2: Get all students for this parent
  const students = await db
    .collection(STUDENTS_COLLECTION)
    .find({ parent_id: parentId })
    .toArray();

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((s) => s.student_id || String(s._id));

  // Step 3: Get trip_students records for these students
  const tripStudents = await db
    .collection(TRIP_STUDENTS_COLLECTION)
    .find({ student_id: { $in: studentIds } })
    .toArray();

  if (tripStudents.length === 0) {
    return [];
  }

  const tripIds = tripStudents.map((ts) => ts.trip_id);

  // Step 4: Get all trips (not filtering by status)
  const trips = await db
    .collection(TRIPS_COLLECTION)
    .find({ trip_id: { $in: tripIds } })
    .sort({ trip_date: -1 })
    .toArray();

  // Step 5: Enrich trips with student info
  const enrichedTrips = trips.map((trip) => {
    const tripStudentRecords = tripStudents.filter(
      (ts) => ts.trip_id === trip.trip_id,
    );
    const tripStudentIds = tripStudentRecords.map((ts) => ts.student_id);
    const tripStudentsData = students.filter((s) =>
      tripStudentIds.includes(s.student_id || String(s._id)),
    );

    return {
      _id: trip._id,
      trip_id: trip.trip_id,
      trip_type: trip.trip_type,
      trip_status: trip.trip_status,
      trip_date: trip.trip_date,
      start_time: trip.start_time,
      end_time: trip.end_time,
      driver_id: trip.driver_id,
      school_id: trip.school_id,
      total_distance: trip.total_distance,
      optimized_route_data: trip.optimized_route_data,
      students: tripStudentsData.map((s) => ({
        student_id: s.student_id || String(s._id),
        student_name: s.student_name,
        class: s.class,
        section: s.section,
        roll_number: s.roll_number,
      })),
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    };
  });

  return enrichedTrips;
};
