import { PaymentMethod, PaymentStatus, PaymentType } from "@shared/constants";

export interface Payment {
  _id?: any;
  parent_id: string;
  payment_type: PaymentType;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_id?: string;
  gateway_response?: any;
  subscription_id?: string;
  payment_date: Date;
  created_at: Date;
  updated_at?: Date;
}
