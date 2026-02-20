import { WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  PlanType,
  PricingModel,
  SubscriptionSource,
  SubscriptionStatus,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

import { driverStudentAssignmentRepository } from "../../trips/driver_student_assignment/driver_student_assignment.repository";
import { parentRepository } from "../../users/parent/parent.repository";
import { studentRepository } from "../../users/student/student.repository";
import { subscriptionPlanRepository } from "../subscription_plan/subscription_plan.repository";
import { SubscriptionPlan } from "../subscription_plan/subscription_plan.type";
import { parentSubscriptionRepository } from "./parent_subscription.repository";
import {
  DiscountApplied,
  ParentSubscription,
  ProrationDetails,
} from "./parent_subscription.type";

/**
 * Helper: convert userId to parent_id
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

/**
 * Calculate end date based on plan type
 */
const calculateEndDate = (startDate: Date, planType: PlanType): Date => {
  const end = new Date(startDate);
  switch (planType) {
    case PlanType.MONTHLY:
      end.setMonth(end.getMonth() + 1);
      break;
    case PlanType.QUARTERLY:
      end.setMonth(end.getMonth() + 3);
      break;
    case PlanType.YEARLY:
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
  }
  return end;
};

/**
 * Detect same-trip groups: kids sharing the same driver + school
 */
interface SameTripGroup {
  driver_unique_id: string;
  school_id: string;
  student_ids: string[];
  count: number;
}

const detectSameTripGroups = async (
  studentIds: string[],
): Promise<SameTripGroup[]> => {
  const groupMap = new Map<string, SameTripGroup>();

  for (const studentId of studentIds) {
    const assignments =
      await driverStudentAssignmentRepository.findActiveAssignmentsByStudentId(
        studentId,
      );

    if (assignments.length > 0) {
      const assignment = assignments[0];
      const key = `${assignment.driver_unique_id}_${assignment.school_id}`;

      if (groupMap.has(key)) {
        const group = groupMap.get(key)!;
        group.student_ids.push(studentId);
        group.count++;
      } else {
        groupMap.set(key, {
          driver_unique_id: assignment.driver_unique_id,
          school_id: assignment.school_id,
          student_ids: [studentId],
          count: 1,
        });
      }
    }
  }

  return Array.from(groupMap.values());
};

/**
 * Calculate price and apply discounts
 */
interface PriceCalculation {
  original_price: number;
  calculated_price: number;
  discount_applied?: DiscountApplied;
}

const calculatePrice = (
  plan: WithId<SubscriptionPlan>,
  numberOfKids: number,
  sameTripGroups: SameTripGroup[],
): PriceCalculation => {
  let originalPrice: number;

  // Base price calculation
  switch (plan.pricing_model) {
    case PricingModel.FLAT:
      originalPrice = plan.price;
      break;
    case PricingModel.PER_KID:
      originalPrice = (plan.per_kid_price ?? plan.price) * numberOfKids;
      break;
    case PricingModel.BASE_PLUS_PER_KID:
      originalPrice = plan.price + (plan.per_kid_price ?? 0) * numberOfKids;
      break;
    default:
      originalPrice = plan.price;
  }

  // Apply same-trip discount if applicable
  const sameTripDiscount = plan.discounts?.same_trip;
  if (sameTripDiscount) {
    // Count kids that qualify for same-trip discount
    const qualifyingKids = sameTripGroups
      .filter((g) => g.count >= sameTripDiscount.min_kids)
      .reduce((sum, g) => sum + g.count, 0);

    if (qualifyingKids > 0 && plan.pricing_model !== PricingModel.FLAT) {
      const perKidPrice = plan.per_kid_price ?? plan.price;
      const discountAmount = Math.round(
        perKidPrice * qualifyingKids * (sameTripDiscount.percentage / 100),
      );

      return {
        original_price: originalPrice,
        calculated_price: originalPrice - discountAmount,
        discount_applied: {
          type: "same_trip",
          percentage: sameTripDiscount.percentage,
          amount: discountAmount,
          label: sameTripDiscount.label,
        },
      };
    }
  }

  return {
    original_price: originalPrice,
    calculated_price: originalPrice,
  };
};

/**
 * Calculate proration for an active subscription
 */
const calculateProration = (
  subscription: WithId<ParentSubscription>,
): {
  total_days: number;
  remaining_days: number;
  daily_rate: number;
  remaining_value: number;
} => {
  const now = new Date();
  const startDate = new Date(subscription.start_date);
  const endDate = new Date(subscription.end_date);

  const dayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(
    Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs),
    1,
  );
  const remainingDays = Math.max(
    Math.ceil((endDate.getTime() - now.getTime()) / dayMs),
    0,
  );

  const dailyRate = subscription.calculated_price / totalDays;
  const remainingValue = Math.round(dailyRate * remainingDays);

  return {
    total_days: totalDays,
    remaining_days: remainingDays,
    daily_rate: Math.round(dailyRate * 100) / 100,
    remaining_value: remainingValue,
  };
};

