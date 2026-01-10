import { WithId } from "mongodb";

import { subscriptionPlanRepository } from "./subscription_plan.repository";
import { SubscriptionPlan } from "./subscription_plan.type";

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
 * Get subscription plan by plan_id
 */
export const getSubscriptionPlanByPlanId = async (
  planId: string,
): Promise<WithId<SubscriptionPlan> | null> => {
  return await subscriptionPlanRepository.findByPlanId(planId);
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
