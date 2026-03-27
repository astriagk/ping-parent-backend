import { Router } from "express";

import { studentHandlers } from "@modules/users/student/student.routes";

const router = Router();

// --- Students ---
router.post(
  "/students",
  studentHandlers.validateCreate,
  studentHandlers.create,
);
router.get("/students", studentHandlers.getMyStudents);
router.get("/students/active", studentHandlers.getMyActiveStudents);
router.get("/students/:id", studentHandlers.getById);
router.put(
  "/students/:id",
  studentHandlers.validateUpdate,
  studentHandlers.update,
);
router.delete("/students/:id", studentHandlers.delete);
router.get(
  "/students/by-student-id/:student_id",
  studentHandlers.getByStudentId,
);
router.put(
  "/students/by-student-id/:student_id",
  studentHandlers.validateUpdate,
  studentHandlers.updateByStudentId,
);
router.delete(
  "/students/by-student-id/:student_id",
  studentHandlers.deleteByStudentId,
);

export default router;
