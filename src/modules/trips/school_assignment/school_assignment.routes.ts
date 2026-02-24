import {
  approveSchoolAssignment,
  createSchoolAssignment,
  getSchoolAssignments,
  getSchoolDriverAssignments,
  getSchoolPendingAssignments,
  rejectSchoolAssignment,
} from "./school_assignment.controller";

/**
 * Handler group for school_assignment module.
 * Import in src/routes/admin.routes.ts — NO auth middleware here.
 */
export const schoolAssignmentHandlers = {
  admin: {
    getBySchool: getSchoolAssignments,
    getPending: getSchoolPendingAssignments,
    getByDriver: getSchoolDriverAssignments,
    create: createSchoolAssignment,
    approve: approveSchoolAssignment,
    reject: rejectSchoolAssignment,
  },
};
