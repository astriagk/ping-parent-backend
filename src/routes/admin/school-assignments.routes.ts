import { Router } from "express";

import { schoolAssignmentHandlers } from "@modules/trips/school_assignment/school_assignment.routes";

const router = Router();

// --- School Assignments ---
router.get(
  "/school-assignments/:schoolId",
  schoolAssignmentHandlers.admin.getBySchool,
);
router.get(
  "/school-assignments/:schoolId/pending",
  schoolAssignmentHandlers.admin.getPending,
);
router.get(
  "/school-assignments/:schoolId/driver/:driverId",
  schoolAssignmentHandlers.admin.getByDriver,
);
router.post(
  "/school-assignments/:schoolId/create",
  schoolAssignmentHandlers.admin.validateCreate,
  schoolAssignmentHandlers.admin.create,
);
router.post(
  "/school-assignments/:assignmentId/approve",
  schoolAssignmentHandlers.admin.approve,
);
router.post(
  "/school-assignments/:assignmentId/reject",
  schoolAssignmentHandlers.admin.validateReject,
  schoolAssignmentHandlers.admin.reject,
);
router.post(
  "/school-assignments/:assignmentId/remove",
  schoolAssignmentHandlers.admin.remove,
);
router.post(
  "/school-assignments/:assignmentId/reassign",
  schoolAssignmentHandlers.admin.validateReassign,
  schoolAssignmentHandlers.admin.reassign,
);

export default router;
