import { PlanType } from "@constants";

export interface SubscriptionPlan {
  _id?: any;
  plan_id: string;
  plan_name: string;
  plan_type: PlanType;
  price: number;
  features?: any;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
