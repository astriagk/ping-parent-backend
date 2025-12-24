import { connectDB } from "../db/mongo";
import { NOTIFICATIONS_COLLECTION } from "../config/collections";
import { Notification } from "../types/notification.type";
import { ObjectId } from "mongodb";

export const getNotificationsByParentId = async (
  parentId: string,
  limit?: number,
  status?: "unread" | "read"
): Promise<Notification[]> => {
  const db = await connectDB();

  const query: any = { parentId };

  if (status) {
    query.status = status;
  }

  let notificationsQuery = db
    .collection(NOTIFICATIONS_COLLECTION)
    .find(query)
    .sort({ createdAt: -1 });

  if (limit) {
    notificationsQuery = notificationsQuery.limit(limit);
  }

  const notifications = await notificationsQuery.toArray();
  return notifications as Notification[];
};

export const getUnreadNotificationsCount = async (
  parentId: string
): Promise<number> => {
  const db = await connectDB();

  const count = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .countDocuments({ parentId, status: "unread" });

  return count;
};

export const createNotification = async (
  notificationData: Notification
): Promise<Notification> => {
  const db = await connectDB();

  const newNotification = {
    ...notificationData,
    status: notificationData.status || "unread",
    createdAt: new Date(),
  };

  const result = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .insertOne(newNotification);

  return {
    ...newNotification,
    _id: result.insertedId,
  };
};

export const markNotificationAsRead = async (
  notificationId: string,
  parentId: string
): Promise<boolean> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(notificationId)
      ? new ObjectId(notificationId)
      : notificationId,
    parentId,
  };

  const result = await db.collection(NOTIFICATIONS_COLLECTION).updateOne(query, {
    $set: {
      status: "read",
      readAt: new Date(),
    },
  });

  return result.modifiedCount > 0;
};

export const markAllNotificationsAsRead = async (
  parentId: string
): Promise<number> => {
  const db = await connectDB();

  const result = await db.collection(NOTIFICATIONS_COLLECTION).updateMany(
    { parentId, status: "unread" },
    {
      $set: {
        status: "read",
        readAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
};

export const deleteNotification = async (
  notificationId: string,
  parentId: string
): Promise<boolean> => {
  const db = await connectDB();

  const query: any = {
    _id: ObjectId.isValid(notificationId)
      ? new ObjectId(notificationId)
      : notificationId,
    parentId,
  };

  const result = await db.collection(NOTIFICATIONS_COLLECTION).deleteOne(query);

  return result.deletedCount > 0;
};
