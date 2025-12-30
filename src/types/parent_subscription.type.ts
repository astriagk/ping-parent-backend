import { SubscriptionStatus } from "@constants";

export interface ParentSubscription {
  _id?: any;
  subscription_id: string;
  parent_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  subscription_status: SubscriptionStatus;
  auto_renew: boolean;
  created_at: Date;
  updated_at?: Date;
}
