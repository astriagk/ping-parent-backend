/**
 * Razorpay Order Interface
 */
export interface RazorpayOrder {
  id: string; // order_id from Razorpay
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "paid" | "attempted" | "failed";
  attempts: number;
  notes?: Record<string, any>;
  created_at: number;
}

/**
 * Razorpay Payment Verification Payload
 */
export interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Razorpay Webhook Event
 */
export interface RazorpayWebhookEvent {
  id: string;
  entity: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id?: string;
        invoice_id?: string;
        international?: boolean;
        method: string;
        amount_refunded: number;
        refund_status?: string;
        captured: boolean;
        description?: string;
        card_id?: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        email: string;
        contact: string;
        notes: Record<string, any>;
        fee?: number;
        tax?: number;
        error_code?: string;
        error_description?: string;
        error_source?: string;
        error_reason?: string;
        acquirer_data: {
          auth_code?: string;
          rrn?: string;
        };
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        status: string;
        attempts: number;
        notes: Record<string, any>;
        created_at: number;
      };
    };
  };
  created_at: number;
}

/**
 * Order Creation Request
 */
export interface CreateOrderRequest {
  amount: number; // Amount in paise (multiply by 100 for rupees)
  currency: string; // e.g., "INR"
  receipt: string; // Unique receipt identifier
  notes?: {
    payment_id?: string;
    parent_id?: string;
    subscription_id?: string;
    [key: string]: any;
  };
}

/**
 * Order Creation Response
 */
export interface CreateOrderResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

/**
 * Payment Capture Request
 */
export interface CapturePaymentRequest {
  payment_id: string;
  amount: number; // Amount in paise
}

/**
 * Refund Request
 */
export interface RefundRequest {
  payment_id: string;
  amount?: number; // Optional - for partial refunds (in paise)
  notes?: Record<string, any>;
}

/**
 * Refund Response
 */
export interface RefundResponse {
  id: string;
  entity: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: "processed" | "failed" | "pending";
  notes?: Record<string, any>;
  created_at: number;
}
