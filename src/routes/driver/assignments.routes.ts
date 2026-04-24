import { Router } from "express";

import { assignmentHandlers } from "@modules/trips/driver_student_assignment/driver_student_assignment.routes";

const router = Router();

// --- Assignments ---
router.post(
  "/assignments",
  assignmentHandlers.validateCreate,
  assignmentHandlers.create,
);
router.get("/assignments", assignmentHandlers.driver.getAll);
router.get("/assignments/pending", assignmentHandlers.driver.getPending);
router.get("/assignments/active", assignmentHandlers.driver.getActive);
router.get(
  "/assignments/parent-requested",
  assignmentHandlers.driver.getParentRequested,
);
router.get("/assignments/:id", assignmentHandlers.getById);
router.post("/assignments/:id/approve", assignmentHandlers.driver.approve);
router.post("/assignments/:id/reject", assignmentHandlers.driver.reject);
router.post(
  "/assignments/:id/deactivate",
  assignmentHandlers.driver.deactivate,
);

export default router;
