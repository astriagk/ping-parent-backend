import { WithId } from "mongodb";

import { NOTIFICATION_PREFERENCES_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { NotificationPreferences } from "./notification-preferences.type";

export class NotificationPreferencesRepository extends BaseRepository<NotificationPreferences> {
  constructor() {
    super(NOTIFICATION_PREFERENCES_COLLECTION);
  }

  async findByUserId(
    userId: string,
  ): Promise<WithId<NotificationPreferences> | null> {
    return await this.findOne({ user_id: userId } as any);
  }

  async upsertPreferences(
    userId: string,
    pushEnabled: boolean,
  ): Promise<WithId<NotificationPreferences>> {
    const existing = await this.findOne({ user_id: userId } as any);

    if (existing) {
      const updated = await this.updateOne({ user_id: userId } as any, {
        $set: {
          push_enabled: pushEnabled,
          updated_at: new Date(),
        },
      });
      return updated!;
    }

    return await this.create({
      user_id: userId,
      push_enabled: pushEnabled,
      updated_at: new Date(),
    } as any);
  }
}

export const notificationPreferencesRepository =
  new NotificationPreferencesRepository();
