import { WithId } from "mongodb";

import { schoolSubscriptionRepository } from "@modules/billing/school_subscription/school_subscription.repository";
import { parentRepository } from "@modules/users/parent/parent.repository";
import {
  HTTP_STATUS,
  SchoolSubscriptionStatus,
  SubscriptionStatus,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

import { parentSubscriptionRepository } from "../parent_subscription/parent_subscription.repository";
import { ParentSubscription } from "../parent_subscription/parent_subscription.type";

/**
 * Get active subscription for parent
 */
export const getParentActiveSubscription = async (
  parentId: string,
): Promise<WithId<ParentSubscription> | null> => {
  return await parentSubscriptionRepository.findOne({
    parent_id: parentId,
    subscription_status: SubscriptionStatus.ACTIVE,
    end_date: { $gte: new Date() },
  });
};

/**
 * Get all subscriptions for parent
 */
export const getParentSubscriptions = async (
  parentId: string,
): Promise<WithId<ParentSubscription>[]> => {
  return await parentSubscriptionRepository.findByParentId(parentId);
};

/**
 * Redeem school subscription code (parent)
 * Parent uses a subscription code provided by school to activate school-based transport
 */
export const redeemSchoolSubscriptionCode = async (
  parentId: string,
  subscriptionCode: string,
): Promise<{
  subscription_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  subscription_status: SubscriptionStatus;
}> => {
  // Validate parent exists
  const parent = await parentRepository.findById(parentId);

  if (!parent) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Parent not found");
  }

  // Find subscription by code (custom field that would be generated for schools)
  // This assumes school subscriptions have a redeemable code
  const schoolSubscription = await schoolSubscriptionRepository.findOne({
    code: subscriptionCode,
    subscription_status: SchoolSubscriptionStatus.ACTIVE,
    is_redeemable: true,
  });

  if (!schoolSubscription) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Invalid or expired subscription code",
    );
  }

  // Check if code was already redeemed
  const isRedeemed =
    ((schoolSubscription as Record<string, unknown>)?.is_redeemed as boolean) ??
    false;
  if (isRedeemed) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Subscription code already redeemed",
    );
  }

  // Create subscription record for parent
  const subscription_id = generateUniqueCode("PSUB");
  const newSubscription: ParentSubscription = {
    subscription_id,
    parent_id: parentId,
    plan_id: schoolSubscription.plan_id,
    start_date: new Date(),
    end_date: schoolSubscription.end_date,
    subscription_status: SubscriptionStatus.ACTIVE,
    auto_renew: false, // School subscriptions don't auto-renew per-parent
    created_at: new Date(),
    updated_at: new Date(),
  };

  await parentSubscriptionRepository.create(newSubscription);

  // Update parent record to mark active subscription
  await parentRepository.updateById(parent._id.toString(), {
    $set: {
      has_active_subscription: true,
      subscription_id,
      updated_at: new Date(),
    },
  });

  // Mark school subscription as redeemed
  await schoolSubscriptionRepository.updateById(
    schoolSubscription._id.toString(),
    {
      $set: {
        is_redeemed: true,
        redeemed_by_parent_id: parentId,
        redeemed_at: new Date(),
      },
    },
  );

  return {
    subscription_id,
    plan_id: schoolSubscription.plan_id,
    start_date: newSubscription.start_date,
    end_date: newSubscription.end_date,
    subscription_status: newSubscription.subscription_status,
  };
};

/**
 * Cancel parent subscription
 */
export const cancelParentSubscription = async (
  parentId: string,
  subscriptionId: string,
): Promise<WithId<ParentSubscription> | null> => {
  const subscription = await parentSubscriptionRepository.findOne({
    subscription_id: subscriptionId,
    parent_id: parentId,
  });

  if (!subscription) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Subscription not found");
  }

  const updated = await parentSubscriptionRepository.updateById(
    subscription._id.toString(),
    {
      $set: {
        subscription_status: SubscriptionStatus.CANCELLED,
        updated_at: new Date(),
      },
    },
  );

  // Update parent subscription status
  if (updated?.subscription_status === SubscriptionStatus.CANCELLED) {
    await parentRepository.updateById(parentId, {
      $set: {
        has_active_subscription: false,
        updated_at: new Date(),
      },
    });
  }

  return updated;
};

/**
 * Get subscription details
 */
export const getSubscriptionDetails = async (
  subscriptionId: string,
): Promise<WithId<ParentSubscription> | null> => {
  return await parentSubscriptionRepository.findOne({
    subscription_id: subscriptionId,
  });
};

/**
 * Check if parent has active subscription
 */
export const checkParentSubscriptionActive = async (
  parentId: string,
): Promise<boolean> => {
  const subscription = await getParentActiveSubscription(parentId);
  return !!subscription;
};

/**
 * List available redemption codes (for parent to see available schools)
 */
export const getAvailableRedemptionCodes = async (): Promise<
  Array<{
    code?: string;
    school_id: string;
    plan_id: string;
    end_date: Date;
    max_students?: number;
  }>
> => {
  type RedemptionCode = {
    code?: string;
    school_id: string;
    plan_id: string;
    end_date: Date;
    max_students?: number;
  };

  return (await schoolSubscriptionRepository.findMany({
    is_redeemable: true,
    is_redeemed: false,
    subscription_status: SchoolSubscriptionStatus.ACTIVE,
    end_date: { $gte: new Date() },
  } as Record<string, unknown>)) as unknown as RedemptionCode[];
};
