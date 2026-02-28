import { validate } from "@shared/middlewares";

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

/**
 * Handler group for student module.
 * Import in src/routes/parent.routes.ts — NO auth middleware here.
 */
export const studentHandlers = {
  validateCreate: validate(createStudentSchema),
  create: createStudent,
  getMyStudents: getMyStudents,
  getMyActiveStudents: getMyActiveStudents,
  getById: getStudentProfile,
  validateUpdate: validate(updateStudentSchema),
  update: updateStudent,
  delete: deleteStudent,
  getByStudentId: getStudentByStudentId,
  updateByStudentId: updateStudentByStudentId,
  deleteByStudentId: deleteStudentByStudentId,
};
