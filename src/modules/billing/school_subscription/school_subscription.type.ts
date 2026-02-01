import { SchoolSubscriptionStatus } from "@shared/constants";

export interface SchoolSubscription {
  _id?: any;
  subscription_id: string;
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
  subscription_id: string;
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
