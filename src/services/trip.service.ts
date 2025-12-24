import { connectDB } from "../db/mongo";
import { TRIPS_COLLECTION } from "../config/collections";
import { Trip } from "../types/trip.type";
import { ObjectId } from "mongodb";

export const getTodayTripsByStudentId = async (
  studentId: string,
  parentId: string
): Promise<Trip[]> => {
  const db = await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const trips = await db
    .collection(TRIPS_COLLECTION)
    .find({
      studentId,
      parentId,
      scheduledStartTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
    .sort({ scheduledStartTime: 1 })
    .toArray();

  return trips as Trip[];
};

export const getTripsByParentId = async (
  parentId: string,
  limit?: number
): Promise<Trip[]> => {
  const db = await connectDB();

  let query = db
    .collection(TRIPS_COLLECTION)
    .find({ parentId })
    .sort({ scheduledStartTime: -1 });

  if (limit) {
    query = query.limit(limit);
  }

  const trips = await query.toArray();
  return trips as Trip[];
};

export const getTripById = async (
  tripId: string,
  parentId: string
): Promise<Trip | null> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(tripId) ? new ObjectId(tripId) : tripId,
    parentId,
  };

  const trip = await db.collection(TRIPS_COLLECTION).findOne(query);

  return trip as Trip | null;
};

export const createTrip = async (tripData: Trip): Promise<Trip> => {
  const db = await connectDB();

  const newTrip = {
    ...tripData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection(TRIPS_COLLECTION).insertOne(newTrip);

  return {
    ...newTrip,
    _id: result.insertedId,
  };
};

export const updateTrip = async (
  tripId: string,
  parentId: string,
  updates: Partial<Trip>
): Promise<boolean> => {
  const db = await connectDB();

  const sanitizedUpdates = { ...updates };
  delete sanitizedUpdates._id;

  const query: any = {
    _id: ObjectId.isValid(tripId) ? new ObjectId(tripId) : tripId,
    parentId,
  };

  const result = await db
    .collection(TRIPS_COLLECTION)
    .updateOne(query, { $set: { ...sanitizedUpdates, updatedAt: new Date() } });

  return result.modifiedCount > 0;
};

export const updateTripLocation = async (
  tripId: string,
  location: { coordinates: { lat: number; lng: number }; timestamp: Date }
): Promise<boolean> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(tripId) ? new ObjectId(tripId) : tripId,
  };

  const result = await db.collection(TRIPS_COLLECTION).updateOne(query, {
    $set: {
      currentLocation: location,
      updatedAt: new Date(),
    },
  });

  return result.modifiedCount > 0;
};

export const updateTripStatus = async (
  tripId: string,
  status: Trip["status"]
): Promise<boolean> => {
  const db = await connectDB();

  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "ongoing" && !updates.actualStartTime) {
    updates.actualStartTime = new Date();
  } else if (status === "completed" && !updates.actualEndTime) {
    updates.actualEndTime = new Date();
  }

  const query: any = {
    _id: ObjectId.isValid(tripId) ? new ObjectId(tripId) : tripId,
  };

  const result = await db
    .collection(TRIPS_COLLECTION)
    .updateOne(query, { $set: updates });

  return result.modifiedCount > 0;
};

export const completeStop = async (
  tripId: string,
  studentId: string
): Promise<boolean> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(tripId) ? new ObjectId(tripId) : tripId,
    "stops.studentId": studentId,
  };

  const result = await db.collection(TRIPS_COLLECTION).updateOne(query, {
    $set: {
      "stops.$.status": "completed",
      "stops.$.actualTime": new Date(),
      updatedAt: new Date(),
    },
  });

  return result.modifiedCount > 0;
};

export const getTripLiveLocation = async (
  tripId: string,
  parentId: string
): Promise<{
  coordinates: { lat: number; lng: number };
  timestamp: Date;
} | null> => {
  const trip = await getTripById(tripId, parentId);

  if (!trip || !trip.currentLocation) {
    return null;
  }

  return trip.currentLocation;
};