// ============================================================
// RECOMMENDATIONS
// ============================================================

export const getSubscriptionRecommendations = async (userId: string) => {
  const parentId = await getParentIdByUserId(userId);
  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // Fetch parent's active students
  const students = await studentRepository.findByParentId(parentId);
  const activeStudents = students.filter((s) => s.is_active);

  if (activeStudents.length === 0) {
    return {
      parent_summary: { total_kids: 0, kids: [], same_trip_groups: [] },
      recommended_plans: [],
      excluded_plans: [],
    };
  }

  const studentIds = activeStudents.map((s) => s.student_id);

  // Get driver assignments for each student
  const kidsWithDetails = await Promise.all(
    activeStudents.map(async (student) => {
      const assignments =
        await driverStudentAssignmentRepository.findActiveAssignmentsByStudentId(
          student.student_id,
        );
      const assignment = assignments.length > 0 ? assignments[0] : null;

      return {
        student_id: student.student_id,
        student_name: student.student_name,
        class: student.class,
        section: student.section,
        school_id: student.school_id,
        driver_unique_id: assignment?.driver_unique_id ?? null,
        has_driver: !!assignment,
      };
    }),
  );

  // Detect same-trip groups
  const sameTripGroups = await detectSameTripGroups(studentIds);

  // Fetch all active plans
  const plans = await subscriptionPlanRepository.findActivePlans();
  const totalKids = activeStudents.length;

  const recommendedPlans: any[] = [];
  const excludedPlans: any[] = [];

  for (const plan of plans) {
    // Check if plan can cover all kids
    if (totalKids > plan.kids.max) {
      excludedPlans.push({
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        reason: `Supports max ${plan.kids.max} kid${plan.kids.max > 1 ? "s" : ""} (you have ${totalKids})`,
      });
      continue;
    }

    if (totalKids < plan.kids.min) {
      excludedPlans.push({
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        reason: `Requires at least ${plan.kids.min} kid${plan.kids.min > 1 ? "s" : ""}`,
      });
      continue;
    }

    const pricing = calculatePrice(plan, totalKids, sameTripGroups);

    // Build reason string
    let reason = "";
    if (plan.pricing_model === PricingModel.FLAT) {
      reason = `Flat ₹${plan.price}/${plan.plan_type}`;
    } else if (plan.pricing_model === PricingModel.PER_KID) {
      reason = `₹${plan.per_kid_price} × ${totalKids} kids = ₹${pricing.original_price}/${plan.plan_type}`;
    } else {
      reason = `₹${plan.price} + ₹${plan.per_kid_price} × ${totalKids} kids = ₹${pricing.original_price}/${plan.plan_type}`;
    }

    if (pricing.discount_applied) {
      reason += ` (${pricing.discount_applied.label}: save ₹${pricing.discount_applied.amount})`;
    }

    recommendedPlans.push({
      plan_id: plan.plan_id,
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      pricing_model: plan.pricing_model,
      price: plan.price,
      per_kid_price: plan.per_kid_price,
      original_price: pricing.original_price,
      calculated_price: pricing.calculated_price,
      discount: pricing.discount_applied ?? null,
      covers_all_kids: true,
      kids_covered: plan.kids.max,
      features: plan.features,
      badge: plan.badge,
      is_recommended: false,
      reason,
    });
  }

  // Check for active subscription to enrich with upgrade info
  const activeSubscription =
    await parentSubscriptionRepository.findActiveByParentId(parentId);

  if (activeSubscription) {
    const proration = calculateProration(activeSubscription);

    for (const plan of recommendedPlans) {
      const isSamePlan = activeSubscription.plan_id === plan.plan_id;
      plan.is_current_plan = isSamePlan;

      if (isSamePlan) {
        plan.is_upgrade = false;
        plan.proration = null;
        plan.upgrade_price = null;
      } else {
        const upgradePrice = Math.max(
          0,
          plan.calculated_price - proration.remaining_value,
        );
        plan.is_upgrade =
          plan.calculated_price > activeSubscription.calculated_price;
        plan.proration = {
          current_plan_total_days: proration.total_days,
          current_plan_remaining_days: proration.remaining_days,
          current_daily_rate: proration.daily_rate,
          current_remaining_value: proration.remaining_value,
          new_plan_full_price: plan.calculated_price,
          prorated_upgrade_price: upgradePrice,
        };
        plan.upgrade_price = upgradePrice;
      }
    }
  }

  // Sort by calculated_price ascending
  recommendedPlans.sort((a, b) => a.calculated_price - b.calculated_price);

  // Mark best recommendation: skip current plan and downgrades
  if (activeSubscription) {
    const bestUpgrade = recommendedPlans.find(
      (p) => !p.is_current_plan && p.is_upgrade,
    );
    if (bestUpgrade) {
      bestUpgrade.is_recommended = true;
    }
  } else if (recommendedPlans.length > 0) {
    recommendedPlans[0].is_recommended = true;
  }

  return {
    parent_summary: {
      total_kids: totalKids,
      kids: kidsWithDetails,
      same_trip_groups: sameTripGroups.map((g) => ({
        driver_unique_id: g.driver_unique_id,
        school_id: g.school_id,
        kids: g.student_ids,
        count: g.count,
      })),
    },
    current_subscription: activeSubscription
      ? {
          subscription_id: activeSubscription.subscription_id,
          plan_id: activeSubscription.plan_id,
          calculated_price: activeSubscription.calculated_price,
          start_date: activeSubscription.start_date,
          end_date: activeSubscription.end_date,
          remaining_days: calculateProration(activeSubscription).remaining_days,
          remaining_value:
            calculateProration(activeSubscription).remaining_value,
        }
      : null,
    recommended_plans: recommendedPlans,
    excluded_plans: excludedPlans,
  };
};

