import { PlanBadgeType, PlanType, PricingModel } from "@shared/constants";

export interface KidsLimit {
  min: number;
  max: number;
}

export interface FeatureItem {
  key: string;
  label: string;
  enabled: boolean;
}

export interface PlanBadge {
  text: string;
  type: PlanBadgeType;
}

export interface SameTripDiscount {
  percentage: number;
  min_kids: number;
  label: string;
}

export interface PlanDiscounts {
  same_trip?: SameTripDiscount;
}

export interface SubscriptionPlan {
  _id?: any;
  plan_name: string;
  plan_type: PlanType;
  price: number;
  currency: string;
  kids: KidsLimit;
  pricing_model: PricingModel;
  per_kid_price: number | null;
  features: FeatureItem[];
  badge: PlanBadge | null;
  discounts?: PlanDiscounts;
  priority: number;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
