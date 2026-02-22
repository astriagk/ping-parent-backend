import { SubscriptionSource, SubscriptionStatus } from "@shared/constants";

export interface DiscountApplied {
  type: string;
  percentage: number;
  amount: number;
  label: string;
}

export interface ParentSubscription {
  _id?: any;
  parent_id: string;
  plan_id: string;
  student_ids: string[];
  number_of_kids: number;
  original_price: number;
  calculated_price: number;
  discount_applied?: DiscountApplied;
  currency: string;
  start_date: Date;
  end_date: Date;
  subscription_status: SubscriptionStatus;
  auto_renew: boolean;
  created_at: Date;
  updated_at?: Date;
  upgraded_from_subscription_id?: string;
  prorated_amount?: number;
  subscription_source?: SubscriptionSource;
  school_subscription_id?: string;
}

export interface ProrationDetails {
  current_plan_total_days: number;
  current_plan_remaining_days: number;
  current_daily_rate: number;
  current_remaining_value: number;
  new_plan_full_price: number;
  prorated_upgrade_price: number;
}
