import { Router } from "express";

import { assignmentHandlers } from "@modules/trips/driver_student_assignment/driver_student_assignment.routes";

const router = Router();

// --- Assignments ---
router.get("/assignments", assignmentHandlers.admin.getAll);
router.get(
  "/assignments/parent-requested",
  assignmentHandlers.admin.getParentRequested,
);

export default router;
