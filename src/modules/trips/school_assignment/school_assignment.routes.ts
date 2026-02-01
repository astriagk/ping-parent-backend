import { Router } from "express";

import { verifyAdminToken } from "@shared/middlewares";

import {
  approveSchoolAssignment,
  createSchoolAssignment,
  getSchoolAssignments,
  getSchoolDriverAssignments,
  getSchoolPendingAssignments,
  rejectSchoolAssignment,
} from "./school_assignment.controller";

const router = Router();

// 01: Get all assignments for school (school admin)
router.get("/:schoolId", verifyAdminToken, getSchoolAssignments);

// 02: Get pending assignments (school admin)
router.get("/:schoolId/pending", verifyAdminToken, getSchoolPendingAssignments);

// 03: Get assignments by driver (school admin)
router.get(
  "/:schoolId/driver/:driverId",
  verifyAdminToken,
  getSchoolDriverAssignments,
);

// 04: Create assignment (school admin)
router.post("/:schoolId/create", verifyAdminToken, createSchoolAssignment);

// 05: Approve assignment (school admin)
router.post(
  "/:assignmentId/approve",
  verifyAdminToken,
  approveSchoolAssignment,
);

// 06: Reject assignment (school admin)
router.post("/:assignmentId/reject", verifyAdminToken, rejectSchoolAssignment);

export default router;
