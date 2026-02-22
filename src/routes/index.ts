import { Router } from "express";

import {
  adminManagementRoutes,
  auditLogRoutes,
  roleRoutes,
} from "@modules/admin";
import { authRoutes } from "@modules/auth";
import {
  parentSubscriptionRoutes,
  paymentRoutes,
  razorpayRoutes,
  redemptionRoutes,
  schoolSubscriptionRoutes,
  subscriptionPlanRoutes,
} from "@modules/billing";
import { notificationRoutes } from "@modules/notification";
import { ratingReviewRoutes } from "@modules/reviews";
import { schoolRoutes } from "@modules/school";
import trackingRouter from "@modules/tracking";
import {
  dailyQrOtpRoutes,
  driverStudentAssignmentRoutes,
  schoolAssignmentRoutes,
  tripRoutes,
  tripStudentRoutes,
} from "@modules/trips";
import {
  driverRoutes,
  parentRoutes,
  schoolDriverRoutes,
  studentRoutes,
} from "@modules/users";

const router = Router();

// 01. Authentication & User Management
router.use("/auth", authRoutes);

// 02. Parent APIs
router.use("/parent", parentRoutes);

// 03. Driver APIs
router.use("/driver", driverRoutes);

// 03.5 School Driver APIs
router.use("/school-driver", schoolDriverRoutes);

// 04. Student APIs
router.use("/students", studentRoutes);

// 05. School APIs
router.use("/schools", schoolRoutes);

// 06. Assignment & Trip APIs
router.use("/driver-student-assignments", driverStudentAssignmentRoutes);
router.use("/school-assignments", schoolAssignmentRoutes);
router.use("/trips", tripRoutes);

// 06.5 Tracking & Real-time Tracking APIs
router.use("/tracking", trackingRouter);

// 07. Attendance & QR/OTP APIs
router.use("/daily-qr-otp", dailyQrOtpRoutes);
router.use("/trip-students", tripStudentRoutes);

// 08. Notification APIs
router.use("/notifications", notificationRoutes);

// 09. Subscription & Payment APIs
router.use("/subscription-plans", subscriptionPlanRoutes);
router.use("/parent-subscriptions", parentSubscriptionRoutes);
router.use("/school-subscriptions", schoolSubscriptionRoutes);
router.use("/payments", paymentRoutes);
router.use("/redemptions", redemptionRoutes);
router.use("/razorpay", razorpayRoutes);

// 10. Ratings & Reviews APIs
router.use("/ratings-reviews", ratingReviewRoutes);

// 11. Admin Portal APIs
router.use("/admin", adminManagementRoutes);

// 12. Role Management
router.use("/roles", roleRoutes);

// Audit Logs (part of Admin Portal)
router.use("/audit-logs", auditLogRoutes);

export default router;
