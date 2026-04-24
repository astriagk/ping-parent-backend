import { Router } from "express";

import { assignmentHandlers } from "@modules/trips/driver_student_assignment/driver_student_assignment.routes";

const router = Router();

// --- Assignments ---
router.post(
  "/assignments",
  assignmentHandlers.validateCreate,
  assignmentHandlers.create,
);
router.get("/assignments/all-drivers", assignmentHandlers.getAllDrivers);
router.get("/assignments/student/:studentId", assignmentHandlers.getByStudent);
router.get("/assignments/:id", assignmentHandlers.getById);
router.put(
  "/assignments/:id",
  assignmentHandlers.validateUpdate,
  assignmentHandlers.update,
);
router.delete("/assignments/:id", assignmentHandlers.delete);
router.post(
  "/assignments/:id/reassign",
  assignmentHandlers.parent.validateReassign,
  assignmentHandlers.parent.reassign,
);

export default router;
