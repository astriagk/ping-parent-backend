import { Router } from "express";

import {
  validate,
  verifyAdminToken,
  verifyDriverToken,
  verifyToken_Middleware,
} from "@shared/middlewares";

import {
  approveDriverStudentAssignment,
  createDriverStudentAssignment,
  deactivateDriverStudentAssignment,
  deleteDriverStudentAssignment,
  getAllDriverStudentAssignments,
  getAssignment,
  getAssignmentsByStudent,
  getMyActiveAssignments,
  getMyAssignments,
  getMyPendingAssignments,
  rejectDriverStudentAssignment,
  updateDriverStudentAssignment,
} from "./driver_student_assignment.controller";
import {
  createDriverStudentAssignmentSchema,
  updateDriverStudentAssignmentSchema,
} from "./driver_student_assignment.validation";

const router = Router();

// 01. Create Driver-Student Assignment
router.post(
  "/",
  verifyToken_Middleware,
  validate(createDriverStudentAssignmentSchema),
  createDriverStudentAssignment,
);

// 02. Get Assignment Details
router.get("/:id", verifyToken_Middleware, getAssignment);

// 03. Get My Assignments (Driver)
router.get("/driver/my-assignments", verifyDriverToken, getMyAssignments);

// 04. Get Pending Assignments (Driver)
router.get(
  "/driver/my-pending-assignments",
  verifyDriverToken,
  getMyPendingAssignments,
);

// 05. Approve Assignment (Driver)
router.post("/:id/approve", verifyDriverToken, approveDriverStudentAssignment);

// 06. Reject Assignment (Driver)
router.post("/:id/reject", verifyDriverToken, rejectDriverStudentAssignment);

// Additional Routes
// Get Active Assignments (Driver)
router.get(
  "/driver/my-active-assignments",
  verifyDriverToken,
  getMyActiveAssignments,
);

// Deactivate Assignment (Driver)
router.post(
  "/:id/deactivate",
  verifyDriverToken,
  deactivateDriverStudentAssignment,
);

// Get Assignments by Student
router.get(
  "/student/:studentId",
  verifyToken_Middleware,
  getAssignmentsByStudent,
);

// Update Assignment
router.put(
  "/:id",
  verifyToken_Middleware,
  validate(updateDriverStudentAssignmentSchema),
  updateDriverStudentAssignment,
);

// Delete Assignment
router.delete("/:id", verifyToken_Middleware, deleteDriverStudentAssignment);

// Admin routes
router.get(
  "/admin/all-assignments",
  verifyAdminToken,
  getAllDriverStudentAssignments,
);

export default router;
