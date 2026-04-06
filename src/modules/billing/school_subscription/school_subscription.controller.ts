import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  SUCCESS_MESSAGES_COMMON,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  cancelSchoolSubscription as cancelSchoolSubscriptionService,
  createSchoolSubscription as createSchoolSubscriptionService,
  generateStudentCodes as generateStudentCodesService,
  getActiveSchoolSubscription as getActiveSchoolSubscriptionService,
  getAllSchoolSubscriptions as getAllSchoolSubscriptionsService,
  getCodesBySchoolSubscription as getCodesBySchoolSubscriptionService,
  getExpiredSchoolSubscriptions as getExpiredSchoolSubscriptionsService,
  getSchoolSubscriptionById as getSchoolSubscriptionByIdService,
  getSchoolSubscriptions as getSchoolSubscriptionsService,
  renewSchoolSubscription as renewSchoolSubscriptionService,
  updateSchoolSubscription as updateSchoolSubscriptionService,
} from "./school_subscription.service";

/**
 * Create new school subscription (admin only)
 * @route POST /api/v1/billing/school-subscriptions
 */
export const createSchoolSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriptionData = req.body;

    const subscription =
      await createSchoolSubscriptionService(subscriptionData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

/**
 * Get all school subscriptions (admin)
 * @route GET /api/v1/billing/school-subscriptions
 */
export const getAllSchoolSubscriptions = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriptions = await getAllSchoolSubscriptionsService();

    return res.json({
      success: true,
      data: subscriptions,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

/**
 * Get all subscriptions for a school (admin/school_admin)
 * @route GET /api/v1/billing/school-subscriptions/school/:schoolId
 */
export const getSchoolSubscriptions = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    const subscriptions = await getSchoolSubscriptionsService(schoolId);

    return res.json({
      success: true,
      data: subscriptions,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

/**
 * Get active subscription for school (admin/school_admin)
 * @route GET /api/v1/billing/school-subscriptions/school/:schoolId/active
 */
export const getActiveSchoolSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    if (!schoolId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.SCHOOL_ID_REQUIRED,
      );
    }

    const subscription = await getActiveSchoolSubscriptionService(schoolId);

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.NO_ACTIVE_SUBSCRIPTION,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

/**
 * Get subscription by ID (admin/school_admin)
 * @route GET /api/v1/billing/school-subscriptions/:subscriptionId
 */
export const getSchoolSubscriptionById = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriptionId } = req.params as Record<string, string>;

    if (!subscriptionId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.SUBSCRIPTION_ID_REQUIRED,
      );
    }

    const subscription = await getSchoolSubscriptionByIdService(subscriptionId);

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

/**
 * Update school subscription (admin only)
 * @route PATCH /api/v1/billing/school-subscriptions/:subscriptionId
 */
export const updateSchoolSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriptionId } = req.params as Record<string, string>;

    if (!subscriptionId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.SUBSCRIPTION_ID_REQUIRED,
      );
    }

    const subscription = await updateSchoolSubscriptionService(
      subscriptionId,
      req.body,
    );

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

/**
 * Renew school subscription (admin only)
 * @route POST /api/v1/billing/school-subscriptions/:subscriptionId/renew
 */
export const renewSchoolSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriptionId } = req.params as Record<string, string>;
    const { newEndDate } = req.body;

    if (!subscriptionId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.SUBSCRIPTION_ID_REQUIRED,
      );
    }

    const subscription = await renewSchoolSubscriptionService(
      subscriptionId,
      new Date(newEndDate),
    );

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES.SCHOOL_SUBSCRIPTION.RENEWED_SUCCESSFULLY,
    });
  },
);

/**
 * Cancel school subscription (admin only)
 * @route POST /api/v1/billing/school-subscriptions/:subscriptionId/cancel
 */
export const cancelSchoolSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriptionId } = req.params as Record<string, string>;

    if (!subscriptionId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.SUBSCRIPTION_ID_REQUIRED,
      );
    }

    const subscription = await cancelSchoolSubscriptionService(subscriptionId);

    if (!subscription) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: subscription,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
    });
  },
);

/**
 * Get all expired subscriptions (admin/cron job)
 * @route GET /api/v1/billing/school-subscriptions/expired/list
 */
export const getExpiredSubscriptions = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriptions = await getExpiredSchoolSubscriptionsService();

    return res.json({
      success: true,
      data: subscriptions,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

/**
 * Generate per-student redemption codes (admin only)
 * @route POST /api/v1/billing/school-subscriptions/:subscriptionId/generate-codes
 */
export const generateStudentCodes = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriptionId } = req.params as Record<string, string>;
    const { student_ids } = req.body;

    if (!subscriptionId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.SUBSCRIPTION_ID_REQUIRED,
      );
    }

    const codes = await generateStudentCodesService(
      subscriptionId,
      student_ids,
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: codes,
      message:
        SUCCESS_MESSAGES.SCHOOL_SUBSCRIPTION.CODES_GENERATED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all student codes for a school subscription (admin only)
 * @route GET /api/v1/billing/school-subscriptions/:subscriptionId/codes
 */
export const getCodesBySchoolSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriptionId } = req.params as Record<string, string>;

    if (!subscriptionId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.SUBSCRIPTION_ID_REQUIRED,
      );
    }

    const codes = await getCodesBySchoolSubscriptionService(subscriptionId);

    return res.json({
      success: true,
      data: codes,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);
