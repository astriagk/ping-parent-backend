import { Router } from "express";

import { notificationHandlers } from "@modules/notification/notification.routes";
import { notificationPreferencesHandlers } from "@modules/notification_preferences/notification-preferences.routes";

const router = Router();

// --- Notifications ---
router.get("/notifications", notificationHandlers.getAll);
router.get("/notifications/unread", notificationHandlers.getUnread);
router.get("/notifications/unread-count", notificationHandlers.getUnreadCount);
router.put("/notifications/:id/mark-as-read", notificationHandlers.markAsRead);
router.put(
  "/notifications/mark-all-as-read",
  notificationHandlers.markAllAsRead,
);

// --- Notification Preferences ---
router.get(
  "/notifications/preferences",
  notificationPreferencesHandlers.shared.get,
);
router.put(
  "/notifications/preferences",
  notificationPreferencesHandlers.shared.validateUpdate,
  notificationPreferencesHandlers.shared.update,
);

export default router;
