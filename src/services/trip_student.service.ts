import { WithId } from "mongodb";

import {
  AttendanceStatus,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PickupStatus,
} from "@constants";
import { ApiError } from "@middlewares";
import { TripStudent } from "@models/trip_student.type";
import { tripStudentRepository } from "@repositories/trip_student.repository";

/**
 * Get trip student record by ID
 */
export const getTripStudentById = async (
  id: string,
): Promise<WithId<TripStudent> | null> => {
  return await tripStudentRepository.findById(id);
};

/**
 * Get all trip students for a specific trip
 */
export const getTripStudentsByTripId = async (
  tripId: string,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByTripId(tripId);
};

/**
 * Get all trip students for a specific trip ordered by sequence
 */
export const getTripStudentsByTripIdOrdered = async (
  tripId: string,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByTripIdOrderedBySequence(tripId);
};

/**
 * Get all trips for a specific student
 */
export const getTripStudentsByStudentId = async (
  studentId: string,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByStudentId(studentId);
};

/**
 * Get trip student by trip ID and student ID
 */
export const getTripStudentByTripAndStudent = async (
  tripId: string,
  studentId: string,
): Promise<WithId<TripStudent> | null> => {
  return await tripStudentRepository.findByTripAndStudent(tripId, studentId);
};

/**
 * Mark attendance for a student on a trip
 * This is typically done by the driver before or at the start of the trip
 */
export const markAttendance = async (
  tripId: string,
  studentId: string,
  attendanceStatus: AttendanceStatus,
  notes?: string,
): Promise<WithId<TripStudent> | null> => {
  // Find the trip student record
  const tripStudent = await tripStudentRepository.findByTripAndStudent(
    tripId,
    studentId,
  );

  if (!tripStudent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
    );
  }

  // Update attendance status
  const updates: Partial<TripStudent> = {
    attendance_status: attendanceStatus,
    updated_at: new Date(),
  };

  if (notes) {
    updates.notes = notes;
  }

  return await tripStudentRepository.updateById(tripStudent._id.toString(), {
    $set: updates,
  });
};

/**
 * Record student pickup
 * Driver records when they pick up a student during the trip
 */
export const recordPickup = async (
  tripId: string,
  studentId: string,
  pickupData: {
    pickup_latitude?: number;
    pickup_longitude?: number;
    pickup_qr_code?: string;
    pickup_otp?: string;
    notes?: string;
  },
): Promise<WithId<TripStudent> | null> => {
  // Find the trip student record
  const tripStudent = await tripStudentRepository.findByTripAndStudent(
    tripId,
    studentId,
  );

  if (!tripStudent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
    );
  }

  // Check if already picked
  if (tripStudent.pickup_status === PickupStatus.PICKED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.STUDENT_ALREADY_PICKED,
    );
  }

  // Update pickup information
  const updates: Partial<TripStudent> = {
    pickup_status: PickupStatus.PICKED,
    pickup_time: new Date(),
    attendance_status: AttendanceStatus.PRESENT,
    updated_at: new Date(),
    ...pickupData,
  };

  return await tripStudentRepository.updateById(tripStudent._id.toString(), {
    $set: updates,
  });
};

/**
 * Record student drop-off
 * Driver records when they drop off a student at destination
 */
export const recordDrop = async (
  tripId: string,
  studentId: string,
  dropData: {
    drop_latitude?: number;
    drop_longitude?: number;
    drop_qr_code?: string;
    drop_otp?: string;
    notes?: string;
  },
): Promise<WithId<TripStudent> | null> => {
  // Find the trip student record
  const tripStudent = await tripStudentRepository.findByTripAndStudent(
    tripId,
    studentId,
  );

  if (!tripStudent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
    );
  }

  // Check if already dropped
  if (tripStudent.pickup_status === PickupStatus.DROPPED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.STUDENT_ALREADY_DROPPED,
    );
  }

  // Check if student was picked up
  if (tripStudent.pickup_status !== PickupStatus.PICKED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.MUST_BE_PICKED_BEFORE_DROP,
    );
  }

  // Update drop information
  const updates: Partial<TripStudent> = {
    pickup_status: PickupStatus.DROPPED,
    drop_time: new Date(),
    updated_at: new Date(),
    ...dropData,
  };

  return await tripStudentRepository.updateById(tripStudent._id.toString(), {
    $set: updates,
  });
};

/**
 * Update trip student record
 */
export const updateTripStudent = async (
  id: string,
  updates: Partial<TripStudent>,
): Promise<WithId<TripStudent> | null> => {
  const currentTripStudent = await tripStudentRepository.findById(id);

  if (!currentTripStudent) {
    return null;
  }

  return await tripStudentRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

/**
 * Get trip students by attendance status
 */
export const getTripStudentsByAttendanceStatus = async (
  tripId: string,
  attendanceStatus: AttendanceStatus,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByAttendanceStatus(
    tripId,
    attendanceStatus,
  );
};

/**
 * Get trip students by pickup status
 */
export const getTripStudentsByPickupStatus = async (
  tripId: string,
  pickupStatus: PickupStatus,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByPickupStatus(tripId, pickupStatus);
};
