import { NotificationType } from "@constants";

export interface Notification {
  _id?: any;
  notification_id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}
