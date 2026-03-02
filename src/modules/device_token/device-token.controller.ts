import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import * as deviceTokenService from "./device-token.service";

export const registerDeviceToken = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const { fcm_token, device_type, device_id } = req.body;

    const token = await deviceTokenService.registerToken(
      userId,
      role,
      fcm_token,
      device_type,
      device_id,
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { id: token._id },
      message: SUCCESS_MESSAGES.NOTIFICATION.TOKEN_REGISTERED,
    });
  },
);

export const removeDeviceToken = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const { fcm_token } = req.body;
    await deviceTokenService.removeToken(fcm_token);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.NOTIFICATION.TOKEN_REMOVED,
    });
  },
);
