import { Router } from "express";

import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import dailyQrOtpRoutes from "./daily_qr_otp.routes";
import driverRoutes from "./driver.routes";
import driverStudentAssignmentRoutes from "./driverStudentAssignment.routes";
import notificationRoutes from "./notification.routes";
import parentRoutes from "./parent.routes";
import parentSubscriptionRoutes from "./parent_subscription.routes";
import paymentRoutes from "./payment.routes";
import roleRoutes from "./role.routes";
import schoolRoutes from "./school.routes";
import studentRoutes from "./student.routes";
import subscriptionPlanRoutes from "./subscription_plan.routes";
import tripRoutes from "./trip.routes";
import tripStudentRoutes from "./trip_student.routes";

const router = Router();

router.use("/admin", adminRoutes);
router.use("/roles", roleRoutes);
router.use("/auth", authRoutes);
router.use("/parent", parentRoutes);
router.use("/driver", driverRoutes);
router.use("/students", studentRoutes);
router.use("/schools", schoolRoutes);
router.use("/driver-student-assignments", driverStudentAssignmentRoutes);
router.use("/trips", tripRoutes);
router.use("/trip-students", tripStudentRoutes);
router.use("/daily-qr-otp", dailyQrOtpRoutes);
router.use("/notifications", notificationRoutes);
router.use("/subscription-plans", subscriptionPlanRoutes);
router.use("/parent-subscriptions", parentSubscriptionRoutes);
router.use("/payments", paymentRoutes);

export default router;
