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
  bulkSchoolAction,
  bulkStopAction,
  getTripStudentById,
  getTripStudentByTripAndStudent,
  getTripStudentsByAttendanceStatus,
  getTripStudentsByPickupStatus,
  getTripStudentsByStudentId,
  getTripStudentsByTripId,
  getTripStudentsByTripIdOrdered,
  getTripStudentsGroupedByParent,
  getTripStudentsWithDetails,
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
    const { id } = req.params as Record<string, string>;

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
    const { tripId } = req.params as Record<string, string>;
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
 * Get trip students with student details for driver selection
 * Returns student name, photo, class, section along with trip student status
 * Used before school-point to show driver which students to select
 */
export const getTripStudentsWithDetailsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;

    const tripStudents = await getTripStudentsWithDetails(tripId);

    return res.json({
      success: true,
      data: tripStudents,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get trip students grouped by parent for driver selection
 * Returns parent info with array of their students (siblings grouped together)
 * Includes parent phone number and photo for easy identification/contact
 */
export const getTripStudentsGroupedByParentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;

    const groupedStudents = await getTripStudentsGroupedByParent(tripId);

    return res.json({
      success: true,
      data: groupedStudents,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all trips for a specific student
 */
export const getTripStudentsByStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { studentId } = req.params as Record<string, string>;

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
    const { tripId, studentId } = req.params as Record<string, string>;

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
    const { tripId, studentId } = req.params as Record<string, string>;
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
    const { tripId, studentId } = req.params as Record<string, string>;
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
    const { tripId, studentId } = req.params as Record<string, string>;
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
    const { id } = req.params as Record<string, string>;
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
    const { tripId } = req.params as Record<string, string>;
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
    const { tripId } = req.params as Record<string, string>;
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

/**
 * Bulk stop action - handles multiple students at one stop
 * Works for both PICKUP and DROP trips based on trip_type
 * Driver can pickup/drop and/or mark absent multiple siblings in a single call
 */
export const handleBulkStopAction = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;
    const {
      student_ids,
      absent_student_ids,
      otp_code,
      qr_code,
      latitude,
      longitude,
    } = req.body;

    const result = await bulkStopAction(tripId, {
      student_ids: student_ids || [],
      absent_student_ids: absent_student_ids || [],
      otp_code,
      qr_code,
      latitude,
      longitude,
    });

    return res.json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.BULK_STOP_ACTION_SUCCESSFUL,
    });
  },
);

/**
 * Bulk school action - handles students at school without OTP
 * - PICKUP trip: marks PICKED students as DROPPED at school
 * - DROP trip: marks students as PICKED (collecting from school)
 */
export const handleBulkSchoolAction = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;
    const { student_ids, latitude, longitude } = req.body;

    const result = await bulkSchoolAction(tripId, {
      student_ids: student_ids || [],
      latitude,
      longitude,
    });

    return res.json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.TRIP_STUDENT.BULK_SCHOOL_ACTION_SUCCESSFUL,
    });
  },
);
