import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import * as notificationPreferencesService from "./notification-preferences.service";

export const getNotificationPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const preferences =
      await notificationPreferencesService.getPreferences(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: preferences,
      message: SUCCESS_MESSAGES.NOTIFICATION.PREFERENCES_FETCHED,
    });
  },
);

export const updateNotificationPreferences = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const { push_enabled } = req.body;

    const preferences = await notificationPreferencesService.updatePreferences(
      userId,
      push_enabled,
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: preferences,
      message: SUCCESS_MESSAGES.NOTIFICATION.PREFERENCES_UPDATED,
    });
  },
);
