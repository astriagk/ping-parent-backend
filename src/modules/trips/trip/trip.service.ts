import { ObjectId, WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  AttendanceStatus,
  BroadcastSocketEvent,
  DRIVERS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  PickupStatus,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
  TripStatus,
  TripType,
  USERS_COLLECTION,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { socketService } from "@shared/services/socket.service";

import { generateBulkQrOtp } from "../daily_qr_otp/daily_qr_otp.service";
import { tripRepository } from "./trip.repository";
import { CompletedTripDetails, Trip, TripProgress } from "./trip.type";

/**
 * Helper function to convert userId to driver_id
 * This is needed because the trip table stores driver_id (from drivers table)
 * but the authenticated user has user_id (from users table)
 */
const getDriverIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ user_id: userId });

  if (!driver) {
    return null;
  }

  return String(driver._id);
};

/**
 * Auto-create trip students for all active students assigned to this driver
 * and generate QR/OTP for each student using bulk insert
 */
const createTripStudentsForTrip = async (
  tripId: string,
  driverId: string,
  tripType: TripType,
): Promise<void> => {
  const db = await getDB();

  // Find all active driver-student assignments for this driver
  const assignments = await db
    .collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION)
    .find({
      driver_id: driverId,
      assignment_status: "active",
    })
    .toArray();

  if (assignments.length === 0) {
    return; // No students assigned, skip
  }

  // Create trip_students for each assigned student
  const tripStudents = assignments.map((assignment, index) => ({
    trip_id: tripId,
    student_id: assignment.student_id,
    sequence_order: index + 1,
    attendance_status: "pending",
    pickup_status: "pending",
    pickup_time: null,
    pickup_latitude: null,
    pickup_longitude: null,
    pickup_qr_code: null,
    pickup_otp: null,
    drop_time: null,
    drop_latitude: null,
    drop_longitude: null,
    drop_qr_code: null,
    drop_otp: null,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  }));

  if (tripStudents.length > 0) {
    // Insert all trip students
    await db.collection(TRIP_STUDENTS_COLLECTION).insertMany(tripStudents);

    // Generate QR/OTP for all students in bulk
    const studentIds = tripStudents.map((ts) => ts.student_id);
    await generateBulkQrOtp(studentIds, tripId, tripType);
  }
};

export const createTrip = async (
  userId: string,
  data: Omit<Trip, "driver_id" | "created_at" | "trip_status">,
): Promise<WithId<Trip>> => {
  // Convert user_id to driver_id
  const driverId = await getDriverIdByUserId(userId);

  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  // Check for duplicate trip
  // Only check: same driver + same trip_type + same trip_date
  // School is NOT part of duplicate check because driver can service multiple schools
  const duplicate = await tripRepository.findDuplicateTrip(
    driverId,
    data.trip_type,
    data.trip_date,
  );

  if (duplicate) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.TRIP.ALREADY_EXISTS,
    );
  }

  const tripData: Trip = {
    driver_id: driverId,
    ...data,
    trip_status: TripStatus.SCHEDULED,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createdTrip = await tripRepository.create(tripData);

  // AUTO-CREATE TRIP STUDENTS AND GENERATE QR/OTP
  try {
    await createTripStudentsForTrip(
      String(createdTrip._id),
      driverId,
      tripData.trip_type,
    );
  } catch (error) {
    console.error("Error creating trip students:", error);
    // Continue even if trip students creation fails
  }

  return createdTrip;
};

export const getTripById = async (id: string): Promise<WithId<Trip> | null> => {
  return await tripRepository.findById(id);
};

/**
 * Get all trips across the system (admin only)
 */
export const getAllTrips = async (): Promise<WithId<Trip>[]> => {
  return await tripRepository.findMany();
};

export const getTripsByUserId = async (
  userId: string,
): Promise<WithId<Trip>[]> => {
  const driverId = await getDriverIdByUserId(userId);

  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  return await tripRepository.findByDriverId(driverId);
};

