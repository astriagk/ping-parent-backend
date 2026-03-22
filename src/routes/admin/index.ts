import { Router } from "express";

import { verifyAdminOrAboveToken } from "@shared/middlewares";

import assignmentsRouter from "./assignments.routes";
import auditLogsRouter from "./audit-logs.routes";
import authRouter from "./auth.routes";
import googlemapsRouter from "./googlemaps.routes";
import paymentsRouter from "./payments.routes";
import schoolAssignmentsRouter from "./school-assignments.routes";
import schoolDriversRouter from "./school-drivers.routes";
import schoolSubscriptionsRouter from "./school-subscriptions.routes";
import schoolsRouter from "./schools.routes";
import studentsRouter from "./students.routes";
import subscriptionPlansRouter from "./subscription-plans.routes";
import subscriptionsRouter from "./subscriptions.routes";
import supportTicketsRouter from "./support-tickets.routes";
import trackingRouter from "./tracking.routes";
import tripsRouter from "./trips.routes";
import usersRouter from "./users.routes";

const router = Router();

/**
 * ADMIN GATEWAY — admin + superadmin shared operations
 * Public sub-routes (login) are above the auth middleware.
 * Everything below verifyAdminOrAboveToken requires admin or superadmin.
 */

// --- Public sub-routes (no auth) ---
router.use("/", authRouter);

// --- Everything below requires admin or superadmin token ---
router.use(verifyAdminOrAboveToken);

router.use("/", usersRouter);
router.use("/", schoolsRouter);
router.use("/", schoolDriversRouter);
router.use("/", schoolAssignmentsRouter);
router.use("/", studentsRouter);
router.use("/", assignmentsRouter);
router.use("/", tripsRouter);
router.use("/", paymentsRouter);
router.use("/", subscriptionsRouter);
router.use("/", subscriptionPlansRouter);
router.use("/", schoolSubscriptionsRouter);
router.use("/", trackingRouter);
router.use("/", googlemapsRouter);
router.use("/", auditLogsRouter);
router.use("/", supportTicketsRouter);

export default router;
