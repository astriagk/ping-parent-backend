import { ObjectId, UpdateResult, WithId } from "mongodb";

import {
  DRIVERS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  PARENT_SUBSCRIPTIONS_COLLECTION,
  PAYMENTS_COLLECTION,
  SCHOOLS_COLLECTION,
  STUDENTS_COLLECTION,
  SUBSCRIPTION_PLANS_COLLECTION,
  SubscriptionSource,
  SubscriptionStatus,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { ParentSubscription } from "./parent_subscription.type";

export class ParentSubscriptionRepository extends BaseRepository<ParentSubscription> {
  constructor() {
    super(PARENT_SUBSCRIPTIONS_COLLECTION);
  }

  async findByParentId(
    parentId: string,
  ): Promise<WithId<ParentSubscription>[]> {
    return await this.findMany({ parent_id: parentId });
  }

  async findActiveByParentId(
    parentId: string,
  ): Promise<WithId<ParentSubscription> | null> {
    return await this.findOne({
      parent_id: parentId,
      subscription_status: SubscriptionStatus.ACTIVE,
    });
  }

  async findByPlanId(planId: string): Promise<WithId<ParentSubscription>[]> {
    return await this.findMany({ plan_id: planId });
  }

  async findExpiredSubscriptions(): Promise<WithId<ParentSubscription>[]> {
    const currentDate = new Date();
    return await this.findMany({
      subscription_status: SubscriptionStatus.ACTIVE,
      end_date: { $lt: currentDate },
    });
  }

  async findActiveSubscriptions(): Promise<WithId<ParentSubscription>[]> {
    return await this.findMany({
      subscription_status: SubscriptionStatus.ACTIVE,
    });
  }

  async findDuplicateActiveSubscription(
    parentId: string,
  ): Promise<WithId<ParentSubscription> | null> {
    // Only block duplicate SELF_PAY subscriptions — school redemptions can coexist
    return await this.findOne({
      parent_id: parentId,
      subscription_status: SubscriptionStatus.ACTIVE,
      subscription_source: { $ne: SubscriptionSource.SCHOOL_REDEMPTION },
    } as any);
  }

  async findActiveRedemptionBySchoolSub(
    parentId: string,
    schoolSubscriptionId: string,
  ): Promise<WithId<ParentSubscription> | null> {
    return await this.findOne({
      parent_id: parentId,
      subscription_source: SubscriptionSource.SCHOOL_REDEMPTION,
      school_subscription_id: schoolSubscriptionId,
      subscription_status: SubscriptionStatus.ACTIVE,
    } as any);
  }

  /**
   * Check if any of the given students are already covered by an active subscription
   */
  async findActiveSubscriptionsByStudentIds(
    studentIds: string[],
  ): Promise<WithId<ParentSubscription>[]> {
    return await this.findMany({
      student_ids: { $in: studentIds },
      subscription_status: SubscriptionStatus.ACTIVE,
    });
  }

  /**
   * Update subscription status by subscription_id (not _id)
   */
  async updateStatusBySubscriptionId(
    subscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<UpdateResult> {
    const collection = this.getCollection();
    return await collection.updateOne(
      { _id: new ObjectId(subscriptionId) },
      {
        $set: {
          subscription_status: status,
          auto_renew: false,
          updated_at: new Date(),
        },
      },
    );
  }

  /**
   * Light aggregation: subscription + plan name + student names
   * Used for list/active views
   */
  async findByParentIdWithPlanAndStudents(parentId: string): Promise<any[]> {
    const collection = this.getCollection();
    return await collection
      .aggregate([
        { $match: { parent_id: parentId } },
        { $sort: { created_at: -1 } },
        {
          $addFields: {
            plan_object_id: { $toObjectId: "$plan_id" },
          },
        },
        {
          $lookup: {
            from: SUBSCRIPTION_PLANS_COLLECTION,
            localField: "plan_object_id",
            foreignField: "_id",
            as: "plan",
          },
        },
        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            student_ids: {
              $map: {
                input: "$student_ids",
                as: "id",
                in: { $toObjectId: "$$id" },
              },
            },
          },
        },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            localField: "student_ids",
            foreignField: "_id",
            as: "students",
          },
        },
        {
          $project: {
            _id: 1,
            parent_id: 1,
            plan_id: 1,
            student_ids: 1,
            number_of_kids: 1,
            original_price: 1,
            calculated_price: 1,
            discount_applied: 1,
            currency: 1,
            start_date: 1,
            end_date: 1,
            subscription_status: 1,
            auto_renew: 1,
            created_at: 1,
            updated_at: 1,
            "plan._id": 1,
            "plan.plan_name": 1,
            "plan.plan_type": 1,
            "plan.pricing_model": 1,
            "plan.price": 1,
            "plan.per_kid_price": 1,
            "plan.features": 1,
            "students._id": 1,
            "students.student_name": 1,
            "students.class": 1,
            "students.section": 1,
          },
        },
      ])
      .toArray();
  }

  /**
   * Light aggregation for active subscription only
   */
  async findActiveWithPlanAndStudents(parentId: string): Promise<any | null> {
    const collection = this.getCollection();
    const results = await collection
      .aggregate([
        {
          $match: {
            parent_id: parentId,
            subscription_status: SubscriptionStatus.ACTIVE,
          },
        },
        {
          $addFields: {
            plan_object_id: { $toObjectId: "$plan_id" },
          },
        },
        {
          $lookup: {
            from: SUBSCRIPTION_PLANS_COLLECTION,
            localField: "plan_object_id",
            foreignField: "_id",
            as: "plan",
          },
        },
        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            student_ids: {
              $map: {
                input: "$student_ids",
                as: "id",
                in: { $toObjectId: "$$id" },
              },
            },
          },
        },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            localField: "student_ids",
            foreignField: "_id",
            as: "students",
          },
        },
        {
          $project: {
            _id: 1,
            parent_id: 1,
            plan_id: 1,
            student_ids: 1,
            number_of_kids: 1,
            original_price: 1,
            calculated_price: 1,
            discount_applied: 1,
            currency: 1,
            start_date: 1,
            end_date: 1,
            subscription_status: 1,
            auto_renew: 1,
            created_at: 1,
            updated_at: 1,
            "plan._id": 1,
            "plan.plan_name": 1,
            "plan.plan_type": 1,
            "plan.pricing_model": 1,
            "plan.price": 1,
            "plan.per_kid_price": 1,
            "plan.features": 1,
            "students._id": 1,
            "students.student_name": 1,
            "students.class": 1,
            "students.section": 1,
          },
        },
      ])
      .toArray();

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Full aggregation: subscription → plan → students → schools → driver assignments → drivers → payments
   * Used for the detailed subscription view
   */
  async findActiveSubscriptionWithDetails(
    parentId: string,
  ): Promise<any | null> {
    const collection = this.getCollection();
    const results = await collection
      .aggregate([
        {
          $match: {
            parent_id: parentId,
            subscription_status: SubscriptionStatus.ACTIVE,
          },
        },
        // Join plan

        {
          $addFields: {
            plan_object_id: { $toObjectId: "$plan_id" },
          },
        },
        {
          $lookup: {
            from: SUBSCRIPTION_PLANS_COLLECTION,
            localField: "plan_object_id",
            foreignField: "_id",
            as: "plan",
          },
        },
        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            student_ids: {
              $map: {
                input: "$student_ids",
                as: "id",
                in: { $toObjectId: "$$id" },
              },
            },
          },
        },
        // Join students
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            localField: "student_ids",
            foreignField: "_id",
            as: "students",
          },
        },
        // Unwind students to join school + driver per student
        { $unwind: { path: "$students", preserveNullAndEmptyArrays: true } },
        // Join school for each student
        {
          $addFields: {
            school_object_id: { $toObjectId: "$students.school_id" },
          },
        },
        {
          $lookup: {
            from: SCHOOLS_COLLECTION,
            localField: "school_object_id",
            foreignField: "_id",
            as: "students.school",
          },
        },
        {
          $unwind: {
            path: "$students.school",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Join active driver assignment for each student
        {
          $lookup: {
            from: DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
            let: { sid: { $toString: "$students._id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$student_id", "$$sid"] },
                  assignment_status: "active",
                },
              },
              { $limit: 1 },
            ],
            as: "students.assignment",
          },
        },
        {
          $unwind: {
            path: "$students.assignment",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Join driver details via driver_unique_id
        {
          $lookup: {
            from: DRIVERS_COLLECTION,
            localField: "students.assignment.driver_unique_id",
            foreignField: "driver_unique_id",
            as: "students.driver",
          },
        },
        {
          $unwind: {
            path: "$students.driver",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Re-group students back into array
        {
          $group: {
            _id: "$_id",
            parent_id: { $first: "$parent_id" },
            plan_id: { $first: "$plan_id" },
            student_ids: { $first: "$student_ids" },
            number_of_kids: { $first: "$number_of_kids" },
            original_price: { $first: "$original_price" },
            calculated_price: { $first: "$calculated_price" },
            discount_applied: { $first: "$discount_applied" },
            currency: { $first: "$currency" },
            start_date: { $first: "$start_date" },
            end_date: { $first: "$end_date" },
            subscription_status: { $first: "$subscription_status" },
            auto_renew: { $first: "$auto_renew" },
            created_at: { $first: "$created_at" },
            updated_at: { $first: "$updated_at" },
            plan: { $first: "$plan" },
            students: {
              $push: {
                _id: { $toString: "$students._id" },
                student_name: "$students.student_name",
                class: "$students.class",
                section: "$students.section",
                photo_url: "$students.photo_url",
                school: {
                  _id: { $toString: "$students.school._id" },
                  school_name: "$students.school.school_name",
                  address: "$students.school.address",
                  city: "$students.school.city",
                },
                driver: {
                  $cond: {
                    if: {
                      $ifNull: ["$students.driver.driver_unique_id", false],
                    },
                    then: {
                      driver_unique_id: "$students.driver.driver_unique_id",
                      name: "$students.driver.name",
                      phone_number: "$students.driver.phone_number",
                      vehicle_type: "$students.driver.vehicle_type",
                      vehicle_number: "$students.driver.vehicle_number",
                    },
                    else: null,
                  },
                },
                assignment: {
                  $cond: {
                    if: {
                      $ifNull: ["$students.assignment._id", false],
                    },
                    then: {
                      _id: { $toString: "$students.assignment._id" },
                      monthly_fee: "$students.assignment.monthly_fee",
                      assignment_status:
                        "$students.assignment.assignment_status",
                    },
                    else: null,
                  },
                },
              },
            },
          },
        },
        // Join payments for this subscription
        {
          $lookup: {
            from: PAYMENTS_COLLECTION,
            localField: "_id",
            foreignField: "subscription_id",
            as: "payments",
          },
        },
      ])
      .toArray();

    return results.length > 0 ? results[0] : null;
  }
}

export const parentSubscriptionRepository = new ParentSubscriptionRepository();
