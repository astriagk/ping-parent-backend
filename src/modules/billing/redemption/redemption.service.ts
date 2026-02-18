import { WithId } from "mongodb";

import { parentRepository } from "@modules/users/parent/parent.repository";
import { studentRepository } from "@modules/users/student/student.repository";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SubscriptionSource,
  SubscriptionStatus,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

import { parentSubscriptionRepository } from "../parent_subscription/parent_subscription.repository";
import {
  cancelParentSubscription as cancelParentSubscriptionService,
  getActiveParentSubscriptionByUserId,
  getParentSubscriptionById,
  getParentSubscriptionsByUserId,
} from "../parent_subscription/parent_subscription.service";
import { ParentSubscription } from "../parent_subscription/parent_subscription.type";
import { schoolStudentCodeRepository } from "../school_subscription/school_student_code.repository";
import { subscriptionPlanRepository } from "../subscription_plan/subscription_plan.repository";

/**
 * Helper: convert userId (JWT) to parent MongoDB _id string
 */
const getParentByUserId = async (userId: string) => {
  const parent = await parentRepository.findByUserId(userId);
  if (!parent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.SUBSCRIPTION.PARENT_NOT_FOUND,
    );
  }
  return parent;
};

/**
 * Redeem a school student code (parent)
 * - Finds the per-student code issued by school admin
 * - Validates ownership (student must belong to this parent)
 * - If parent already has an active redemption from the same school subscription, adds the student to it
 * - Otherwise creates a new ParentSubscription (price = 0)
 */
export const redeemSchoolSubscriptionCode = async (
  userId: string,
  subscriptionCode: string,
): Promise<{
  subscription: WithId<ParentSubscription>;
  added_student_id: string;
}> => {
  // 1. Resolve parent
  const parent = await getParentByUserId(userId);
  const parentId = String(parent._id);

  // 2. Look up the student code
  const code = await schoolStudentCodeRepository.findByCode(subscriptionCode);

  if (!code) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.SUBSCRIPTION.INVALID_OR_EXPIRED_CODE,
    );
  }

  if (code.is_redeemed) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.SUBSCRIPTION.CODE_ALREADY_REDEEMED,
    );
  }

  if (code.end_date < new Date()) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.SUBSCRIPTION.INVALID_OR_EXPIRED_CODE,
    );
  }

  // 3. Fetch plan
  const plan = await subscriptionPlanRepository.findByPlanId(code.plan_id);
  if (!plan) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.SUBSCRIPTION_PLAN.NOT_FOUND,
    );
  }

  // 4. Validate the student belongs to this parent
  const students = await studentRepository.findByParentId(parentId);
  const studentBelongsToParent = students.some(
    (s) => s.student_id === code.student_id,
  );

  if (!studentBelongsToParent) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.SUBSCRIPTION.INVALID_OR_EXPIRED_CODE,
    );
  }

  // 5. Check student is not already in an active subscription
  const conflicting =
    await parentSubscriptionRepository.findActiveSubscriptionsByStudentIds([
      code.student_id,
    ]);

  if (conflicting.length > 0) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.STUDENT_ALREADY_SUBSCRIBED,
    );
  }

  // 6. Check if parent already has an active redemption from the same school subscription
  const existing =
    await parentSubscriptionRepository.findActiveRedemptionBySchoolSub(
      parentId,
      code.school_subscription_id,
    );

  let subscription: WithId<ParentSubscription>;

  if (existing) {
    // Add student to the existing subscription
    const updated = await parentSubscriptionRepository.updateById(
      existing._id.toString(),
      {
        $addToSet: { student_ids: code.student_id } as any,
        $inc: { number_of_kids: 1 } as any,
        $set: { updated_at: new Date() },
      },
    );

    subscription = updated!;
  } else {
    // Create new subscription — same pattern as createParentSubscription
    const newSubData: ParentSubscription = {
      subscription_id: generateUniqueCode(UniqueCodeTypes.SUBSCRIPTION),
      parent_id: parentId,
      plan_id: code.plan_id,
      student_ids: [code.student_id],
      number_of_kids: 1,
      original_price: 0,
      calculated_price: 0,
      currency: plan.currency,
      start_date: new Date(),
      end_date: code.end_date,
      subscription_status: SubscriptionStatus.ACTIVE,
      auto_renew: false,
      subscription_source: SubscriptionSource.SCHOOL_REDEMPTION,
      school_subscription_id: code.school_subscription_id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    subscription = await parentSubscriptionRepository.create(newSubData);

    // Update parent document
    await parentRepository.updateByUserId(userId, {
      has_active_subscription: true,
      subscription_id: newSubData.subscription_id,
      updated_at: new Date(),
    } as any);
  }

  // Mark code as redeemed
  await schoolStudentCodeRepository.markRedeemed(code._id.toString(), parentId);

  return { subscription, added_student_id: code.student_id };
};

/**
 * Get all subscriptions for a parent (delegates to parent_subscription service)
 */
export const getParentSubscriptions = async (userId: string) => {
  return await getParentSubscriptionsByUserId(userId);
};

/**
 * Get active subscription for parent (delegates to parent_subscription service)
 */
export const getParentActiveSubscription = async (userId: string) => {
  return await getActiveParentSubscriptionByUserId(userId);
};

/**
 * Get subscription details by subscription_id (delegates to parent_subscription service)
 */
export const getSubscriptionDetails = async (
  subscriptionId: string,
): Promise<WithId<ParentSubscription> | null> => {
  return await getParentSubscriptionById(subscriptionId);
};

/**
 * Cancel a parent subscription (delegates to parent_subscription service — includes status validation)
 */
export const cancelParentSubscription = async (
  userId: string,
  subscriptionId: string,
): Promise<WithId<ParentSubscription> | null> => {
  // Find the subscription by subscription_id to get its _id
  const sub = await parentSubscriptionRepository.findOne({
    subscription_id: subscriptionId,
  });

  if (!sub) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.SUBSCRIPTION.NOT_FOUND,
    );
  }

  return await cancelParentSubscriptionService(sub._id.toString(), userId);
};

/**
 * Check if parent has any active subscription
 */
export const checkParentSubscriptionActive = async (
  userId: string,
): Promise<boolean> => {
  const active = await getActiveParentSubscriptionByUserId(userId);
  return active !== null;
};

/**
 * Get available (unredeemed) school student codes — for parents to see what schools offer
 */
export const getAvailableRedemptionCodes = async () => {
  return await schoolStudentCodeRepository.findAvailableCodes();
};
