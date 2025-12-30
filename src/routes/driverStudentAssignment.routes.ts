import { Router } from "express";

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
} from "@controllers/driverStudentAssignment.controller";
import {
  validate,
  verifyAdminToken,
  verifyDriverToken,
  verifyToken_Middleware,
} from "@middlewares";
import {
  createDriverStudentAssignmentSchema,
  updateDriverStudentAssignmentSchema,
} from "@validations/driverStudentAssignment.validation";

const router = Router();

// Admin routes
router.get(
  "/admin/all-assignments",
  verifyAdminToken,
  getAllDriverStudentAssignments,
);

// Routes accessible by both parents and drivers (authenticated users)
router.post(
  "/",
  verifyToken_Middleware,
  validate(createDriverStudentAssignmentSchema),
  createDriverStudentAssignment,
);

router.get("/:id", verifyToken_Middleware, getAssignment);

// Driver-specific routes
router.get("/driver/my-assignments", verifyDriverToken, getMyAssignments);
router.get(
  "/driver/my-active-assignments",
  verifyDriverToken,
  getMyActiveAssignments,
);
router.get(
  "/driver/my-pending-assignments",
  verifyDriverToken,
  getMyPendingAssignments,
);
router.post("/:id/approve", verifyDriverToken, approveDriverStudentAssignment);
router.post("/:id/reject", verifyDriverToken, rejectDriverStudentAssignment);
router.post(
  "/:id/deactivate",
  verifyDriverToken,
  deactivateDriverStudentAssignment,
);

// Routes for getting assignments by student
router.get(
  "/student/:studentId",
  verifyToken_Middleware,
  getAssignmentsByStudent,
);

// Update and delete routes
router.put(
  "/:id",
  verifyToken_Middleware,
  validate(updateDriverStudentAssignmentSchema),
  updateDriverStudentAssignment,
);
router.delete("/:id", verifyToken_Middleware, deleteDriverStudentAssignment);

export default router;
