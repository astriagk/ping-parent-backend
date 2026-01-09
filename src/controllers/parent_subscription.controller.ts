import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import {
  cancelParentSubscription,
  createParentSubscription as createParentSubscriptionService,
  deleteParentSubscription,
  getActiveParentSubscriptionByUserId,
  getAllParentSubscriptions,
  getParentSubscriptionById,
  getParentSubscriptionsByUserId,
  updateParentSubscription,
} from "@shared/services/parent_subscription.service";

// NOTE: Exports WITHOUT "Controller" suffix

/**
 * Get all parent subscriptions (admin only)
 */
export const getAllParentSubscriptionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriptions = await getAllParentSubscriptions();

    return res.json({
      success: true,
      data: subscriptions,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const createSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From JWT token

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const subscriptionData = req.body; // Does NOT include parent_id

    const subscription = await createParentSubscriptionService(
      userId,
      subscriptionData,
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.CREATED_SUCCESSFULLY,
    });
  },
);

export const getSubscriptionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await getParentSubscriptionById(id);

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMySubscriptions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const subscriptions = await getParentSubscriptionsByUserId(userId);

    return res.json({
      success: true,
      data: subscriptions,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMyActiveSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const subscription = await getActiveParentSubscriptionByUserId(userId);

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.FETCHED_SUCCESSFULLY,
    });
  },
);

export const updateSubscriptionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const subscription = await updateParentSubscription(id, updates);

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.UPDATED_SUCCESSFULLY,
    });
  },
);

export const cancelSubscriptionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await cancelParentSubscription(id);

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.CANCELLED_SUCCESSFULLY,
    });
  },
);

export const deleteSubscriptionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await deleteParentSubscription(id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.DELETED_SUCCESSFULLY,
    });
  },
);
