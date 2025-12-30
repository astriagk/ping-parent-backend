import { PaymentMethod, PaymentStatus, PaymentType } from "@constants";

export interface Payment {
  _id?: any;
  payment_id: string;
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
