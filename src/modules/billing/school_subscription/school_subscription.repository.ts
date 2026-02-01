import { WithId } from "mongodb";

import {
  SCHOOL_SUBSCRIPTIONS_COLLECTION,
  SchoolSubscriptionStatus,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { SchoolSubscription } from "./school_subscription.type";

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
    schoolId: string,
  ): Promise<WithId<SchoolSubscription>[]> {
    const collection = this.getCollection();
    return await collection
      .find({ school_id: schoolId })
      .sort({ created_at: -1 })
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