export const getTripsByDriverIdAndDate = async (
  userId: string,
  tripDate: Date,
): Promise<WithId<Trip>[]> => {
  const driverId = await getDriverIdByUserId(userId);

  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  return await tripRepository.findByDriverIdAndDate(driverId, tripDate);
};

export const getActiveTrips = async (
  userId: string,
): Promise<WithId<Trip>[]> => {
  const driverId = await getDriverIdByUserId(userId);

  if (!driverId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  return await tripRepository.findActiveTrips(driverId);
};

export const updateTrip = async (
  id: string,
  updates: Partial<Trip>,
): Promise<WithId<Trip> | null> => {
  const currentTrip = await tripRepository.findById(id);

  if (!currentTrip) {
    return null;
  }

  // Prevent updating completed trips
  if (currentTrip.trip_status === TripStatus.COMPLETED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP.CANNOT_UPDATE_COMPLETED,
    );
  }

  // Check for duplicate if updating critical fields
  // Only check: driver_id + trip_type + trip_date
  if (updates.driver_id || updates.trip_type || updates.trip_date) {
    const duplicate = await tripRepository.findDuplicateTrip(
      updates.driver_id || currentTrip.driver_id,
      updates.trip_type || currentTrip.trip_type,
      updates.trip_date || currentTrip.trip_date,
    );

    // If duplicate exists and it's not the same trip
    if (duplicate && duplicate._id.toString() !== id) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.TRIP.ALREADY_EXISTS,
      );
    }
  }

  return await tripRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const updateTripStatus = async (
  id: string,
  newStatus: TripStatus,
): Promise<WithId<Trip> | null> => {
  const currentTrip = await tripRepository.findById(id);

  if (!currentTrip) {
    return null;
  }

  // Validate status transitions
  const validTransitions: Record<TripStatus, TripStatus[]> = {
    [TripStatus.SCHEDULED]: [
      TripStatus.STARTED,
      TripStatus.CANCELLED,
      TripStatus.SCHEDULED,
    ],
    [TripStatus.STARTED]: [
      TripStatus.IN_PROGRESS,
      TripStatus.CANCELLED,
      TripStatus.STARTED,
    ],
    [TripStatus.IN_PROGRESS]: [
      TripStatus.COMPLETED,
      TripStatus.CANCELLED,
      TripStatus.IN_PROGRESS,
    ],
    [TripStatus.COMPLETED]: [TripStatus.COMPLETED],
    [TripStatus.CANCELLED]: [TripStatus.CANCELLED],
  };

  if (!validTransitions[currentTrip.trip_status]?.includes(newStatus)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP.INVALID_STATUS_TRANSITION,
    );
  }

  const updateData: Partial<Trip> = {
    trip_status: newStatus,
    updated_at: new Date(),
  };

  // Set start_time when trip is started
  if (newStatus === TripStatus.STARTED && !currentTrip.start_time) {
    updateData.start_time = new Date();
  }

  // Set end_time when trip is completed
  if (newStatus === TripStatus.COMPLETED && !currentTrip.end_time) {
    updateData.end_time = new Date();
  }

  const updatedTrip = await tripRepository.updateById(id, {
    $set: updateData,
  });

  // Emit socket event to notify parents of trip status change
  if (updatedTrip) {
    socketService.broadcastToTrip(
      String(currentTrip._id),
      BroadcastSocketEvent.TRIP_STATUS_UPDATE,
      {
        tripId: String(currentTrip._id),
        previousStatus: currentTrip.trip_status,
        newStatus,
        timestamp: new Date(),
      },
    );
  }

  return updatedTrip;
};

export const deleteTrip = async (id: string): Promise<boolean> => {
  const result = await tripRepository.deleteById(id);
  return result !== null;
};

/**
 * Get trip progress for resume functionality
 * Calculates currentWaypointIndex based on processed students and route waypoints
 * Only works for active trips (started or in_progress)
 */
