import { WithId } from "mongodb";

import {
  SCHOOL_SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_PLANS_COLLECTION,
  SchoolSubscriptionStatus,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import {
  SchoolSubscription,
  SchoolSubscriptionWithPlan,
} from "./school_subscription.type";

export class SchoolSubscriptionRepository extends BaseRepository<SchoolSubscription> {
  constructor() {
    super(SCHOOL_SUBSCRIPTIONS_COLLECTION);
  }

  async findBySchoolId(
    schoolId: string,
  ): Promise<WithId<SchoolSubscription> | null> {
    return await this.findOne({ school_id: schoolId });
  }

  async findActiveBySchoolId(
    schoolId: string,
  ): Promise<WithId<SchoolSubscription> | null> {
    return await this.findOne({
      school_id: schoolId,
      subscription_status: SchoolSubscriptionStatus.ACTIVE,
    });
  }

  async findBySubscriptionId(
    subscriptionId: string,
  ): Promise<WithId<SchoolSubscription> | null> {
    return await this.findOne({ subscription_id: subscriptionId });
  }

  async findAllBySchool(
    schoolId?: string,
  ): Promise<SchoolSubscriptionWithPlan[]> {
    const collection = this.getCollection();
    const pipeline: any[] = [];

    if (schoolId !== undefined) {
      pipeline.push({ $match: { school_id: schoolId } });
    }

    pipeline.push(
      {
        $addFields: {
          plan_id_obj: { $toObjectId: "$plan_id" },
          school_id_obj: { $toObjectId: "$school_id" },
        },
      },
      {
        $lookup: {
          from: SUBSCRIPTION_PLANS_COLLECTION,
          localField: "plan_id_obj",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $lookup: {
          from: "schools",
          localField: "school_id_obj",
          foreignField: "_id",
          as: "school",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          subscription_id: 1,
          school_name: "$school.school_name",
          plan: 1,
          subscription_status: 1,
          start_date: 1,
          end_date: 1,
          max_drivers: 1,
          max_students: 1,
          billing_contact: 1,
          auto_renew: 1,
          created_at: 1,
        },
      },
      { $sort: { created_at: -1 } },
    );
    return await collection
      .aggregate<SchoolSubscriptionWithPlan>(pipeline)
      .toArray();
  }

  async findExpiredSubscriptions(): Promise<WithId<SchoolSubscription>[]> {
    const collection = this.getCollection();
    return await collection
      .find({
        end_date: { $lt: new Date() },
        subscription_status: SchoolSubscriptionStatus.ACTIVE,
      })
      .toArray();
  }

  async findByPlanId(planId: string): Promise<WithId<SchoolSubscription>[]> {
    const collection = this.getCollection();
    return await collection
      .find({
        plan_id: planId,
        subscription_status: SchoolSubscriptionStatus.ACTIVE,
      })
      .toArray();
  }
}

export const schoolSubscriptionRepository = new SchoolSubscriptionRepository();
