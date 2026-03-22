import { Router } from "express";

import { tripStudentHandlers } from "@modules/trips/trip_student/trip_student.routes";

const router = Router();

// --- Trip Students ---
router.put(
  "/trip-students/trip/:tripId/student/:studentId/attendance",
  tripStudentHandlers.validateAttendance,
  tripStudentHandlers.markAttendance,
);
router.put(
  "/trip-students/trip/:tripId/student/:studentId/pickup",
  tripStudentHandlers.validatePickup,
  tripStudentHandlers.recordPickup,
);
router.put(
  "/trip-students/trip/:tripId/student/:studentId/drop",
  tripStudentHandlers.validateDrop,
  tripStudentHandlers.recordDrop,
);
router.post(
  "/trip-students/trip/:tripId/pickup-point",
  tripStudentHandlers.validateBulkStop,
  tripStudentHandlers.bulkStopAction,
);
router.post(
  "/trip-students/trip/:tripId/school-point",
  tripStudentHandlers.validateBulkSchool,
  tripStudentHandlers.bulkSchoolAction,
);
router.get("/trip-students/trip/:tripId", tripStudentHandlers.getByTrip);
router.get(
  "/trip-students/trip/:tripId/with-details",
  tripStudentHandlers.getWithDetails,
);
router.get(
  "/trip-students/trip/:tripId/grouped-by-parent",
  tripStudentHandlers.getGroupedByParent,
);
router.get("/trip-students/:id", tripStudentHandlers.getById);
router.get(
  "/trip-students/student/:studentId",
  tripStudentHandlers.getByStudent,
);
router.get(
  "/trip-students/trip/:tripId/student/:studentId",
  tripStudentHandlers.getByTripAndStudent,
);
router.get(
  "/trip-students/trip/:tripId/attendance",
  tripStudentHandlers.getByAttendance,
);
router.get(
  "/trip-students/trip/:tripId/pickup",
  tripStudentHandlers.getByPickup,
);
router.put(
  "/trip-students/:id",
  tripStudentHandlers.validateUpdate,
  tripStudentHandlers.update,
);

export default router;
