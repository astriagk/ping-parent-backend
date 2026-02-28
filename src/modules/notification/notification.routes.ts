import {
  getNotifications,
  getUnreadCount,
  getUnreadNotifications,
  markAllAsRead,
  markAsRead,
} from "./notification.controller";

/**
 * Handler group for notification module.
 * Import in src/routes/shared.routes.ts — NO auth middleware here.
 */
export const notificationHandlers = {
  // Shared (any authenticated user)
  getAll: getNotifications,
  getUnread: getUnreadNotifications,
  getUnreadCount: getUnreadCount,
  markAsRead: markAsRead,
  markAllAsRead: markAllAsRead,
};
