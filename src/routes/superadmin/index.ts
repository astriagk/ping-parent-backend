import { Router } from "express";

import { verifySuperadminToken } from "@shared/middlewares";

import adminsRouter from "./admins.routes";
import auditLogsRouter from "./audit-logs.routes";
import rolesRouter from "./roles.routes";

const router = Router();

/**
 * SUPERADMIN GATEWAY — superadmin only
 * Platform-level operations: admin account management, role management, full audit logs
 */
router.use(verifySuperadminToken);

router.use("/", adminsRouter);
router.use("/", rolesRouter);
router.use("/", auditLogsRouter);

export default router;
