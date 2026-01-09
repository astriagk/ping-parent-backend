import { Router } from "express";

import { authRoutes } from "@modules/auth";

import adminRoutes from "./admin/admin.routes";
import auditLogsRoutes from "./audit_logs.routes";
// Import routes in order matching Postman collection structure
import dailyQrOtpRoutes from "./daily_qr_otp.routes";
import driverRoutes from "./driver.routes";
import driverStudentAssignmentRoutes from "./driverStudentAssignment.routes";
import notificationRoutes from "./notification.routes";
import parentRoutes from "./parent.routes";
import parentSubscriptionRoutes from "./parent_subscription.routes";
import paymentRoutes from "./payment.routes";
import ratingReviewRoutes from "./rating_review.routes";
import roleRoutes from "./role.routes";
import schoolRoutes from "./school.routes";
import studentRoutes from "./student.routes";
import subscriptionPlanRoutes from "./subscription_plan.routes";
import tripRoutes from "./trip.routes";
import tripStudentRoutes from "./trip_student.routes";

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
