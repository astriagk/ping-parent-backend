import { ObjectId, WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  LOCATION_TRACKING_COLLECTION,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
  USERS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { LocationTracking, StudentWaypoint } from "./tracking.type";

class TrackingRepository extends BaseRepository<LocationTracking> {
  constructor() {
    super(LOCATION_TRACKING_COLLECTION);
  }

  async getTrackingByTripId(
    tripId: string,
  ): Promise<WithId<LocationTracking>[]> {
    const db = await getDB();
    return db
      .collection(LOCATION_TRACKING_COLLECTION)
      .find({ trip_id: tripId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray() as Promise<WithId<LocationTracking>[]>;
  }

  async getLatestTrackingByTripId(
    tripId: string,
  ): Promise<WithId<LocationTracking> | null> {
    const db = await getDB();
    return db
      .collection(LOCATION_TRACKING_COLLECTION)
      .findOne(
        { trip_id: tripId },
        { sort: { timestamp: -1 } },
      ) as Promise<WithId<LocationTracking> | null>;
  }

  async getTrackingByDriverId(
    driverId: string,
    limit: number = 50,
  ): Promise<WithId<LocationTracking>[]> {
    const db = await getDB();
    return db
      .collection(LOCATION_TRACKING_COLLECTION)
      .find({ driver_id: driverId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray() as Promise<WithId<LocationTracking>[]>;
  }

  async insertTracking(
    tracking: Omit<LocationTracking, "_id">,
  ): Promise<WithId<LocationTracking>> {
    const db = await getDB();
    const result = await db
      .collection(LOCATION_TRACKING_COLLECTION)
      .insertOne(tracking as any);

    return {
      _id: result.insertedId,
      ...tracking,
    } as WithId<LocationTracking>;
  }

  async upsertTracking(
    tripId: string,
    tracking: Omit<LocationTracking, "_id">,
  ): Promise<WithId<LocationTracking>> {
    const db = await getDB();
    const result = await db
      .collection(LOCATION_TRACKING_COLLECTION)
      .findOneAndUpdate(
        { trip_id: tripId },
        {
          $set: tracking,
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      );

    // If result.value is null, fetch the document directly
    if (result?.value) {
      return result.value as WithId<LocationTracking>;
    }

    const doc = await db
      .collection(LOCATION_TRACKING_COLLECTION)
      .findOne({ trip_id: tripId });

    if (!doc) {
      throw new Error(`Failed to upsert tracking for trip: ${tripId}`);
    }

    return doc as WithId<LocationTracking>;
  }

  async updateTripRouteData(
    tripId: string,
    routeData: any,
    totalDistance: number,
  ): Promise<void> {
    const db = await getDB();
    await db.collection(TRIPS_COLLECTION).updateOne(
      { _id: new ObjectId(tripId) },
      {
        $set: {
          optimized_route_data: routeData,
          total_distance: totalDistance,
          updated_at: new Date(),
        },
      },
    );
  }

  async updateTripStudentsSequence(
    tripId: string,
    updates: {
      student_id: string;
      sequence_order: number;
      estimated_arrival_time: Date;
    }[],
  ): Promise<number> {
    const db = await getDB();
    let updatedCount = 0;

    for (const update of updates) {
      const result = await db.collection(TRIP_STUDENTS_COLLECTION).updateOne(
        {
          trip_id: tripId,
          student_id: update.student_id,
        },
        {
          $set: {
            sequence_order: update.sequence_order,
            estimated_arrival_time: update.estimated_arrival_time,
            updated_at: new Date(),
          },
        },
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Get trip students with details for route calculation
   * @param tripId - Trip ID
   * @param pickupStatusFilter - Optional filter for pickup_status (used for DROP trips to get only picked students)
   */
  async getTripStudentsWithDetails(
    tripId: string,
    pickupStatusFilter?: string,
  ): Promise<StudentWaypoint[]> {
    const db = await getDB();
    // Build match condition - always filter by trip_id, optionally by pickup_status
    const matchCondition: Record<string, any> = { trip_id: tripId };
    if (pickupStatusFilter) {
      matchCondition.pickup_status = pickupStatusFilter;
    }

    return db
      .collection(TRIP_STUDENTS_COLLECTION)
      .aggregate<StudentWaypoint>([
        // Stage 1: Match students for this trip (with optional pickup_status filter)
        {
          $match: matchCondition,
        },
        // Stage 2: Lookup student details (student_id stored as string, students._id is ObjectId)
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { studentId: { $toObjectId: "$student_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
            as: "studentDetails",
          },
        },
        // Stage 3: Unwind student details
        {
          $unwind: {
            path: "$studentDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
        // Stage 4: Lookup parent addresses (pickup_address_id stored as string, parent_addresses._id is ObjectId)
        {
          $lookup: {
            from: PARENT_ADDRESSES_COLLECTION,
            let: {
              addressId: { $toObjectId: "$studentDetails.pickup_address_id" },
            },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$addressId"] } } }],
            as: "addressDetails",
          },
        },
        // Stage 5: Unwind address details
        {
          $unwind: {
            path: "$addressDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
        // Stage 6: Lookup parent details
        {
          $lookup: {
            from: PARENTS_COLLECTION,
            let: { parentId: { $toObjectId: "$studentDetails.parent_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$parentId"] } } }],
            as: "parentDetails",
          },
        },
        // Stage 7: Unwind parent details (preserve if no match found)
        {
          $unwind: {
            path: "$parentDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
        // Stage 8: Lookup user details
        {
          $lookup: {
            from: USERS_COLLECTION,
            let: { userId: { $toObjectId: "$parentDetails.user_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
            as: "userDetails",
          },
        },
        // Stage 9: Unwind user details (preserve if no match found)
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
        // Stage 10: Lookup school details (school_id stored as string, schools._id is ObjectId)
        {
          $lookup: {
            from: SCHOOLS_COLLECTION,
            let: { schoolId: { $toObjectId: "$studentDetails.school_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$schoolId"] } } }],
            as: "schoolDetails",
          },
        },
        // Stage 11: Unwind school details
        {
          $unwind: {
            path: "$schoolDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Stage 12: Project and transform to waypoint format
        {
          $project: {
            student_id: "$student_id",
            student_name: "$studentDetails.student_name",
            student_roll_number: "$studentDetails.roll_number",
            student_section: "$studentDetails.section",
            student_class: "$studentDetails.class",
            student_photo_url: "$studentDetails.photo_url",
            student_gender: "$studentDetails.gender",
            student_parent_id: "$studentDetails.parent_id",
            parent_name: "$parentDetails.name",
            parent_email: "$parentDetails.email",
            parent_phone_number: "$userDetails.phone_number",
            parent_user_id: "$parentDetails.user_id",
            latitude: "$addressDetails.latitude",
            longitude: "$addressDetails.longitude",
            address: {
              $concat: [
                "$addressDetails.address_line1",
                ", ",
                "$addressDetails.city",
              ],
            },
            school: {
              school_id: "$schoolDetails._id",
              school_name: "$schoolDetails.school_name",
              school_address: "$schoolDetails.address",
              school_city: "$schoolDetails.city",
              school_state: "$schoolDetails.state",
              school_latitude: "$schoolDetails.latitude",
              school_longitude: "$schoolDetails.longitude",
              school_contact: "$schoolDetails.contact_number",
              school_email: "$schoolDetails.email",
            },
          },
        },
      ])
      .toArray();
  }

  async getTripStudents(tripId: string): Promise<any[]> {
    const db = await getDB();
    return db
      .collection(TRIP_STUDENTS_COLLECTION)
      .find({ trip_id: tripId })
      .toArray();
  }

  async cleanOldTrackingData(daysOld: number = 30): Promise<number> {
    const db = await getDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db
      .collection(LOCATION_TRACKING_COLLECTION)
      .deleteMany({ timestamp: { $lt: cutoffDate } });

    return result.deletedCount;
  }
}

export const trackingRepository = new TrackingRepository();
