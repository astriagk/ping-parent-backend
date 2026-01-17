import { WithId } from "mongodb";

import { SUBSCRIPTION_PLANS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { SubscriptionPlan } from "./subscription_plan.type";

export class SubscriptionPlanRepository extends BaseRepository<SubscriptionPlan> {
  constructor() {
    super(SUBSCRIPTION_PLANS_COLLECTION);
  }

  async findActivePlans(): Promise<WithId<SubscriptionPlan>[]> {
    const collection = this.getCollection();
    return await collection
      .find({ is_active: true })
      .sort({ priority: 1 })
      .toArray();
  }

  async findByPlanId(planId: string): Promise<WithId<SubscriptionPlan> | null> {
    return await this.findOne({ plan_id: planId, is_active: true });
  }
}

export const subscriptionPlanRepository = new SubscriptionPlanRepository();