// ============================================================
// CREATE SUBSCRIPTION
// ============================================================

interface CreateSubscriptionInput {
  plan_id: string;
  auto_renew?: boolean;
}

interface CreateSubscriptionResult {
  subscription: WithId<ParentSubscription>;
  warnings: string[];
}

export const createParentSubscription = async (
  userId: string,
  data: CreateSubscriptionInput,
): Promise<CreateSubscriptionResult> => {
  const warnings: string[] = [];

  // 1. Convert user_id to parent_id
  const parentId = await getParentIdByUserId(userId);
  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // 2. Check for existing active subscription
  const existingActive =
    await parentSubscriptionRepository.findDuplicateActiveSubscription(
      parentId,
    );
  if (existingActive) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.ALREADY_EXISTS,
    );
  }

  // 3. Fetch and validate the plan
  const plan = await subscriptionPlanRepository.findByPlanId(data.plan_id);
  if (!plan) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.PLAN_NOT_FOUND,
    );
  }

  // 4. Auto-fetch parent's active students
  const students = await studentRepository.findByParentId(parentId);
  const activeStudents = students.filter((s) => s.is_active);

  if (activeStudents.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.NO_ACTIVE_STUDENTS,
    );
  }

  const studentIds = activeStudents.map((s) => s.student_id);
  const studentCount = studentIds.length;

  // 5. Validate student count against plan limits
  if (studentCount < plan.kids.min) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.STUDENT_COUNT_BELOW_MIN,
    );
  }
  if (studentCount > plan.kids.max) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.STUDENT_COUNT_ABOVE_MAX,
    );
  }

  // 6. Check no student is already covered by another active subscription
  const conflicting =
    await parentSubscriptionRepository.findActiveSubscriptionsByStudentIds(
      studentIds,
    );
  if (conflicting.length > 0) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.STUDENT_ALREADY_SUBSCRIBED,
    );
  }

  // 7. Warn if any student lacks an active driver assignment
  for (const student of activeStudents) {
    const assignments =
      await driverStudentAssignmentRepository.findActiveAssignmentsByStudentId(
        student.student_id,
      );
    if (assignments.length === 0) {
      warnings.push(
        `Student "${student.student_name}" (${student.student_id}) does not have an active driver assignment`,
      );
    }
  }

  // 8. Detect same-trip groups and calculate price
  const sameTripGroups = await detectSameTripGroups(studentIds);
  const pricing = calculatePrice(plan, studentCount, sameTripGroups);

  // 9. Calculate dates
  const startDate = new Date();
  const endDate = calculateEndDate(startDate, plan.plan_type);

  // 10. Create subscription
  const subscriptionData: ParentSubscription = {
    subscription_id: generateUniqueCode(UniqueCodeTypes.SUBSCRIPTION),
    parent_id: parentId,
    plan_id: data.plan_id,
    student_ids: studentIds,
    number_of_kids: studentCount,
    original_price: pricing.original_price,
    calculated_price: pricing.calculated_price,
    discount_applied: pricing.discount_applied,
    currency: plan.currency,
    start_date: startDate,
    end_date: endDate,
    subscription_status: SubscriptionStatus.ACTIVE,
    auto_renew: data.auto_renew ?? false,
    subscription_source: SubscriptionSource.SELF_PAY,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const subscription =
    await parentSubscriptionRepository.create(subscriptionData);

  // 11. Update parent document
  await parentRepository.updateByUserId(userId, {
    has_active_subscription: true,
    subscription_id: subscriptionData.subscription_id,
    updated_at: new Date(),
  } as any);

  return { subscription, warnings };
};

