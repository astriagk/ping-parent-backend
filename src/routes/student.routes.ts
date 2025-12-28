import { Router } from "express";

import {
  createStudent,
  deleteStudent,
  deleteStudentByStudentId,
  getMyActiveStudents,
  getMyStudents,
  getStudentByStudentId,
  getStudentProfile,
  updateStudent,
  updateStudentByStudentId,
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
router.post("/", validate(createStudentSchema), createStudent);
router.get("/my-students", getMyStudents);
router.get("/my-active-students", getMyActiveStudents);
router.get("/:id", getStudentProfile);
router.put("/:id", validate(updateStudentSchema), updateStudent);
router.delete("/:id", deleteStudent);

// Operations by student_id (instead of MongoDB _id)
router.get("/by-student-id/:student_id", getStudentByStudentId);
router.put(
  "/by-student-id/:student_id",
  validate(updateStudentSchema),
  updateStudentByStudentId,
);
router.delete("/by-student-id/:student_id", deleteStudentByStudentId);

export default router;
