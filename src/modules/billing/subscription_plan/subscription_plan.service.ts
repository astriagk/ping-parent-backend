import { WithId } from "mongodb";

import { subscriptionPlanRepository } from "./subscription_plan.repository";
import { SubscriptionPlan } from "./subscription_plan.type";

/**
 * Create new subscription plan (admin only)
 */
export const createSubscriptionPlan = async (
  planData: Omit<SubscriptionPlan, "created_at" | "is_active">,
): Promise<WithId<SubscriptionPlan>> => {
  const newPlan: SubscriptionPlan = {
    ...planData,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };
  return await subscriptionPlanRepository.create(newPlan);
};

/**
 * Get all active subscription plans
 */
export const getAllSubscriptionPlans = async (): Promise<
  WithId<SubscriptionPlan>[]
> => {
  return await subscriptionPlanRepository.findActivePlans();
};

/**
 * Get subscription plan by ID
 */
export const getSubscriptionPlanById = async (
  id: string,
): Promise<WithId<SubscriptionPlan> | null> => {
  return await subscriptionPlanRepository.findById(id);
};

/**
 * Get subscription plan by plan_id (alias for findById)
 */
export const getSubscriptionPlanByPlanId = async (
  planId: string,
): Promise<WithId<SubscriptionPlan> | null> => {
  return await subscriptionPlanRepository.findById(planId);
};

/**
 * Update subscription plan (admin only)
 */
export const updateSubscriptionPlan = async (
  id: string,
  updates: Partial<SubscriptionPlan>,
): Promise<WithId<SubscriptionPlan> | null> => {
  return await subscriptionPlanRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

/**
 * Activate subscription plan (admin only)
 */
export const activateSubscriptionPlan = async (
  id: string,
): Promise<WithId<SubscriptionPlan> | null> => {
  return await subscriptionPlanRepository.updateById(id, {
    $set: { is_active: true, updated_at: new Date() },
  });
};

/**
 * Deactivate/pause subscription plan (admin only)
 */
export const deactivateSubscriptionPlan = async (
  id: string,
): Promise<WithId<SubscriptionPlan> | null> => {
  return await subscriptionPlanRepository.updateById(id, {
    $set: { is_active: false, updated_at: new Date() },
  });
};
