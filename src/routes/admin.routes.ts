import { Router } from "express";

import { adminMgmtHandlers } from "@modules/admin/admin_management/admin_management.routes";
import { auditLogHandlers } from "@modules/admin/audit_log/audit_log.routes";
import { authHandlers } from "@modules/auth/auth.routes";
import { subscriptionHandlers } from "@modules/billing/parent_subscription/parent_subscription.routes";
import { paymentHandlers } from "@modules/billing/payment/payment.routes";
import { schoolSubscriptionHandlers } from "@modules/billing/school_subscription/school_subscription.routes";
import { subscriptionPlanHandlers } from "@modules/billing/subscription_plan/subscription_plan.routes";
import { schoolHandlers } from "@modules/school/school.routes";
import { trackingHandlers } from "@modules/tracking/tracking.routes";
import { assignmentHandlers } from "@modules/trips/driver_student_assignment/driver_student_assignment.routes";
import { schoolAssignmentHandlers } from "@modules/trips/school_assignment/school_assignment.routes";
import { tripHandlers } from "@modules/trips/trip/trip.routes";
import { schoolDriverHandlers } from "@modules/users/school_driver/school_driver.routes";
import { studentHandlers } from "@modules/users/student/student.routes";
import { verifyAdminOrAboveToken } from "@shared/middlewares";

const router = Router();

/**
 * ADMIN GATEWAY — admin + superadmin shared operations
 * Public sub-routes (login) are above the auth middleware.
 * Everything below verifyAdminOrAboveToken requires admin or superadmin.
 */

// --- Public sub-routes (no auth) ---
router.post(
  "/auth/verify-password-hash",
  adminMgmtHandlers.public.validatePasswordHash,
  adminMgmtHandlers.public.verifyPasswordHash,
);
router.post(
  "/auth/login",
  adminMgmtHandlers.public.validateLogin,
  adminMgmtHandlers.public.login,
);
router.post(
  "/auth/setup/create-superadmin",
  adminMgmtHandlers.public.validateCreateSuperAdmin,
  adminMgmtHandlers.public.createInitialSuperAdmin,
);
router.get("/auth/verify-token", adminMgmtHandlers.public.verifyAdminToken);

// --- Everything below requires admin or superadmin token ---
router.use(verifyAdminOrAboveToken);

// --- Users (from auth module) ---
router.get("/users", authHandlers.admin.getAllUsers);
router.patch("/users/:id/activate", authHandlers.admin.activateUser);
router.patch("/users/:id/deactivate", authHandlers.admin.deactivateUser);

// --- User Management (from admin_management module) ---
router.get("/management/users", adminMgmtHandlers.admin.getAllUsers);
router.get("/management/users/:id", adminMgmtHandlers.admin.getUserById);
router.put(
  "/management/users/:id",
  adminMgmtHandlers.admin.validateUpdateUser,
  adminMgmtHandlers.admin.updateUser,
);
router.patch(
  "/management/users/:id/activate",
  adminMgmtHandlers.admin.activateUser,
);
router.patch(
  "/management/users/:id/deactivate",
  adminMgmtHandlers.admin.deactivateUser,
);
router.delete("/management/users/:id", adminMgmtHandlers.admin.deleteUser);
router.get(
  "/management/drivers/:id/details",
  adminMgmtHandlers.admin.getDriverDetails,
);
router.get(
  "/management/parents/:id/details",
  adminMgmtHandlers.admin.getParentDetails,
);
router.patch(
  "/management/drivers/:id/approval-status",
  adminMgmtHandlers.admin.updateDriverApproval,
);
router.get(
  "/management/by-school/:school_id",
  adminMgmtHandlers.admin.getAdminsBySchool,
);

// --- Schools ---
router.get("/schools", schoolHandlers.shared.getAll);
router.get("/schools/:school_id", schoolHandlers.shared.getById);
router.post(
  "/schools",
  schoolHandlers.admin.validateCreate,
  schoolHandlers.admin.create,
);
router.put(
  "/schools/:school_id",
  schoolHandlers.admin.validateUpdate,
  schoolHandlers.admin.update,
);
router.delete("/schools/:school_id", schoolHandlers.admin.delete);