// ============================================================
// UPGRADE SUBSCRIPTION
// ============================================================

interface UpgradeSubscriptionResult {
  old_subscription_id: string;
  new_subscription: WithId<ParentSubscription>;
  proration: ProrationDetails;
  warnings: string[];
}

export const upgradeParentSubscription = async (
  userId: string,
  data: { plan_id: string },
): Promise<UpgradeSubscriptionResult> => {
  const warnings: string[] = [];

  // 1. Resolve parent
  const parentId = await getParentIdByUserId(userId);
  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // 2. Get active subscription (must exist for upgrade)
  const activeSubscription =
    await parentSubscriptionRepository.findActiveByParentId(parentId);
  if (!activeSubscription) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.NO_ACTIVE_SUBSCRIPTION_TO_UPGRADE,
    );
  }

  // 3. Cannot upgrade to same plan
  if (activeSubscription.plan_id === data.plan_id) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.CANNOT_UPGRADE_TO_SAME_PLAN,
    );
  }

  // 4. Fetch and validate new plan
  const newPlan = await subscriptionPlanRepository.findByPlanId(data.plan_id);
  if (!newPlan) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.PLAN_NOT_FOUND,
    );
  }

  // 5. Get active students
  const students = await studentRepository.findByParentId(parentId);
  const activeStudents = students.filter((s) => s.is_active);

  if (activeStudents.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.NO_ACTIVE_STUDENTS,
    );
  }

  const studentIds = activeStudents.map((s) => s.student_id);
  const studentCount = studentIds.length;

  // 6. Validate student count against new plan limits
  if (studentCount < newPlan.kids.min) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.STUDENT_COUNT_BELOW_MIN,
    );
  }
  if (studentCount > newPlan.kids.max) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.STUDENT_COUNT_ABOVE_MAX,
    );
  }

  // 7. Calculate new plan pricing
  const sameTripGroups = await detectSameTripGroups(studentIds);
  const newPricing = calculatePrice(newPlan, studentCount, sameTripGroups);

  // 8. Validate this is an upgrade (new plan costs more)
  if (newPricing.calculated_price <= activeSubscription.calculated_price) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.UPGRADE_NOT_ALLOWED_DOWNGRADE,
    );
  }

  // 9. Calculate proration
  const proration = calculateProration(activeSubscription);
  const proratedUpgradePrice = Math.max(
    0,
    newPricing.calculated_price - proration.remaining_value,
  );

  // 10. Mark old subscription as upgraded
  await parentSubscriptionRepository.updateStatusBySubscriptionId(
    activeSubscription.subscription_id,
    SubscriptionStatus.UPGRADED,
  );

  // 11. Create new subscription
  const startDate = new Date();
  const endDate = calculateEndDate(startDate, newPlan.plan_type);

  const subscriptionData: ParentSubscription = {
    subscription_id: generateUniqueCode(UniqueCodeTypes.SUBSCRIPTION),
    parent_id: parentId,
    plan_id: data.plan_id,
    student_ids: studentIds,
    number_of_kids: studentCount,
    original_price: newPricing.original_price,
    calculated_price: newPricing.calculated_price,
    discount_applied: newPricing.discount_applied,
    currency: newPlan.currency,
    start_date: startDate,
    end_date: endDate,
    subscription_status: SubscriptionStatus.ACTIVE,
    auto_renew: activeSubscription.auto_renew,
    subscription_source: SubscriptionSource.SELF_PAY,
    created_at: new Date(),
    updated_at: new Date(),
    upgraded_from_subscription_id: activeSubscription.subscription_id,
    prorated_amount: proratedUpgradePrice,
  };

  const newSubscription =
    await parentSubscriptionRepository.create(subscriptionData);

  // 12. Update parent document to point to new subscription
  await parentRepository.updateByUserId(userId, {
    has_active_subscription: true,
    subscription_id: subscriptionData.subscription_id,
    updated_at: new Date(),
  } as any);

  // 13. Warn about students without driver assignments
  for (const student of activeStudents) {
    const assignments =
      await driverStudentAssignmentRepository.findActiveAssignmentsByStudentId(
        student.student_id,
      );
    if (assignments.length === 0) {
      warnings.push(
        `Student "${student.student_name}" (${student.student_id}) does not have an active driver assignment`,
      );
    }
  }

  const prorationDetails: ProrationDetails = {
    current_plan_total_days: proration.total_days,
    current_plan_remaining_days: proration.remaining_days,
    current_daily_rate: proration.daily_rate,
    current_remaining_value: proration.remaining_value,
    new_plan_full_price: newPricing.calculated_price,
    prorated_upgrade_price: proratedUpgradePrice,
  };

  return {
    old_subscription_id: activeSubscription.subscription_id,
    new_subscription: newSubscription,
    proration: prorationDetails,
    warnings,
  };
};

