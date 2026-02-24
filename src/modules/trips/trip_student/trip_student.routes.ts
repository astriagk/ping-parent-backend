import { validate } from "@shared/middlewares";

import {
  getTripStudent,
  getTripStudentByTripStudent,
  getTripStudentsByAttendance,
  getTripStudentsByPickup,
  getTripStudentsByStudent,
  getTripStudentsByTrip,
  getTripStudentsGroupedByParentHandler,
  getTripStudentsWithDetailsHandler,
  handleBulkSchoolAction,
  handleBulkStopAction,
  markStudentAttendance,
  recordStudentDrop,
  recordStudentPickup,
  updateTripStudentRecord,
} from "./trip_student.controller";
import {
  bulkSchoolActionSchema,
  bulkStopActionSchema,
  markAttendanceSchema,
  recordDropSchema,
  recordPickupSchema,
  updateTripStudentSchema,
} from "./trip_student.validation";

/**
 * Handler group for trip_student module.
 * Import in src/routes/driver.routes.ts — NO auth middleware here.
 */
export const tripStudentHandlers = {
  validateAttendance: validate(markAttendanceSchema),
  markAttendance: markStudentAttendance,
  validatePickup: validate(recordPickupSchema),
  recordPickup: recordStudentPickup,
  validateDrop: validate(recordDropSchema),
  recordDrop: recordStudentDrop,
  validateBulkStop: validate(bulkStopActionSchema),
  bulkStopAction: handleBulkStopAction,
  validateBulkSchool: validate(bulkSchoolActionSchema),
  bulkSchoolAction: handleBulkSchoolAction,
  getByTrip: getTripStudentsByTrip,
  getWithDetails: getTripStudentsWithDetailsHandler,
  getGroupedByParent: getTripStudentsGroupedByParentHandler,
  getById: getTripStudent,
  getByStudent: getTripStudentsByStudent,
  getByTripAndStudent: getTripStudentByTripStudent,
  getByAttendance: getTripStudentsByAttendance,
  getByPickup: getTripStudentsByPickup,
  validateUpdate: validate(updateTripStudentSchema),
  update: updateTripStudentRecord,
};
