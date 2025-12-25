// Table: notifications
export interface Notification {
  _id?: any; // MongoDB internal ID
  notification_id?: string;
  user_id: string;
  notification_type: "pickup_started" | "approaching" | "picked_up" | "dropped" | "payment_due" | "general";
  title: string;
  message: string;
  data?: any; // JSON field
  is_read?: boolean;
  read_at?: Date;
  created_at?: Date;
}
