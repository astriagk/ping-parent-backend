import { NotificationType } from "@shared/constants";

export interface Notification {
  _id?: any;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}
