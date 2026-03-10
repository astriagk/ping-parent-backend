import { validate } from "@shared/middlewares";

import {
  approveDriverStudentAssignment,
  createDriverStudentAssignment,
  deactivateDriverStudentAssignment,
  deleteDriverStudentAssignment,
  getAllDriverStudentAssignments,
  getAllDrivers,
  getAssignment,
  getAssignmentsByStudent,
  getDriverParentRequestedAssignments,
  getMyActiveAssignments,
  getMyAssignments,
  getMyPendingAssignments,
  getParentRequestedAssignmentsData,
  reassignDriverStudentAssignment,
  rejectDriverStudentAssignment,
  updateDriverStudentAssignment,
} from "./driver_student_assignment.controller";
import {
  createDriverStudentAssignmentSchema,
  reassignDriverSchema,
  updateDriverStudentAssignmentSchema,
} from "./driver_student_assignment.validation";

/**
 * Handler group for driver_student_assignment.
 * Import in src/routes/parent.routes.ts, driver.routes.ts, admin.routes.ts.
 * NO auth middleware lives here.
 */
export const assignmentHandlers = {
  // Shared (parent and driver both call these)
  validateCreate: validate(createDriverStudentAssignmentSchema),
  create: createDriverStudentAssignment,
  getById: getAssignment,
  getByStudent: getAssignmentsByStudent,
  getAllDrivers: getAllDrivers,
  validateUpdate: validate(updateDriverStudentAssignmentSchema),
  update: updateDriverStudentAssignment,
  delete: deleteDriverStudentAssignment,

  // Parent-specific
  parent: {
    validateReassign: validate(reassignDriverSchema),
    reassign: reassignDriverStudentAssignment,
  },

  // Driver-specific
  driver: {
    getAll: getMyAssignments,
    getPending: getMyPendingAssignments,
    getActive: getMyActiveAssignments,
    getParentRequested: getDriverParentRequestedAssignments,
    approve: approveDriverStudentAssignment,
    reject: rejectDriverStudentAssignment,
    deactivate: deactivateDriverStudentAssignment,
  },

  // Admin-specific
  admin: {
    getAll: getAllDriverStudentAssignments,
    getParentRequested: getParentRequestedAssignmentsData,
  },
};
