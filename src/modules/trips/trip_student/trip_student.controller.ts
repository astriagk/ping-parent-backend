import { Request, Response } from "express";

import {
  AttendanceStatus,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PickupStatus,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  getTripStudentById,
  getTripStudentByTripAndStudent,
  getTripStudentsByAttendanceStatus,
  getTripStudentsByPickupStatus,
  getTripStudentsByStudentId,
  getTripStudentsByTripId,
  getTripStudentsByTripIdOrdered,
  markAttendance,
  recordDrop,
  recordPickup,
  updateTripStudent,
} from "./trip_student.service";

/**
 * Get trip student by ID
 */
export const getTripStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const tripStudent = await getTripStudentById(id);

    if (!tripStudent) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: tripStudent,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all trip students for a specific trip
 */
export const getTripStudentsByTrip = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as { tripId: string };
    const { ordered } = req.query;

    let tripStudents;
    if (ordered === "true") {
      tripStudents = await getTripStudentsByTripIdOrdered(tripId);
    } else {
      tripStudents = await getTripStudentsByTripId(tripId);
    }

    return res.json({
      success: true,
      data: tripStudents,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all trips for a specific student
 */
export const getTripStudentsByStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { studentId } = req.params as { studentId: string };

    const tripStudents = await getTripStudentsByStudentId(studentId);

    return res.json({
      success: true,
      data: tripStudents,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get trip student by trip ID and student ID
 */
export const getTripStudentByTripStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId, studentId } = req.params as {
      tripId: string;
      studentId: string;
    };

    const tripStudent = await getTripStudentByTripAndStudent(tripId, studentId);

    if (!tripStudent) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: tripStudent,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Mark attendance for a student
 * Driver marks student as present/absent/pending
 */
export const markStudentAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId, studentId } = req.params as {
      tripId: string;
      studentId: string;
    };
    const { attendance_status, notes } = req.body;

    const tripStudent = await markAttendance(
      tripId,
      studentId,
      attendance_status,
      notes,
    );

    return res.json({
      success: true,
      data: tripStudent,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.ATTENDANCE_MARKED_SUCCESSFULLY,
    });
  },
);

/**
 * Record student pickup
 * Driver records when they pick up a student
 */
export const recordStudentPickup = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId, studentId } = req.params as {
      tripId: string;
      studentId: string;
    };
    const pickupData = req.body;

    const tripStudent = await recordPickup(tripId, studentId, pickupData);

    return res.json({
      success: true,
      data: tripStudent,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.PICKUP_RECORDED_SUCCESSFULLY,
    });
  },
);

/**
 * Record student drop-off
 * Driver records when they drop off a student
 */
export const recordStudentDrop = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId, studentId } = req.params as {
      tripId: string;
      studentId: string;
    };
    const dropData = req.body;

    const tripStudent = await recordDrop(tripId, studentId, dropData);

    return res.json({
      success: true,
      data: tripStudent,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.DROP_RECORDED_SUCCESSFULLY,
    });
  },
);

/**
 * Update trip student record
 */
export const updateTripStudentRecord = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const updates = req.body;

    const tripStudent = await updateTripStudent(id, updates);

    if (!tripStudent) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: tripStudent,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.UPDATED_SUCCESSFULLY,
    });
  },
);

/**
 * Get trip students by attendance status
 */
export const getTripStudentsByAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as { tripId: string };
    const { status } = req.query;

    if (!status || typeof status !== "string") {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.TRIP_STUDENT.ATTENDANCE_STATUS_REQUIRED,
      );
    }

    const tripStudents = await getTripStudentsByAttendanceStatus(
      tripId,
      status as AttendanceStatus,
    );

    return res.json({
      success: true,
      data: tripStudents,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get trip students by pickup status
 */
export const getTripStudentsByPickup = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as { tripId: string };
    const { status } = req.query;

    if (!status || typeof status !== "string") {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.TRIP_STUDENT.PICKUP_STATUS_REQUIRED,
      );
    }

    const tripStudents = await getTripStudentsByPickupStatus(
      tripId,
      status as PickupStatus,
    );

    return res.json({
      success: true,
      data: tripStudents,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);
