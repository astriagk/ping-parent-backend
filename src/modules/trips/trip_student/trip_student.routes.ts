import { Router } from "express";

import { validate, verifyDriverToken } from "@shared/middlewares";

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
} from "./trip_student.controller";
import {
  markAttendanceSchema,
  recordDropSchema,
  recordPickupSchema,
  updateTripStudentSchema,
} from "./trip_student.validation";

const router = Router();

// All routes require driver authentication (only drivers can manage trip students)
router.use(verifyDriverToken);

// 01. Mark Student Attendance
router.put(
  "/trip/:tripId/student/:studentId/attendance",
  validate(markAttendanceSchema),
  markStudentAttendance,
);

// 02. Record Pickup
router.put(
  "/trip/:tripId/student/:studentId/pickup",
  validate(recordPickupSchema),
  recordStudentPickup,
);

// 03. Record Drop
router.put(
  "/trip/:tripId/student/:studentId/drop",
  validate(recordDropSchema),
  recordStudentDrop,
);

// 04. Get Trip Students
router.get("/trip/:tripId", getTripStudentsByTrip);

// Additional Routes
// Get trip student by ID
router.get("/:id", getTripStudent);

// Get all trips for a specific student
router.get("/student/:studentId", getTripStudentsByStudent);

// Get trip student by trip ID and student ID
router.get("/trip/:tripId/student/:studentId", getTripStudentByTripStudent);

// Get trip students by attendance status
router.get("/trip/:tripId/attendance", getTripStudentsByAttendance);

// Get trip students by pickup status
router.get("/trip/:tripId/pickup", getTripStudentsByPickup);

// Update trip student record (general update)
router.put("/:id", validate(updateTripStudentSchema), updateTripStudentRecord);

export default router;