// ============================================================
// READ OPERATIONS
// ============================================================

export const getParentSubscriptionById = async (
  id: string,
): Promise<WithId<ParentSubscription> | null> => {
  return await parentSubscriptionRepository.findById(id);
};

export const getAllParentSubscriptions = async (): Promise<
  WithId<ParentSubscription>[]
> => {
  return await parentSubscriptionRepository.findMany();
};

export const getParentSubscriptionsByUserId = async (
  userId: string,
): Promise<any[]> => {
  const parentId = await getParentIdByUserId(userId);
  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await parentSubscriptionRepository.findByParentIdWithPlanAndStudents(
    parentId,
  );
};

export const getActiveParentSubscriptionByUserId = async (
  userId: string,
): Promise<any | null> => {
  const parentId = await getParentIdByUserId(userId);
  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await parentSubscriptionRepository.findActiveWithPlanAndStudents(
    parentId,
  );
};

export const getMySubscriptionDetails = async (
  userId: string,
): Promise<any> => {
  const parentId = await getParentIdByUserId(userId);
  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  const details =
    await parentSubscriptionRepository.findActiveSubscriptionWithDetails(
      parentId,
    );

  if (!details) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT_SUBSCRIPTION.NOT_FOUND,
    );
  }

  return details;
};

// ============================================================
// UPDATE / CANCEL / DELETE
// ============================================================

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
  userId?: string,
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

  const result = await parentSubscriptionRepository.updateById(id, {
    $set: {
      subscription_status: SubscriptionStatus.CANCELLED,
      auto_renew: false,
      updated_at: new Date(),
    },
  });

  // Reset parent flags
  if (userId) {
    await parentRepository.updateByUserId(userId, {
      has_active_subscription: false,
      subscription_id: undefined,
      updated_at: new Date(),
    } as any);
  }

  return result;
};

export const deleteParentSubscription = async (
  id: string,
): Promise<boolean> => {
  const result = await parentSubscriptionRepository.deleteById(id);
  return result !== null;
};
