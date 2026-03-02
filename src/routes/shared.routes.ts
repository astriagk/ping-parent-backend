import { Router } from "express";

import { deviceTokenHandlers } from "@modules/device_token/device-token.routes";
import { notificationHandlers } from "@modules/notification/notification.routes";
import { notificationPreferencesHandlers } from "@modules/notification_preferences/notification-preferences.routes";
import { schoolHandlers } from "@modules/school/school.routes";
import { trackingHandlers } from "@modules/tracking/tracking.routes";
import { verifyToken_Middleware } from "@shared/middlewares";

const router = Router();

/**
 * SHARED GATEWAY — Any authenticated user (parent or driver)
 * verifyToken_Middleware applied ONCE at the top.
 */
router.use(verifyToken_Middleware);

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

// --- Device Tokens (FCM push notifications) ---
router.post(
  "/device-tokens/register",
  deviceTokenHandlers.shared.validateRegister,
  deviceTokenHandlers.shared.register,
);
router.post(
  "/device-tokens/remove",
  deviceTokenHandlers.shared.validateRemove,
  deviceTokenHandlers.shared.remove,
);

// --- Tracking (read-only for any authenticated user) ---
router.get("/tracking/:tripId/tracking", trackingHandlers.shared.getTracking);
router.get(
  "/tracking/:tripId/current-position",
  trackingHandlers.shared.getCurrentPosition,
);
router.get(
  "/tracking/:tripId/details",
  trackingHandlers.shared.getRouteDetails,
);

// --- Schools (read-only for any authenticated user) ---
router.get("/schools", schoolHandlers.shared.getAll);
router.get("/schools/:school_id", schoolHandlers.shared.getById);

export default router;
