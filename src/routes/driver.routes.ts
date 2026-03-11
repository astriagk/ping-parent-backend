import { Router } from "express";

import { googlemapsHandlers } from "@modules/googlemaps/googlemaps.routes";
import { trackingHandlers } from "@modules/tracking/tracking.routes";
import { qrOtpHandlers } from "@modules/trips/daily_qr_otp/daily_qr_otp.routes";
import { assignmentHandlers } from "@modules/trips/driver_student_assignment/driver_student_assignment.routes";
import { tripHandlers } from "@modules/trips/trip/trip.routes";
import { tripStudentHandlers } from "@modules/trips/trip_student/trip_student.routes";
import { driverHandlers } from "@modules/users/driver/driver.routes";
import { verifyDriverToken } from "@shared/middlewares";

const router = Router();

/**
 * DRIVER GATEWAY — verifyDriverToken applied ONCE
 * All routes below require driver token.
 */
router.use(verifyDriverToken);

// --- Profile ---
router.get("/profile", driverHandlers.getProfile);
router.post(
  "/profile",
  driverHandlers.validateCreateProfile,
  driverHandlers.createProfile,
);
router.put(
  "/profile",
  driverHandlers.validateUpdateProfile,
  driverHandlers.updateProfile,
);

// --- Availability ---
router.patch("/availability", driverHandlers.setAvailability);

// --- Address ---
router.get("/address", driverHandlers.getAddress);
router.post(
  "/address",
  driverHandlers.validateAddress,
  driverHandlers.upsertAddress,
);

// --- Documents ---
router.get("/documents", driverHandlers.getDocuments);
router.post(
  "/documents",
  driverHandlers.uploadDocumentsMiddleware,
  driverHandlers.validateCreateDocuments,
  driverHandlers.createDocuments,
);
router.put(
  "/documents",
  driverHandlers.uploadDocumentsMiddleware,
  driverHandlers.validateUpdateDocuments,
  driverHandlers.updateDocuments,
);

// --- Onboarding ---
router.get("/onboarding/screen", driverHandlers.getOnboardingScreen);
router.put(
  "/onboarding/screen",
  driverHandlers.validateUpdateOnboarding,
  driverHandlers.updateOnboardingScreen,
);

// --- Trips ---
router.post(
  "/trips",
  tripHandlers.driver.validateCreate,
  tripHandlers.driver.create,
);
router.get("/trips", tripHandlers.driver.getMyTrips);
router.get("/trips/by-date", tripHandlers.driver.getMyTripsByDate);
router.get("/trips/active", tripHandlers.driver.getActiveTrips);
router.patch(
  "/trips/:id/status",
  tripHandlers.driver.validateUpdateStatus,
  tripHandlers.driver.updateStatus,
);
router.get("/trips/:id/progress", tripHandlers.driver.getProgress);
router.get("/trips/:id/completed", tripHandlers.driver.getCompletedDetails);
router.get("/trips/:id", tripHandlers.driver.getById);
router.put(
  "/trips/:id",
  tripHandlers.driver.validateUpdate,
  tripHandlers.driver.update,
);
router.delete("/trips/:id", tripHandlers.driver.delete);

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

// --- Assignments ---
router.post(
  "/assignments",
  assignmentHandlers.validateCreate,
  assignmentHandlers.create,
);
router.get("/assignments", assignmentHandlers.driver.getAll);
router.get("/assignments/pending", assignmentHandlers.driver.getPending);
router.get("/assignments/active", assignmentHandlers.driver.getActive);
router.get(
  "/assignments/parent-requested",
  assignmentHandlers.driver.getParentRequested,
);
router.get("/assignments/:id", assignmentHandlers.getById);
router.post("/assignments/:id/approve", assignmentHandlers.driver.approve);
router.post("/assignments/:id/reject", assignmentHandlers.driver.reject);
router.post(
  "/assignments/:id/deactivate",
  assignmentHandlers.driver.deactivate,
);

// --- QR / OTP ---
router.post(
  "/qr-otp/generate",
  qrOtpHandlers.driver.validateGenerate,
  qrOtpHandlers.driver.generate,
);
router.get(
  "/qr-otp/student/:studentId/trip/:tripId",
  qrOtpHandlers.driver.getForStudentTrip,
);
router.post(
  "/qr-otp/verify",
  qrOtpHandlers.driver.validateVerify,
  qrOtpHandlers.driver.verify,
);
router.post(
  "/qr-otp/verify-attendance",
  qrOtpHandlers.driver.validateVerifyAttendance,
  qrOtpHandlers.driver.verifyAttendance,
);

// --- Tracking (TomTom-only) ---
router.post(
  "/tracking/calculate",
  trackingHandlers.driver.validateOptimal,
  trackingHandlers.driver.calculateOptimal,
);
router.post(
  "/tracking/:tripId/recalculate",
  trackingHandlers.driver.validateOptimal,
  trackingHandlers.driver.recalculate,
);
router.patch(
  "/tracking/:tripId/position",
  trackingHandlers.driver.validateUpdatePosition,
  trackingHandlers.driver.updatePosition,
);

// --- Google Maps ---
router.post(
  "/googlemaps/calculate",
  googlemapsHandlers.driver.validateCalculate,
  googlemapsHandlers.driver.calculate,
);
router.post(
  "/googlemaps/:tripId/recalculate",
  googlemapsHandlers.driver.validateRecalculate,
  googlemapsHandlers.driver.recalculate,
);
router.patch(
  "/googlemaps/:tripId/position",
  googlemapsHandlers.driver.validateUpdatePosition,
  googlemapsHandlers.driver.updatePosition,
);

export default router;