export const getTripProgress = async (
  tripId: string,
): Promise<TripProgress> => {
  const db = await getDB();

  // Fetch trip by _id
  const trip = await db
    .collection(TRIPS_COLLECTION)
    .findOne({ _id: new ObjectId(tripId) });

  if (!trip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.TRIP.NOT_FOUND);
  }

  // Validate trip is active (started or in_progress)
  const activeStatuses = [TripStatus.STARTED, TripStatus.IN_PROGRESS];
  if (!activeStatuses.includes(trip.trip_status)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `${ERROR_MESSAGES.TRIP.NOT_ACTIVE}. Status: ${trip.trip_status}`,
    );
  }

  // Get all trip students for this trip
  const tripStudents = await db
    .collection(TRIP_STUDENTS_COLLECTION)
    .find({ trip_id: tripId })
    .sort({ sequence_order: 1 })
    .toArray();

  const tripType = trip.trip_type as TripType;

  // Calculate processed, in-transit, and absent student IDs based on trip type
  // PICKUP: student is processed when PICKED (at parent home) or DROPPED (at school)
  // DROP: student is processed at waypoint when DROPPED (at parent home)
  const processedStudentIds: string[] = [];
  const inTransitStudentIds: string[] = []; // DROP trips: picked from school, not yet dropped
  const absentStudentIds: string[] = [];

  for (const ts of tripStudents) {
    // For waypoint progress calculation:
    // - PICKUP trip: PICKED means waypoint (parent home) is done
    // - DROP trip: DROPPED means waypoint (parent home) is done
    if (tripType === TripType.PICKUP) {
      // For PICKUP: student processed at parent home when PICKED or DROPPED
      if (
        ts.pickup_status === PickupStatus.PICKED ||
        ts.pickup_status === PickupStatus.DROPPED
      ) {
        processedStudentIds.push(ts.student_id);
      }
    } else {
      // For DROP: student processed at parent home waypoint only when DROPPED
      if (ts.pickup_status === PickupStatus.DROPPED) {
        processedStudentIds.push(ts.student_id);
      }
      // Track students currently in transit (picked from school but not dropped yet)
      if (ts.pickup_status === PickupStatus.PICKED) {
        inTransitStudentIds.push(ts.student_id);
      }
    }

    if (
      ts.pickup_status === PickupStatus.NO_SHOW ||
      ts.attendance_status === AttendanceStatus.ABSENT
    ) {
      absentStudentIds.push(ts.student_id);
    }
  }

  // Get waypoints from optimized_route_data
  const waypoints = trip.optimized_route_data?.waypoints || [];
  const totalWaypoints = waypoints.length;

  // Calculate currentWaypointIndex
  // Find the first waypoint that has unprocessed students
  let currentWaypointIndex = 0;

  // For waypoint calculation: check if students are processed (DROPPED for DROP, PICKED for PICKUP)
  const processedSet = new Set([...processedStudentIds, ...absentStudentIds]);

  // For DROP trips: check if school waypoint is done based on trip_students status
  // School is done when all students are either PICKED (in transit), DROPPED, or NO_SHOW
  const allStudentsLeftSchool =
    tripType === TripType.DROP &&
    tripStudents.every(
      (ts) =>
        ts.pickup_status === PickupStatus.PICKED ||
        ts.pickup_status === PickupStatus.DROPPED ||
        ts.pickup_status === PickupStatus.NO_SHOW ||
        ts.attendance_status === AttendanceStatus.ABSENT,
    );

  for (let i = 0; i < waypoints.length; i++) {
    const waypoint = waypoints[i];

    // Check if this is a school waypoint
    // student_parent_id can be "SCHOOL_LOCATION" for school waypoints

    const isSchoolWaypoint = waypoint.student_parent_id === "SCHOOL_LOCATION";

    // For PICKUP trips, skip school waypoint (it's the final destination)
    if (isSchoolWaypoint && tripType === TripType.PICKUP) {
      continue;
    }

    // For DROP trips at school waypoint: check if all students have left school
    if (isSchoolWaypoint && tripType === TripType.DROP) {
      if (!allStudentsLeftSchool) {
        currentWaypointIndex = i;
        break;
      }
      // School is done, move currentWaypointIndex past school
      currentWaypointIndex = i + 1;
      continue;
    }

    // Get student IDs at this waypoint (can be array or single)
    let studentIds: string[] = [];
    if (Array.isArray(waypoint.student_id)) {
      studentIds = waypoint.student_id;
    } else if (waypoint.student_id) {
      studentIds = [waypoint.student_id];
    }

    // For parent home waypoints, check if all students at this stop are dropped
    const allProcessed =
      studentIds.length === 0 ||
      studentIds.every((sid: string) => processedSet.has(sid));

    if (!allProcessed) {
      currentWaypointIndex = i;
      break;
    }

    // This waypoint is done, update index to next waypoint
    currentWaypointIndex = i + 1;
  }

  // If no waypoints or all processed, calculate based on progress
  if (waypoints.length === 0 && tripStudents.length > 0) {
    // No optimized route, estimate based on processed count
    currentWaypointIndex = processedStudentIds.length + absentStudentIds.length;
  }

  // Get last position update timestamp from trip_students
  let lastPositionUpdate: Date | null = null;
  const lastUpdated = tripStudents
    .filter((ts) => ts.pickup_time || ts.drop_time)
    .sort((a, b) => {
      const aTime = a.drop_time || a.pickup_time;
      const bTime = b.drop_time || b.pickup_time;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    })[0];

  if (lastUpdated) {
    lastPositionUpdate = lastUpdated.drop_time || lastUpdated.pickup_time;
  }

  return {
    tripId: String(trip._id),
    tripType: trip.trip_type,
    tripStatus: trip.trip_status,
    currentWaypointIndex,
    totalWaypoints,
    processedStudentIds,
    inTransitStudentIds, // DROP trips: picked from school, not yet dropped
    absentStudentIds,
    optimizedRouteId: trip._id?.toString() || null,
    startedAt: trip.start_time || null,
    lastPositionUpdate,
  };
};

