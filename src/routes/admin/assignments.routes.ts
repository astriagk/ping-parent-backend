import { Router } from "express";

import { assignmentHandlers } from "@modules/trips/driver_student_assignment/driver_student_assignment.routes";

const router = Router();

router.get("/assignments", assignmentHandlers.admin.getAll);
router.get(
  "/assignments/parent-requested",
  assignmentHandlers.admin.getParentRequested,
);

router.post(
  "/assignments/assign-student",
  assignmentHandlers.admin.validateAssign,
  assignmentHandlers.admin.assignStudent,
);
router.post("/assignments/:id/approve", assignmentHandlers.admin.approve);
router.post("/assignments/:id/reject", assignmentHandlers.admin.reject);
router.post("/assignments/:id/deactivate", assignmentHandlers.admin.deactivate);

export default router;
