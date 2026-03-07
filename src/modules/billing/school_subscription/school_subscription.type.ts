import { WithId } from "mongodb";

import { SubscriptionPlan } from "@modules/billing/subscription_plan/subscription_plan.type";
import { SchoolSubscriptionStatus } from "@shared/constants";

export type SchoolSubscriptionWithPlan = WithId<SchoolSubscription> & {
  plan?: WithId<SubscriptionPlan>;
};

export interface SchoolSubscription {
  _id?: any;
  school_id: string; // FK to schools
  plan_id: string; // FK to subscription_plans
  start_date: Date;
  end_date: Date;
  subscription_status: SchoolSubscriptionStatus;
  auto_renew: boolean;
  max_drivers?: number; // Maximum drivers allowed under this subscription
  max_students?: number; // Maximum students allowed under this subscription
  billing_contact?: string; // Contact person for billing
  created_at: Date;
  updated_at?: Date;
}

export interface SchoolSubscriptionInput {
  school_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  auto_renew?: boolean;
  max_drivers?: number;
  max_students?: number;
  billing_contact?: string;
}

export interface SchoolSubscriptionUpdateInput {
  plan_id?: string;
  end_date?: Date;
  auto_renew?: boolean;
  max_drivers?: number;
  max_students?: number;
  billing_contact?: string;
  subscription_status?: SchoolSubscriptionStatus;
}

export interface SchoolSubscriptionResponse {
  _id: string;
  school_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  subscription_status: SchoolSubscriptionStatus;
  auto_renew: boolean;
  max_drivers?: number;
  max_students?: number;
  billing_contact?: string;
  created_at: Date;
  updated_at?: Date;
}
