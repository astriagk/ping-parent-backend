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
  getMySubscriptionDetails as getMySubscriptionDetailsService,
  getParentSubscriptionById,
  getParentSubscriptionsByUserId,
  getSubscriptionRecommendations,
  updateParentSubscription,
  upgradeParentSubscription as upgradeParentSubscriptionService,
} from "./parent_subscription.service";

/**
 * Get subscription recommendations for the authenticated parent
 */
export const getRecommendations = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const recommendations = await getSubscriptionRecommendations(userId);

    return res.json({
      success: true,
      data: recommendations,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.RECOMMENDATIONS_FETCHED,
    });
  },
);

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
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const result = await createParentSubscriptionService(userId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result.subscription,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.CREATED_SUCCESSFULLY,
    });
  },
);

export const getSubscriptionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

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
    const userId = req.user?.userId;

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
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const subscriptions = await getActiveParentSubscriptionByUserId(userId);

    return res.json({
      success: true,
      data: subscriptions,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMySubscriptionDetailsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const details = await getMySubscriptionDetailsService(userId);

    return res.json({
      success: true,
      data: details,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.DETAILS_FETCHED,
    });
  },
);

export const updateSubscriptionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
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
    const { id } = req.params as Record<string, string>;

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

export const upgradeSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const result = await upgradeParentSubscriptionService(userId, req.body);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        old_subscription_id: result.old_subscription_id,
        new_subscription: result.new_subscription,
        proration: result.proration,
      },
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
      message: SUCCESS_MESSAGES.PARENT_SUBSCRIPTION.UPGRADED_SUCCESSFULLY,
    });
  },
);

export const deleteSubscriptionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

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
