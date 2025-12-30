import { WithId } from "mongodb";

import {
  PARENT_SUBSCRIPTIONS_COLLECTION,
  SubscriptionStatus,
} from "@constants";
import { ParentSubscription } from "@models/parent_subscription.type";

import { BaseRepository } from "./base.repository";

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
    return await this.findOne({
      parent_id: parentId,
      subscription_status: SubscriptionStatus.ACTIVE,
    });
  }
}

export const parentSubscriptionRepository = new ParentSubscriptionRepository();
