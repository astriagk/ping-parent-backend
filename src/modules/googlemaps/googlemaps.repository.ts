import { ObjectId, WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  LOCATION_TRACKING_COLLECTION,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  RouteProvider,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
  USERS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import {
  GoogleMapsLocationTracking,
  GoogleMapsRouteWaypoint,
} from "./googlemaps.type";

class GoogleMapsRepository extends BaseRepository<GoogleMapsLocationTracking> {
  constructor() {
    super(LOCATION_TRACKING_COLLECTION);
  }

  async getTrackingByTripId(
    tripId: string,
  ): Promise<WithId<GoogleMapsLocationTracking>[]> {
    const db = await getDB();
    return db
      .collection(LOCATION_TRACKING_COLLECTION)
      .find({ trip_id: tripId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray() as Promise<WithId<GoogleMapsLocationTracking>[]>;
  }

  async getLatestTrackingByTripId(
    tripId: string,
  ): Promise<WithId<GoogleMapsLocationTracking> | null> {
    const db = await getDB();
    return db
      .collection(LOCATION_TRACKING_COLLECTION)
      .findOne(
        { trip_id: tripId },
        { sort: { timestamp: -1 } },
      ) as Promise<WithId<GoogleMapsLocationTracking> | null>;
  }

  async getTrackingByDriverId(
    driverId: string,
    limit: number = 50,
  ): Promise<WithId<GoogleMapsLocationTracking>[]> {
    const db = await getDB();
    return db
      .collection(LOCATION_TRACKING_COLLECTION)
      .find({ driver_id: driverId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray() as Promise<WithId<GoogleMapsLocationTracking>[]>;
  }

  async upsertTracking(
    tripId: string,
    tracking: Omit<GoogleMapsLocationTracking, "_id">,
  ): Promise<WithId<GoogleMapsLocationTracking>> {
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

    if (result?.value) {
      return result.value as WithId<GoogleMapsLocationTracking>;
    }

    const doc = await db
      .collection(LOCATION_TRACKING_COLLECTION)
      .findOne({ trip_id: tripId });

    if (!doc) {
      throw new Error(`Failed to upsert tracking for trip: ${tripId}`);
    }

    return doc as WithId<GoogleMapsLocationTracking>;
  }

  async updateTripRouteData(
    tripId: string,
    routeData: any,
    totalDistance: number,
    routeProvider: string = RouteProvider.GOOGLE_MAPS,
  ): Promise<void> {
    const db = await getDB();
    await db.collection(TRIPS_COLLECTION).updateOne(
      { _id: new ObjectId(tripId) },
      {
        $set: {
          optimized_route_data: routeData,
          total_distance: totalDistance,
          route_provider: routeProvider,
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

  async getTripStudentsWithDetails(
    tripId: string,
    pickupStatusFilter?: string,
  ): Promise<GoogleMapsRouteWaypoint[]> {
    const db = await getDB();
    const matchCondition: Record<string, any> = { trip_id: tripId };
    if (pickupStatusFilter) {
      matchCondition.pickup_status = pickupStatusFilter;
    }

    return db
      .collection(TRIP_STUDENTS_COLLECTION)
      .aggregate<GoogleMapsRouteWaypoint>([
        { $match: matchCondition },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { studentId: { $toObjectId: "$student_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
            as: "studentDetails",
          },
        },
        {
          $unwind: {
            path: "$studentDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
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
        {
          $unwind: {
            path: "$addressDetails",
            preserveNullAndEmptyArrays: false,
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
            preserveNullAndEmptyArrays: false,
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
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: SCHOOLS_COLLECTION,
            let: { schoolId: { $toObjectId: "$studentDetails.school_id" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$schoolId"] } } }],
            as: "schoolDetails",
          },
        },
        {
          $unwind: {
            path: "$schoolDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
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

export const googlemapsRepository = new GoogleMapsRepository();
