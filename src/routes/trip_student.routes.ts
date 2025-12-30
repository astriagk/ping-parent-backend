import { Router } from "express";

import {
  getTripStudent,
  getTripStudentByTripStudent,
  getTripStudentsByAttendance,
  getTripStudentsByPickup,
  getTripStudentsByStudent,
  getTripStudentsByTrip,
  markStudentAttendance,
  recordStudentDrop,
  recordStudentPickup,
  updateTripStudentRecord,
} from "@controllers/trip_student.controller";
import { validate, verifyDriverToken } from "@middlewares";
import {
  markAttendanceSchema,
  recordDropSchema,
  recordPickupSchema,
  updateTripStudentSchema,
} from "@validations/trip_student.validation";

const router = Router();

// All routes require driver authentication (only drivers can manage trip students)
router.use(verifyDriverToken);

/**
 * Get trip student by ID
 * GET /trip-students/:id
 */
router.get("/:id", getTripStudent);

/**
 * Get all trip students for a specific trip (with optional ordering)
 * GET /trip-students/trip/:tripId?ordered=true
 */
router.get("/trip/:tripId", getTripStudentsByTrip);

/**
 * Get all trips for a specific student
 * GET /trip-students/student/:studentId
 */
router.get("/student/:studentId", getTripStudentsByStudent);

/**
 * Get trip student by trip ID and student ID
 * GET /trip-students/trip/:tripId/student/:studentId
 */
router.get("/trip/:tripId/student/:studentId", getTripStudentByTripStudent);

/**
 * Get trip students by attendance status
 * GET /trip-students/trip/:tripId/attendance?status=present
 */
router.get("/trip/:tripId/attendance", getTripStudentsByAttendance);

/**
 * Get trip students by pickup status
 * GET /trip-students/trip/:tripId/pickup?status=picked
 */
router.get("/trip/:tripId/pickup", getTripStudentsByPickup);

/**
 * Mark attendance for a student
 * PUT /trip-students/trip/:tripId/student/:studentId/attendance
 */
router.put(
  "/trip/:tripId/student/:studentId/attendance",
  validate(markAttendanceSchema),
  markStudentAttendance,
);

/**
 * Record student pickup
 * PUT /trip-students/trip/:tripId/student/:studentId/pickup
 */
router.put(
  "/trip/:tripId/student/:studentId/pickup",
  validate(recordPickupSchema),
  recordStudentPickup,
);

/**
 * Record student drop-off
 * PUT /trip-students/trip/:tripId/student/:studentId/drop
 */
router.put(
  "/trip/:tripId/student/:studentId/drop",
  validate(recordDropSchema),
  recordStudentDrop,
);

/**
 * Update trip student record (general update)
 * PUT /trip-students/:id
 */
router.put("/:id", validate(updateTripStudentSchema), updateTripStudentRecord);

export default router;
