import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  activateSubscriptionPlan as activateSubscriptionPlanService,
  createSubscriptionPlan as createSubscriptionPlanService,
  deactivateSubscriptionPlan as deactivateSubscriptionPlanService,
  getAllSubscriptionPlans as getAllSubscriptionPlansService,
  getSubscriptionPlanById,
  updateSubscriptionPlan as updateSubscriptionPlanService,
} from "./subscription_plan.service";

/**
 * Create new subscription plan (admin only)
 * @route POST /api/subscription-plans
 */
export const createSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const planData = req.body;

    const plan = await createSubscriptionPlanService(planData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: plan,
      message: SUCCESS_MESSAGES.SUBSCRIPTION_PLAN.CREATED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all active subscription plans
 * @route GET /api/subscription-plans
 */
export const getAllSubscriptionPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const plans = await getAllSubscriptionPlansService();

    return res.json({
      success: true,
      data: plans,
      message: SUCCESS_MESSAGES.SUBSCRIPTION_PLAN.FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get subscription plan by ID
 * @route GET /api/subscription-plans/:id
 */
export const getSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const plan = await getSubscriptionPlanById(id);

    if (!plan) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUBSCRIPTION_PLAN.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: plan,
      message: SUCCESS_MESSAGES.SUBSCRIPTION_PLAN.PLAN_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Update subscription plan (admin only)
 * @route PUT /api/subscription-plans/:id
 */
export const updateSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const updates = req.body;

    const plan = await updateSubscriptionPlanService(id, updates);

    if (!plan) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUBSCRIPTION_PLAN.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: plan,
      message: SUCCESS_MESSAGES.SUBSCRIPTION_PLAN.UPDATED_SUCCESSFULLY,
    });
  },
);

/**
 * Activate subscription plan (admin only)
 * @route PATCH /api/subscription-plans/:id/activate
 */
export const activateSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const plan = await activateSubscriptionPlanService(id);

    if (!plan) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUBSCRIPTION_PLAN.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: plan,
      message: SUCCESS_MESSAGES.SUBSCRIPTION_PLAN.ACTIVATED_SUCCESSFULLY,
    });
  },
);

/**
 * Deactivate/pause subscription plan (admin only)
 * @route PATCH /api/subscription-plans/:id/deactivate
 */
export const deactivateSubscriptionPlan = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const plan = await deactivateSubscriptionPlanService(id);

    if (!plan) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUBSCRIPTION_PLAN.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: plan,
      message: SUCCESS_MESSAGES.SUBSCRIPTION_PLAN.DEACTIVATED_SUCCESSFULLY,
    });
  },
);
