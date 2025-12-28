import { Router } from "express";

import {
  createStudentController,
  deleteStudentByStudentIdController,
  deleteStudentController,
  getMyActiveStudents,
  getMyStudents,
  getStudentByStudentIdController,
  getStudentProfile,
  updateStudentByStudentIdController,
  updateStudentController,
} from "@controllers/student.controller";
import { validate, verifyParentToken } from "@middlewares";
import {
  createStudentSchema,
  updateStudentSchema,
} from "@validations/student.validation";

const router = Router();

// All routes require parent authentication
router.use(verifyParentToken);

// Student CRUD operations
router.post("/", validate(createStudentSchema), createStudentController);
router.get("/my-students", getMyStudents);
router.get("/my-active-students", getMyActiveStudents);
router.get("/:id", getStudentProfile);
router.put("/:id", validate(updateStudentSchema), updateStudentController);
router.delete("/:id", deleteStudentController);

// Operations by student_id (instead of MongoDB _id)
router.get("/by-student-id/:student_id", getStudentByStudentIdController);
router.put(
  "/by-student-id/:student_id",
  validate(updateStudentSchema),
  updateStudentByStudentIdController,
);
router.delete("/by-student-id/:student_id", deleteStudentByStudentIdController);

export default router;
