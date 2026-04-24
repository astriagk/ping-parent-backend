import { WithId } from "mongodb";

import {
  AlphabetType,
  ERROR_MESSAGES,
  HTTP_STATUS,
  SchoolSubscriptionStatus,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

import { schoolStudentCodeRepository } from "./school_student_code.repository";
import {
  SchoolStudentCode,
  SchoolStudentCodeListItem,
} from "./school_student_code.type";
import { schoolSubscriptionRepository } from "./school_subscription.repository";
import {
  SchoolSubscription,
  SchoolSubscriptionInput,
  SchoolSubscriptionUpdateInput,
  SchoolSubscriptionWithPlan,
} from "./school_subscription.type";

/**
 * Create new school subscription
 */
export const createSchoolSubscription = async (
  input: SchoolSubscriptionInput,
): Promise<WithId<SchoolSubscription>> => {
  // Check if school already has an active subscription
  const existingSubscription =
    await schoolSubscriptionRepository.findActiveBySchoolId(input.school_id);

  if (existingSubscription) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.SUBSCRIPTION.ALREADY_ACTIVE,
    );
  }

  const newSubscription: SchoolSubscription = {
    ...input,
    subscription_status: SchoolSubscriptionStatus.ACTIVE,
    auto_renew: input.auto_renew ?? true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await schoolSubscriptionRepository.create(newSubscription);
};

/**
 * Get school subscription by ID
 */
export const getSchoolSubscriptionById = async (
  id: string,
): Promise<WithId<SchoolSubscription> | null> => {
  return await schoolSubscriptionRepository.findById(id);
};

/**
 * Get active subscription for school
 */
export const getActiveSchoolSubscription = async (
  schoolId: string,
): Promise<WithId<SchoolSubscription> | null> => {
  return await schoolSubscriptionRepository.findActiveBySchoolId(schoolId);
};

/**
 * Get all subscriptions for school
 */
export const getSchoolSubscriptions = async (
  schoolId: string,
): Promise<SchoolSubscriptionWithPlan[]> => {
  return await schoolSubscriptionRepository.findAllBySchool(schoolId);
};

/**
 * Get all school subscriptions (admin)
 */
export const getAllSchoolSubscriptions = async (): Promise<
  SchoolSubscriptionWithPlan[]
> => {
  return await schoolSubscriptionRepository.findAllBySchool();
};

/**
 * Get subscription by subscription ID
 */
export const getSchoolSubscriptionBySubscriptionId = async (
  subscriptionId: string,
): Promise<WithId<SchoolSubscription> | null> => {
  return await schoolSubscriptionRepository.findById(subscriptionId);
};

/**
 * Update school subscription
 */
export const updateSchoolSubscription = async (
  id: string,
  updates: SchoolSubscriptionUpdateInput,
): Promise<WithId<SchoolSubscription> | null> => {
  return await schoolSubscriptionRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

/**
 * Renew school subscription
 */
export const renewSchoolSubscription = async (
  id: string,
  newEndDate: Date,
): Promise<WithId<SchoolSubscription> | null> => {
  return await schoolSubscriptionRepository.updateById(id, {
    $set: {
      subscription_status: SchoolSubscriptionStatus.ACTIVE,
      end_date: newEndDate,
      updated_at: new Date(),
    },
  });
};

/**
 * Cancel school subscription
 */
export const cancelSchoolSubscription = async (
  id: string,
): Promise<WithId<SchoolSubscription> | null> => {
  return await schoolSubscriptionRepository.updateById(id, {
    $set: {
      subscription_status: SchoolSubscriptionStatus.CANCELLED,
      auto_renew: false,
      updated_at: new Date(),
    },
  });
};

/**
 * Mark subscription as expired
 */
export const expireSchoolSubscription = async (
  id: string,
): Promise<WithId<SchoolSubscription> | null> => {
  return await schoolSubscriptionRepository.updateById(id, {
    $set: {
      subscription_status: SchoolSubscriptionStatus.EXPIRED,
      updated_at: new Date(),
    },
  });
};

/**
 * Get all expired subscriptions (for cleanup/renewal tasks)
 */
export const getExpiredSchoolSubscriptions = async (): Promise<
  WithId<SchoolSubscription>[]
> => {
  return await schoolSubscriptionRepository.findExpiredSubscriptions();
};

/**
 * Get all schools with a specific plan
 */
export const getSubscriptionsByPlan = async (
  planId: string,
): Promise<WithId<SchoolSubscription>[]> => {
  return await schoolSubscriptionRepository.findByPlanId(planId);
};

/**
 * Check if school subscription capacity allows adding more drivers
 */
export const canAddDriver = async (
  schoolId: string,
  currentDriverCount: number,
): Promise<boolean> => {
  const subscription =
    await schoolSubscriptionRepository.findActiveBySchoolId(schoolId);

  if (!subscription || !subscription.max_drivers) {
    return true; // No limit
  }

  return currentDriverCount < subscription.max_drivers;
};

/**
 * Check if school subscription capacity allows adding more students
 */
export const canAddStudent = async (
  schoolId: string,
  currentStudentCount: number,
): Promise<boolean> => {
  const subscription =
    await schoolSubscriptionRepository.findActiveBySchoolId(schoolId);

  if (!subscription || !subscription.max_students) {
    return true; // No limit
  }

  return currentStudentCount < subscription.max_students;
};

/**
 * Generate per-student redemption codes for a school subscription
 */
export const generateStudentCodes = async (
  subscriptionId: string,
  studentIds: string[],
): Promise<WithId<SchoolStudentCode>[]> => {
  const schoolSub = await schoolSubscriptionRepository.findById(subscriptionId);

  if (!schoolSub) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.NOT_FOUND,
    );
  }

  if (schoolSub.subscription_status !== SchoolSubscriptionStatus.ACTIVE) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.SCHOOL_SUBSCRIPTION.NO_ACTIVE_SUBSCRIPTION,
    );
  }

  const created: WithId<SchoolStudentCode>[] = [];

  for (const studentId of studentIds) {
    // Avoid duplicate codes for the same student + subscription combo
    const existing =
      await schoolStudentCodeRepository.findUnredeemedByStudentAndSub(
        studentId,
        String(schoolSub._id),
      );

    if (existing) {
      created.push(existing);
      continue;
    }

    const redemCode = generateUniqueCode(UniqueCodeTypes.SCHOOL_STUDENT_CODE, {
      alphabetType: AlphabetType.Numbers,
    });
    const newCode: SchoolStudentCode = {
      code: redemCode,
      school_subscription_id: String(schoolSub._id),
      school_id: schoolSub.school_id,
      student_id: studentId,
      plan_id: schoolSub.plan_id,
      end_date: schoolSub.end_date,
      is_redeemed: false,
      created_at: new Date(),
    };

    const doc = await schoolStudentCodeRepository.create(newCode);
    created.push(doc);
  }

  return created;
};

/**
 * Get all codes for a school subscription
 */
export const getCodesBySchoolSubscription = async (
  subscriptionId: string,
): Promise<SchoolStudentCodeListItem[]> => {
  return await schoolStudentCodeRepository.findBySchoolSubscriptionId(
    subscriptionId,
  );
};
