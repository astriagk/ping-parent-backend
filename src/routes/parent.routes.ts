import { Router } from "express";

import { subscriptionHandlers } from "@modules/billing/parent_subscription/parent_subscription.routes";
import { paymentHandlers } from "@modules/billing/payment/payment.routes";
import { redemptionHandlers } from "@modules/billing/redemption/redemption.routes";
import { reviewHandlers } from "@modules/reviews/rating_review.routes";
import { qrOtpHandlers } from "@modules/trips/daily_qr_otp/daily_qr_otp.routes";
import { assignmentHandlers } from "@modules/trips/driver_student_assignment/driver_student_assignment.routes";
import { parentHandlers } from "@modules/users/parent/parent.routes";
import { studentHandlers } from "@modules/users/student/student.routes";
import { verifyParentToken } from "@shared/middlewares";

const router = Router();

/**
 * PARENT GATEWAY — verifyParentToken applied ONCE
 * All routes below require parent token.
 */
router.use(verifyParentToken);

// --- Profile ---
router.get("/profile", parentHandlers.getProfile);
router.put(
  "/profile",
  parentHandlers.validateUpdate,
  parentHandlers.updateProfile,
);
router.get("/address", parentHandlers.getAddress);
router.put(
  "/address",
  parentHandlers.validateAddress,
  parentHandlers.updateAddress,
);

// --- Trips (read-only for parents) ---
router.get("/trips", parentHandlers.getAllTrips);
router.get("/trips/active", parentHandlers.getActiveTrips);

// --- Students ---
router.post(
  "/students",
  studentHandlers.validateCreate,
  studentHandlers.create,
);
router.get("/students", studentHandlers.getMyStudents);
router.get("/students/active", studentHandlers.getMyActiveStudents);
router.get("/students/:id", studentHandlers.getById);
router.put(
  "/students/:id",
  studentHandlers.validateUpdate,
  studentHandlers.update,
);
router.delete("/students/:id", studentHandlers.delete);
router.get(
  "/students/by-student-id/:student_id",
  studentHandlers.getByStudentId,
);
router.put(
  "/students/by-student-id/:student_id",
  studentHandlers.validateUpdate,
  studentHandlers.updateByStudentId,
);
router.delete(
  "/students/by-student-id/:student_id",
  studentHandlers.deleteByStudentId,
);

// --- Assignments ---
router.post(
  "/assignments",
  assignmentHandlers.validateCreate,
  assignmentHandlers.create,
);
router.get("/assignments/all-drivers", assignmentHandlers.getAllDrivers);
router.get("/assignments/student/:studentId", assignmentHandlers.getByStudent);
router.get("/assignments/:id", assignmentHandlers.getById);
router.put(
  "/assignments/:id",
  assignmentHandlers.validateUpdate,
  assignmentHandlers.update,
);
router.delete("/assignments/:id", assignmentHandlers.delete);

// --- QR / OTP ---
router.get(
  "/qr-otp/student/:studentId/trip/:tripId",
  qrOtpHandlers.parent.getForStudentTrip,
);
router.get("/qr-otp/trip/:tripId", qrOtpHandlers.parent.getForTrip);

// --- Payments ---
router.post(
  "/payments",
  paymentHandlers.parent.validateCreate,
  paymentHandlers.parent.create,
);
router.post("/payments/:id/complete", paymentHandlers.parent.complete);
router.get("/payments", paymentHandlers.parent.getMyPayments);
router.get("/payments/pending", paymentHandlers.parent.getMyPending);
router.get("/payments/completed", paymentHandlers.parent.getMyCompleted);
router.get("/payments/:id", paymentHandlers.parent.getById);
router.put(
  "/payments/:id",
  paymentHandlers.parent.validateUpdate,
  paymentHandlers.parent.update,
);
router.post("/payments/:id/refund", paymentHandlers.parent.refund);

// --- Subscriptions ---
router.get(
  "/subscriptions/recommendations",
  subscriptionHandlers.parent.getRecommendations,
);
router.post(
  "/subscriptions",
  subscriptionHandlers.parent.validateCreate,
  subscriptionHandlers.parent.create,
);
router.get("/subscriptions", subscriptionHandlers.parent.getMySubscriptions);
router.get("/subscriptions/active", subscriptionHandlers.parent.getMyActive);
router.get("/subscriptions/details", subscriptionHandlers.parent.getMyDetails);
router.post(
  "/subscriptions/upgrade",
  subscriptionHandlers.parent.validateUpgrade,
  subscriptionHandlers.parent.upgrade,
);
router.get("/subscriptions/:id", subscriptionHandlers.parent.getById);
router.put(
  "/subscriptions/:id",
  subscriptionHandlers.parent.validateUpdate,
  subscriptionHandlers.parent.update,
);
router.post("/subscriptions/:id/cancel", subscriptionHandlers.parent.cancel);
router.delete("/subscriptions/:id", subscriptionHandlers.parent.delete);

// --- Redemptions ---
router.post(
  "/redemptions/redeem",
  redemptionHandlers.parent.validateRedeem,
  redemptionHandlers.parent.redeem,
);
router.get("/redemptions/active", redemptionHandlers.parent.getActive);
router.get("/redemptions", redemptionHandlers.parent.getAll);
router.get("/redemptions/status/check", redemptionHandlers.parent.checkStatus);
router.get("/redemptions/:subscriptionId", redemptionHandlers.parent.getById);
router.post(
  "/redemptions/cancel",
  redemptionHandlers.parent.validateCancel,
  redemptionHandlers.parent.cancel,
);

// --- Reviews ---
router.post(
  "/reviews",
  reviewHandlers.parent.validateCreate,
  reviewHandlers.parent.create,
);
router.get("/reviews", reviewHandlers.parent.getMyReviews);
router.get("/reviews/:id", reviewHandlers.parent.getById);
router.put(
  "/reviews/:id",
  reviewHandlers.parent.validateUpdate,
  reviewHandlers.parent.update,
);
router.delete("/reviews/:id", reviewHandlers.parent.delete);

export default router;
