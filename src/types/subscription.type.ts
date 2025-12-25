// Table: subscription_plans
export interface SubscriptionPlan {
  _id?: any; // MongoDB internal ID
  plan_id?: string;
  plan_name: string;
  plan_type: "monthly" | "quarterly" | "yearly";
  price: number;
  features?: any; // JSON field
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Table: parent_subscriptions
export interface ParentSubscription {
  _id?: any; // MongoDB internal ID
  subscription_id?: string;
  parent_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  subscription_status: "active" | "expired" | "cancelled";
  auto_renew?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Table: payments
export interface Payment {
  _id?: any; // MongoDB internal ID
  payment_id?: string;
  parent_id: string;
  payment_type: "subscription" | "penalty";
  amount: number;
  currency?: string;
  payment_method: "card" | "upi" | "netbanking" | "wallet" | "cash";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  transaction_id?: string;
  gateway_response?: any; // JSON field
  subscription_id?: string;
  payment_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}
