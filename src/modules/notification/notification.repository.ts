import { WithId } from "mongodb";

import { Notification } from "@modules/notification/notification.type";
import { getDB } from "@shared/config";
import { NOTIFICATIONS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super(NOTIFICATIONS_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<Notification>[]> {
    return await this.findMany({ user_id: userId });
  }

  async findUnreadByUserId(userId: string): Promise<WithId<Notification>[]> {
    return await this.findMany({ user_id: userId, is_read: false });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    const db = await getDB();
    return await db
      .collection<Notification>(this.collectionName)
      .countDocuments({ user_id: userId, is_read: false });
  }

  async markAsRead(
    notificationId: string,
  ): Promise<WithId<Notification> | null> {
    return await this.updateById(notificationId, {
      $set: { is_read: true, read_at: new Date() },
    });
  }

  async markAllAsReadForUser(userId: string): Promise<number> {
    const db = await getDB();
    const result = await db
      .collection<Notification>(this.collectionName)
      .updateMany(
        { user_id: userId, is_read: false },
        { $set: { is_read: true, read_at: new Date() } },
      );
    return result.modifiedCount;
  }
}

export const notificationRepository = new NotificationRepository();
