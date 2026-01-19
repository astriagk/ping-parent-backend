import { Router } from "express";

import { validate, verifyParentToken } from "@shared/middlewares";

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
} from "./student.controller";
import { createStudentSchema, updateStudentSchema } from "./student.validation";

const router = Router();

// All routes require parent authentication
router.use(verifyParentToken);

// 01. Add New Student
router.post("/", validate(createStudentSchema), createStudent);

// 02. Get All My Students
router.get("/my-students", getMyStudents);

// 03. Get Active Students
router.get("/my-active-students", getMyActiveStudents);

// 04. Get Student Details by ID
router.get("/:id", getStudentProfile);

// 05. Update Student
router.put("/:id", validate(updateStudentSchema), updateStudent);

// 06. Delete Student
router.delete("/:id", deleteStudent);

// 07. Get Student by Student ID
router.get("/by-student-id/:student_id", getStudentByStudentId);

// Additional operations by student_id (instead of MongoDB _id)
router.put(
  "/by-student-id/:student_id",
  validate(updateStudentSchema),
  updateStudentByStudentId,
);
router.delete("/by-student-id/:student_id", deleteStudentByStudentId);

export default router;
