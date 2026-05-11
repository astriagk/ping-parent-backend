import { validate } from "@shared/middlewares";

import {
  adminBulkCreateStudentsHandler,
  adminCreateStudentForParentHandler,
  adminDeleteStudentHandler,
  adminGetParentStudentsHandler,
  adminUpdateStudentHandler,
  createStudent,
  deleteStudent,
  deleteStudentByStudentId,
  getMyActiveStudents,
  getMyStudents,
  getStudentByStudentId,
  getStudentProfile,
  getStudentsBySchool,
  updateStudent,
  updateStudentByStudentId,
} from "./student.controller";
import {
  adminBulkCreateStudentsSchema,
  adminCreateStudentSchema,
  adminUpdateStudentSchema,
  createStudentSchema,
  updateStudentSchema,
} from "./student.validation";

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
  getBySchool: getStudentsBySchool,

  admin: {
    getByParent: adminGetParentStudentsHandler,
    validateCreateForParent: validate(adminCreateStudentSchema),
    createForParent: adminCreateStudentForParentHandler,
    validateBulk: validate(adminBulkCreateStudentsSchema),
    bulkCreate: adminBulkCreateStudentsHandler,
    validateUpdate: validate(adminUpdateStudentSchema),
    update: adminUpdateStudentHandler,
    delete: adminDeleteStudentHandler,
  },
};