/**
 * Get completed trip details with students and parent data
 * Uses MongoDB aggregation to join trips -> trip_students -> students -> parents
 */
export const getCompletedTripDetails = async (
  tripId: string,
): Promise<CompletedTripDetails | null> => {
  const db = await getDB();

  const result = await db
    .collection(TRIPS_COLLECTION)
    .aggregate<CompletedTripDetails>([
      // Stage 1: Match the trip by _id
      {
        $match: { _id: new ObjectId(tripId) },
      },
      // Stage 2: Lookup trip_students for this trip (trip_id stored as string in trip_students)
      {
        $lookup: {
          from: TRIP_STUDENTS_COLLECTION,
          let: { tripId: { $toString: "$_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$trip_id", "$$tripId"] } } }],
          as: "tripStudents",
        },
      },
      // Stage 3: Unwind trip_students to join with students
      {
        $unwind: {
          path: "$tripStudents",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 4: Lookup student details (student_id stored as string, students._id is ObjectId)
      {
        $lookup: {
          from: STUDENTS_COLLECTION,
          let: { studentId: { $toObjectId: "$tripStudents.student_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
          as: "studentDetails",
        },
      },
      // Stage 5: Unwind student details
      {
        $unwind: {
          path: "$studentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 6: Lookup parent details using parent_id from students
      {
        $lookup: {
          from: PARENTS_COLLECTION,
          let: { parentId: { $toObjectId: "$studentDetails.parent_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$parentId"] } } }],
          as: "parentDetails",
        },
      },
      // Stage 7: Unwind parent details
      {
        $unwind: {
          path: "$parentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 8: Lookup user details for parent phone number
      {
        $lookup: {
          from: USERS_COLLECTION,
          let: { userId: { $toObjectId: "$parentDetails.user_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
          as: "userDetails",
        },
      },
      // Stage 9: Unwind user details
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 10: Group back to trip level with students array
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
      // Stage 11: Project final output
      {
        $project: {
          _id: 0,
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

  if (result.length === 0) {
    return null;
  }

  return result[0];
};
