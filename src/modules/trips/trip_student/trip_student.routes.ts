import { Router } from "express";

import { validate, verifyDriverToken } from "@shared/middlewares";

import {
  getTripStudent,
  getTripStudentByTripStudent,
  getTripStudentsByAttendance,
  getTripStudentsByPickup,
  getTripStudentsByStudent,
  getTripStudentsByTrip,
  handleBulkSchoolAction,
  handleBulkStopAction,
  markStudentAttendance,
  recordStudentDrop,
  recordStudentPickup,
  updateTripStudentRecord,
} from "./trip_student.controller";
import {
  bulkSchoolActionSchema,
  bulkStopActionSchema,
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

// 04. Bulk Stop Action - handle multiple students at one stop (OTP required)
router.post(
  "/trip/:tripId/bulk-stop-action",
  validate(bulkStopActionSchema),
  handleBulkStopAction,
);

// 05. Bulk School Action - handle students at school (No OTP)
router.post(
  "/trip/:tripId/bulk-school-action",
  validate(bulkSchoolActionSchema),
  handleBulkSchoolAction,
);

// 06. Get Trip Students
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
