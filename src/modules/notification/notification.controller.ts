import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  SUCCESS_MESSAGES_COMMON,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  getNotificationsByUserId,
  getUnreadCountByUserId,
  getUnreadNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notification.service";

// Get all notifications for authenticated user
export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const notifications = await getNotificationsByUserId(userId);

    return res.json({
      success: true,
      data: notifications,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

// Get unread notifications for authenticated user
export const getUnreadNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const notifications = await getUnreadNotificationsByUserId(userId);

    return res.json({
      success: true,
      data: notifications,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

// Get unread count for authenticated user
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const count = await getUnreadCountByUserId(userId);

    return res.json({
      success: true,
      data: { unread_count: count },
    });
  },
);

// Mark single notification as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as Record<string, string>;
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.COMMON.UNAUTHORIZED,
    );
  }

  const notification = await markNotificationAsRead(id);

  if (!notification) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.NOTIFICATION.NOT_FOUND,
    );
  }

  return res.json({
    success: true,
    data: notification,
    message: SUCCESS_MESSAGES.NOTIFICATION.MARKED_AS_READ_SUCCESSFULLY,
  });
});

// Mark all notifications as read for authenticated user
export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const modifiedCount = await markAllNotificationsAsRead(userId);

    return res.json({
      success: true,
      data: { modified_count: modifiedCount },
      message: SUCCESS_MESSAGES.NOTIFICATION.MARKED_AS_READ_SUCCESSFULLY,
    });
  },
);
