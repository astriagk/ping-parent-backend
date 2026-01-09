import { Router } from "express";

import { authRoutes } from "@modules/auth";

import adminRoutes from "../modules/admin/admin/admin.routes";
import auditLogsRoutes from "../modules/admin/audit-log/audit_logs.routes";
import roleRoutes from "../modules/admin/role/role.routes";
import parentSubscriptionRoutes from "../modules/billing/parent-subscription/parent_subscription.routes";
import paymentRoutes from "../modules/billing/payment/payment.routes";
import subscriptionPlanRoutes from "../modules/billing/subscription-plan/subscription_plan.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import ratingReviewRoutes from "../modules/reviews/rating_review.routes";
import schoolRoutes from "../modules/school/school.routes";
// Import routes in order matching Postman collection structure
import dailyQrOtpRoutes from "../modules/trips/daily-qr-otp/daily_qr_otp.routes";
import driverStudentAssignmentRoutes from "../modules/trips/driver-student-assignment/driverStudentAssignment.routes";
import tripStudentRoutes from "../modules/trips/trip-student/trip_student.routes";
import tripRoutes from "../modules/trips/trip/trip.routes";
import driverRoutes from "../modules/users/driver/driver.routes";
import parentRoutes from "../modules/users/parent/parent.routes";
import studentRoutes from "../modules/users/student/student.routes";

const router = Router();

// 01. Authentication & User Management
router.use("/auth", authRoutes);

// 02. Parent APIs
router.use("/parent", parentRoutes);

// 03. Driver APIs
router.use("/driver", driverRoutes);

// 04. Student APIs
router.use("/students", studentRoutes);

// 05. School APIs
router.use("/schools", schoolRoutes);

// 06. Assignment & Trip APIs
router.use("/driver-student-assignments", driverStudentAssignmentRoutes);
router.use("/trips", tripRoutes);

// 07. Attendance & QR/OTP APIs
router.use("/daily-qr-otp", dailyQrOtpRoutes);
router.use("/trip-students", tripStudentRoutes);

// 08. Notification APIs
router.use("/notifications", notificationRoutes);

// 09. Subscription & Payment APIs
router.use("/subscription-plans", subscriptionPlanRoutes);
router.use("/parent-subscriptions", parentSubscriptionRoutes);
router.use("/payments", paymentRoutes);

// 10. Ratings & Reviews APIs
router.use("/ratings-reviews", ratingReviewRoutes);

// 11. Admin Portal APIs
router.use("/admin", adminRoutes);

// 12. Role Management
router.use("/roles", roleRoutes);

// Audit Logs (part of Admin Portal)
router.use("/audit-logs", auditLogsRoutes);

export default router;