// --- School Drivers ---
router.get("/school-drivers/:schoolId", schoolDriverHandlers.admin.getBySchool);
router.post("/school-drivers/assign", schoolDriverHandlers.admin.assign);
router.post(
  "/school-drivers/:driverId/remove",
  schoolDriverHandlers.admin.remove,
);
router.get(
  "/school-drivers/:driverId/details",
  schoolDriverHandlers.admin.getDetails,
);

// --- School Assignments ---
router.get(
  "/school-assignments/:schoolId",
  schoolAssignmentHandlers.admin.getBySchool,
);
router.get(
  "/school-assignments/:schoolId/pending",
  schoolAssignmentHandlers.admin.getPending,
);
router.get(
  "/school-assignments/:schoolId/driver/:driverId",
  schoolAssignmentHandlers.admin.getByDriver,
);
router.post(
  "/school-assignments/:schoolId/create",
  schoolAssignmentHandlers.admin.validateCreate,
  schoolAssignmentHandlers.admin.create,
);
router.post(
  "/school-assignments/:assignmentId/approve",
  schoolAssignmentHandlers.admin.approve,
);
router.post(
  "/school-assignments/:assignmentId/reject",
  schoolAssignmentHandlers.admin.validateReject,
  schoolAssignmentHandlers.admin.reject,
);

// --- Students ---
router.get("/students/school/:schoolId", studentHandlers.getBySchool);

// --- Assignments ---
router.get("/assignments", assignmentHandlers.admin.getAll);
router.get(
  "/assignments/parent-requested",
  assignmentHandlers.admin.getParentRequested,
);

// --- Trips ---
router.get("/trips", tripHandlers.admin.getAll);

// --- Payments ---
router.get("/payments", paymentHandlers.admin.getAll);
router.get("/payments/:id", paymentHandlers.admin.getById);

// --- Subscriptions (parent) ---
router.get("/subscriptions", subscriptionHandlers.admin.getAll);

// --- Subscription Plans ---
router.post(
  "/subscription-plans",
  subscriptionPlanHandlers.admin.validateCreate,
  subscriptionPlanHandlers.admin.create,
);
router.put(
  "/subscription-plans/:id",
  subscriptionPlanHandlers.admin.validateUpdate,
  subscriptionPlanHandlers.admin.update,
);
router.patch(
  "/subscription-plans/:id/activate",
  subscriptionPlanHandlers.admin.activate,
);
router.patch(
  "/subscription-plans/:id/deactivate",
  subscriptionPlanHandlers.admin.deactivate,
);

// --- School Subscriptions ---
router.post(
  "/school-subscriptions",
  schoolSubscriptionHandlers.admin.validateCreate,
  schoolSubscriptionHandlers.admin.create,
);
router.get(
  "/school-subscriptions/school/:schoolId",
  schoolSubscriptionHandlers.admin.getBySchool,
);
router.get(
  "/school-subscriptions/school/:schoolId/active",
  schoolSubscriptionHandlers.admin.getActiveBySchool,
);
router.get(
  "/school-subscriptions/expired/list",
  schoolSubscriptionHandlers.admin.getExpired,
);
router.get(
  "/school-subscriptions/:subscriptionId",
  schoolSubscriptionHandlers.admin.getById,
);
router.patch(
  "/school-subscriptions/:subscriptionId",
  schoolSubscriptionHandlers.admin.validateUpdate,
  schoolSubscriptionHandlers.admin.update,
);
router.post(
  "/school-subscriptions/:subscriptionId/renew",
  schoolSubscriptionHandlers.admin.validateRenew,
  schoolSubscriptionHandlers.admin.renew,
);
router.post(
  "/school-subscriptions/:subscriptionId/cancel",
  schoolSubscriptionHandlers.admin.validateCancel,
  schoolSubscriptionHandlers.admin.cancel,
);
router.post(
  "/school-subscriptions/:subscriptionId/generate-codes",
  schoolSubscriptionHandlers.admin.validateGenerateCodes,
  schoolSubscriptionHandlers.admin.generateCodes,
);
router.get(
  "/school-subscriptions/:subscriptionId/codes",
  schoolSubscriptionHandlers.admin.getCodes,
);

// --- Tracking ---
router.post("/tracking/cleanup", trackingHandlers.admin.cleanup);

// --- Audit Logs ---
router.get("/audit-logs", auditLogHandlers.getAll);
router.get("/audit-logs/:id", auditLogHandlers.getById);

export default router;
