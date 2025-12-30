import { WithId } from "mongodb";
import { nanoid } from "nanoid";

import { getDB } from "@config";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  SubscriptionStatus,
} from "@constants";
import { ApiError } from "@middlewares";
import { ParentSubscription } from "@models/parent_subscription.type";
import { parentSubscriptionRepository } from "@repositories/parent_subscription.repository";

/**
 * Helper function to convert userId to parent_id
 * This is needed because the parent_subscriptions table stores parent_id (from parents table)
 * but the authenticated user has user_id (from users table)
 */
const getParentIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    return null;
  }

  return String(parent._id);
};

export const createParentSubscription = async (
  userId: string,
  data: Omit<
    ParentSubscription,
    "subscription_id" | "parent_id" | "subscription_status" | "created_at"
  >,
): Promise<WithId<ParentSubscription>> => {
  // Convert user_id to parent_id
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // Validate date range
  if (new Date(data.end_date) <= new Date(data.start_date)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.INVALID_DATE_RANGE,
    );
  }

  // Check for existing active subscription
  const existingActiveSubscription =
    await parentSubscriptionRepository.findDuplicateActiveSubscription(
      parentId,
    );

  if (existingActiveSubscription) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.ALREADY_EXISTS,
    );
  }

  const subscriptionData: ParentSubscription = {
    subscription_id: nanoid(),
    parent_id: parentId,
    ...data,
    subscription_status: SubscriptionStatus.ACTIVE,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await parentSubscriptionRepository.create(subscriptionData);
};

export const getParentSubscriptionById = async (
  id: string,
): Promise<WithId<ParentSubscription> | null> => {
  return await parentSubscriptionRepository.findById(id);
};

/**
 * Get all parent subscriptions across the system (admin only)
 */
export const getAllParentSubscriptions = async (): Promise<
  WithId<ParentSubscription>[]
> => {
  return await parentSubscriptionRepository.findMany();
};

export const getParentSubscriptionsByUserId = async (
  userId: string,
): Promise<WithId<ParentSubscription>[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await parentSubscriptionRepository.findByParentId(parentId);
};

export const getActiveParentSubscriptionByUserId = async (
  userId: string,
): Promise<WithId<ParentSubscription> | null> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await parentSubscriptionRepository.findActiveByParentId(parentId);
};

export const updateParentSubscription = async (
  id: string,
  updates: Partial<ParentSubscription>,
): Promise<WithId<ParentSubscription> | null> => {
  const currentSubscription = await parentSubscriptionRepository.findById(id);

  if (!currentSubscription) {
    return null;
  }

  // Prevent updating expired subscriptions
  if (currentSubscription.subscription_status === SubscriptionStatus.EXPIRED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.CANNOT_UPDATE_EXPIRED,
    );
  }

  // Validate date range if end_date is being updated
  if (updates.end_date) {
    const startDate = updates.start_date || currentSubscription.start_date;
    if (new Date(updates.end_date) <= new Date(startDate)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PARENT_SUBSCRIPTION.INVALID_DATE_RANGE,
      );
    }
  }

  return await parentSubscriptionRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const cancelParentSubscription = async (
  id: string,
): Promise<WithId<ParentSubscription> | null> => {
  const currentSubscription = await parentSubscriptionRepository.findById(id);

  if (!currentSubscription) {
    return null;
  }

  // Prevent cancelling already cancelled subscriptions
  if (
    currentSubscription.subscription_status === SubscriptionStatus.CANCELLED
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.ALREADY_CANCELLED,
    );
  }

  // Prevent cancelling expired subscriptions
  if (currentSubscription.subscription_status === SubscriptionStatus.EXPIRED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.CANNOT_CANCEL_EXPIRED,
    );
  }

  return await parentSubscriptionRepository.updateById(id, {
    $set: {
      subscription_status: SubscriptionStatus.CANCELLED,
      auto_renew: false,
      updated_at: new Date(),
    },
  });
};

export const deleteParentSubscription = async (
  id: string,
): Promise<boolean> => {
  const result = await parentSubscriptionRepository.deleteById(id);
  return result !== null;
};
