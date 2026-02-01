import { WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  LOCATION_TRACKING_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { LocationTracking, RouteWaypoint } from "./tracking.type";

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

  async updateTripRouteData(
    tripId: string,
    routeData: any,
    totalDistance: number,
  ): Promise<void> {
    const db = await getDB();
    await db.collection(TRIPS_COLLECTION).updateOne(
      { trip_id: tripId },
      {
        $set: {
          optimized_route_data: routeData,
          total_distance: totalDistance,
          updated_at: new Date(),
        },
      },
    );
  }

  async getTripById(tripId: string): Promise<any> {
    const db = await getDB();
    return db.collection(TRIPS_COLLECTION).findOne({ trip_id: tripId });
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

  async getTripStudentsWithDetails(tripId: string): Promise<RouteWaypoint[]> {
    const db = await getDB();
    return db
      .collection(TRIP_STUDENTS_COLLECTION)
      .aggregate<RouteWaypoint>([
        // Stage 1: Match students for this trip
        {
          $match: { trip_id: tripId },
        },
        // Stage 2: Lookup student details
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            localField: "student_id",
            foreignField: "student_id",
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
        // Stage 4: Lookup parent addresses
        {
          $lookup: {
            from: PARENT_ADDRESSES_COLLECTION,
            localField: "studentDetails.parent_id",
            foreignField: "parent_id",
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
        // Stage 6: Lookup school details
        {
          $lookup: {
            from: SCHOOLS_COLLECTION,
            localField: "studentDetails.school_id",
            foreignField: "school_id",
            as: "schoolDetails",
          },
        },
        // Stage 7: Unwind school details
        {
          $unwind: {
            path: "$schoolDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Stage 8: Project and transform to waypoint format
        {
          $project: {
            _id: 0,
            student_id: "$student_id",
            student_name: "$studentDetails.student_name",
            student_roll_number: "$studentDetails.roll_number",
            student_grade: "$studentDetails.grade",
            student_parent_id: "$studentDetails.parent_id",
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
              school_id: "$schoolDetails.school_id",
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
