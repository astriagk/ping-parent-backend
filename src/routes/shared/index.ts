import { Router } from "express";

import { verifyToken_Middleware } from "@shared/middlewares";

import deviceTokensRouter from "./device-tokens.routes";
import notificationsRouter from "./notifications.routes";
import schoolsRouter from "./schools.routes";
import supportTicketsRouter from "./support-tickets.routes";
import trackingRouter from "./tracking.routes";
import uploadRouter from "./upload.routes";

const router = Router();

/**
 * SHARED GATEWAY — Any authenticated user (parent or driver)
 * verifyToken_Middleware applied ONCE at the top.
 */
router.use(verifyToken_Middleware);

router.use("/", notificationsRouter);
router.use("/", deviceTokensRouter);
router.use("/", trackingRouter);
router.use("/", schoolsRouter);
router.use("/", supportTicketsRouter);
router.use("/", uploadRouter);

export default router;
