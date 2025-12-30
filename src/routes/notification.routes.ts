import { Router } from "express";

import {
  getNotifications,
  getUnreadCount,
  getUnreadNotifications,
  markAllAsRead,
  markAsRead,
} from "@controllers/notification.controller";
import { verifyToken_Middleware } from "@middlewares";

const router = Router();

// All routes require authentication (any user type)
router.use(verifyToken_Middleware);

// Notification operations
router.get("/", getNotifications);
router.get("/unread", getUnreadNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/:id/mark-as-read", markAsRead);
router.put("/mark-all-as-read", markAllAsRead);

export default router;
