import { validate } from "@shared/middlewares";

import {
  approveSchoolAssignment,
  createSchoolAssignment,
  getSchoolAssignments,
  getSchoolDriverAssignments,
  getSchoolPendingAssignments,
  reassignSchoolAssignment,
  rejectSchoolAssignment,
  removeSchoolAssignment,
} from "./school_assignment.controller";
import {
  createSchoolAssignmentSchema,
  reassignSchoolAssignmentSchema,
  rejectSchoolAssignmentSchema,
} from "./school_assignment.validation";

/**
 * Handler group for school_assignment module.
 * Import in src/routes/admin.routes.ts — NO auth middleware here.
 */
export const schoolAssignmentHandlers = {
  admin: {
    getBySchool: getSchoolAssignments,
    getPending: getSchoolPendingAssignments,
    getByDriver: getSchoolDriverAssignments,
    validateCreate: validate(createSchoolAssignmentSchema),
    create: createSchoolAssignment,
    approve: approveSchoolAssignment,
    validateReject: validate(rejectSchoolAssignmentSchema),
    reject: rejectSchoolAssignment,
    remove: removeSchoolAssignment,
    validateReassign: validate(reassignSchoolAssignmentSchema),
    reassign: reassignSchoolAssignment,
  },
};
