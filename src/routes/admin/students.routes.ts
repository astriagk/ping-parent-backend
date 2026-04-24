import { Router } from "express";

import { studentHandlers } from "@modules/users/student/student.routes";

const router = Router();

// --- Students ---
router.get("/students/school/:schoolId", studentHandlers.getBySchool);

export default router;
