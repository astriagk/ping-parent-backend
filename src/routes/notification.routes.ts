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

// 01. Get All Notifications
router.get("/", getNotifications);

// 02. Get Unread Notifications
router.get("/unread", getUnreadNotifications);

// 03. Get Unread Count
router.get("/unread-count", getUnreadCount);

// 04. Mark Notification as Read
router.put("/:id/mark-as-read", markAsRead);

// 05. Mark All as Read
router.put("/mark-all-as-read", markAllAsRead);

export default router;
