import { Router } from "express";

import { studentHandlers } from "@modules/users/student/student.routes";

const router = Router();

// --- Students ---
router.get("/students/school/:schoolId", studentHandlers.getBySchool);
router.put(
  "/students/:studentId",
  studentHandlers.admin.validateUpdate,
  studentHandlers.admin.update,
);
router.delete("/students/:studentId", studentHandlers.admin.delete);

export default router;
