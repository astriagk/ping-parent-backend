import { WithId } from "mongodb";

import { SubscriptionPlan } from "@modules/billing/subscription-plan/subscription_plan.type";
import { SUBSCRIPTION_PLANS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

export class SubscriptionPlanRepository extends BaseRepository<SubscriptionPlan> {
  constructor() {
    super(SUBSCRIPTION_PLANS_COLLECTION);
  }

  async findActivePlans(): Promise<WithId<SubscriptionPlan>[]> {
    return await this.findMany({ is_active: true });
  }

  async findByPlanId(planId: string): Promise<WithId<SubscriptionPlan> | null> {
    return await this.findOne({ plan_id: planId, is_active: true });
  }
}

export const subscriptionPlanRepository = new SubscriptionPlanRepository();
