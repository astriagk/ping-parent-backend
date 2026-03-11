import { Router } from "express";

import { deviceTokenHandlers } from "@modules/device_token/device-token.routes";
import { fileUploadHandlers } from "@modules/file-upload/file-upload.routes";
import { googlemapsHandlers } from "@modules/googlemaps/googlemaps.routes";
import { notificationHandlers } from "@modules/notification/notification.routes";
import { notificationPreferencesHandlers } from "@modules/notification_preferences/notification-preferences.routes";
import { schoolHandlers } from "@modules/school/school.routes";
import { supportTicketHandlers } from "@modules/support_tickets/support_tickets.routes";
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

// --- Support Tickets ---
router.post(
  "/support-tickets",
  supportTicketHandlers.shared.validateCreate,
  supportTicketHandlers.shared.create,
);
router.get("/support-tickets", supportTicketHandlers.shared.getMyTickets);
router.get("/support-tickets/:id", supportTicketHandlers.shared.getById);
router.post("/support-tickets/:id/close", supportTicketHandlers.shared.close);

// --- File Upload ---
router.post(
  "/upload",
  fileUploadHandlers.shared.uploadMiddleware,
  fileUploadHandlers.shared.upload,
);
router.put(
  "/upload",
  fileUploadHandlers.shared.uploadMiddleware,
  fileUploadHandlers.shared.update,
);

// --- Google Maps (read-only for any authenticated user) ---
router.get(
  "/googlemaps/:tripId/tracking",
  googlemapsHandlers.shared.getTracking,
);
router.get(
  "/googlemaps/:tripId/current-position",
  googlemapsHandlers.shared.getCurrentPosition,
);
router.get(
  "/googlemaps/:tripId/details",
  googlemapsHandlers.shared.getRouteDetails,
);

export default router;
