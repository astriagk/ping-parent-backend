import { WithId } from "mongodb";

import { tripRepository } from "@modules/trips/trip/trip.repository";
import { Trip } from "@modules/trips/trip/trip.type";
import { getDB } from "@shared/config";
import {
  DRIVERS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  TripStatus,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

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

export const createTrip = async (
  userId: string,
  data: Omit<Trip, "trip_id" | "driver_id" | "created_at" | "trip_status">,
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
  const duplicate = await tripRepository.findDuplicateTrip(
    driverId,
    data.school_id,
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
    trip_id: generateUniqueCode(UniqueCodeTypes.TRIP),
    driver_id: driverId,
    ...data,
    trip_status: TripStatus.SCHEDULED,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await tripRepository.create(tripData);
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
  if (
    updates.driver_id ||
    updates.school_id ||
    updates.trip_type ||
    updates.trip_date
  ) {
    const duplicate = await tripRepository.findDuplicateTrip(
      updates.driver_id || currentTrip.driver_id,
      updates.school_id || currentTrip.school_id,
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

  return await tripRepository.updateById(id, {
    $set: updateData,
  });
};

export const deleteTrip = async (id: string): Promise<boolean> => {
  const result = await tripRepository.deleteById(id);
  return result !== null;
};
