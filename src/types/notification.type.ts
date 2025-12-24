export interface Notification {
  _id?: any;
  userId: string;
  parentId: string;
  type: "trip_started" | "trip_ended" | "trip_delayed" | "stop_completed" | "alert" | "update";
  title: string;
  message: string;
  relatedEntityType?: "trip" | "student" | "driver";
  relatedEntityId?: string;
  status: "unread" | "read";
  priority?: "low" | "medium" | "high";
  createdAt: Date;
  readAt?: Date;
}
