import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  cancelParentSubscription as cancelParentSubscriptionService,
  checkParentSubscriptionActive as checkParentSubscriptionActiveService,
  getAvailableRedemptionCodes as getAvailableRedemptionCodesService,
  getParentActiveSubscription as getParentActiveSubscriptionService,
  getParentSubscriptions as getParentSubscriptionsService,
  getSubscriptionDetails as getSubscriptionDetailsService,
  redeemSchoolSubscriptionCode as redeemSchoolSubscriptionCodeService,
} from "./redemption.service";

/**
 * Redeem school subscription code (parent)
 * @route POST /api/v1/parent/subscriptions/redemption/redeem
 */
export const redeemCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.COMMON.UNAUTHORIZED,
    );
  }

  const { subscription_code } = req.body;

  const result = await redeemSchoolSubscriptionCodeService(
    userId,
    subscription_code,
  );

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: result.subscription,
    message:
      SUCCESS_MESSAGES.SUBSCRIPTION_REDEMPTION.CODE_REDEEMED_SUCCESSFULLY,
  });
});

/**
 * Get active subscription (parent)
 * Returns the active subscription with plan + student details.
 * A parent may have multiple active subscriptions (one paid + one or more redeemed).
 * This returns the most recent active subscription with full details.
 * @route GET /api/v1/parent/subscriptions/redemption/active
 */
export const getActiveSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const subscription = await getParentActiveSubscriptionService(userId);

    return res.json({
      success: true,
      data: subscription,
      message:
        SUCCESS_MESSAGES.SUBSCRIPTION_REDEMPTION.ACTIVE_SUBSCRIPTION_RETRIEVED,
    });
  },
);

/**
 * Get all subscriptions (parent)
 * Returns all subscriptions with plan + student details (aggregated).
 * @route GET /api/v1/parent/subscriptions/redemption
 */
export const getParentSubscriptions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const subscriptions = await getParentSubscriptionsService(userId);

    return res.json({
      success: true,
      data: subscriptions,
      message: SUCCESS_MESSAGES.SUBSCRIPTION_REDEMPTION.SUBSCRIPTIONS_RETRIEVED,
    });
  },
);

/**
 * Cancel subscription (parent)
 * @route POST /api/v1/parent/subscriptions/redemption/cancel
 */
export const cancelSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { subscription_id } = req.body;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const subscription = await cancelParentSubscriptionService(subscription_id);

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES.SUBSCRIPTION_REDEMPTION.SUBSCRIPTION_CANCELLED,
    });
  },
);

/**
 * Check subscription status (parent)
 * @route GET /api/v1/parent/subscriptions/redemption/status/check
 */
export const checkStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.COMMON.UNAUTHORIZED,
    );
  }

  const isActive = await checkParentSubscriptionActiveService(userId);

  return res.json({
    success: true,
    data: {
      has_active_subscription: isActive,
    },
    message: SUCCESS_MESSAGES.SUBSCRIPTION_REDEMPTION.STATUS_RETRIEVED,
  });
});

/**
 * Get subscription details (parent)
 * @route GET /api/v1/parent/subscriptions/redemption/:subscriptionId
 */
export const getDetails = asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId } = req.params as Record<string, string>;

  if (!subscriptionId) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.SUBSCRIPTION_ID_REQUIRED,
    );
  }

  const subscription = await getSubscriptionDetailsService(subscriptionId);

  if (!subscription) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.SUBSCRIPTION.NOT_FOUND,
    );
  }

  return res.json({
    success: true,
    data: subscription,
    message: SUCCESS_MESSAGES.SUBSCRIPTION_REDEMPTION.DETAILS_RETRIEVED,
  });
});

/**
 * Get available redemption codes (public — parents can see which codes are available)
 * @route GET /api/v1/parent/subscriptions/redemption/available/codes
 */
export const getAvailableCodes = asyncHandler(
  async (req: Request, res: Response) => {
    const codes = await getAvailableRedemptionCodesService();

    return res.json({
      success: true,
      data: codes,
      message:
        SUCCESS_MESSAGES.SUBSCRIPTION_REDEMPTION.AVAILABLE_CODES_RETRIEVED,
    });
  },
);
