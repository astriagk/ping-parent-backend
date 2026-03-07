import { WithId } from "mongodb";

import { DEVICE_TOKENS_COLLECTION, DeviceType } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { DeviceToken } from "./device-token.type";

export class DeviceTokenRepository extends BaseRepository<DeviceToken> {
  constructor() {
    super(DEVICE_TOKENS_COLLECTION);
  }

  async findActiveTokensByUserId(
    userId: string,
  ): Promise<WithId<DeviceToken>[]> {
    return await this.findMany({
      user_id: userId,
      is_active: true,
    } as any);
  }

  async findByToken(fcmToken: string): Promise<WithId<DeviceToken> | null> {
    return await this.findOne({ fcm_token: fcmToken } as any);
  }

  async upsertToken(
    userId: string,
    role: string,
    fcmToken: string,
    deviceType: DeviceType,
    deviceId: string,
  ): Promise<WithId<DeviceToken>> {
    const collection = this.getCollection();

    // 1. Check if this user + device already has a record (handles token refresh)
    const existingByDevice = await this.findOne({
      user_id: userId,
      device_id: deviceId,
    } as any);

    if (existingByDevice) {
      const updated = await this.updateOne(
        { user_id: userId, device_id: deviceId } as any,
        {
          $set: {
            fcm_token: fcmToken,
            role,
            device_type: deviceType,
            is_active: true,
            updated_at: new Date(),
          },
        },
      );

      // Deactivate any other records with the same fcm_token (prevent duplicates)
      await collection.updateMany(
        {
          fcm_token: fcmToken,
          device_id: { $ne: deviceId },
        } as any,
        { $set: { is_active: false, updated_at: new Date() } },
      );

      return updated!;
    }

    // 2. Check if this fcm_token exists on a different device/user (device changed hands)
    const existingByToken = await this.findOne({
      fcm_token: fcmToken,
    } as any);

    if (existingByToken) {
      const updated = await this.updateOne({ fcm_token: fcmToken } as any, {
        $set: {
          user_id: userId,
          role,
          device_type: deviceType,
          device_id: deviceId,
          is_active: true,
          updated_at: new Date(),
        },
      });
      return updated!;
    }

    // 3. New device + new token → create new record
    return await this.create({
      user_id: userId,
      role,
      fcm_token: fcmToken,
      device_type: deviceType,
      device_id: deviceId,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);
  }

  async deactivateToken(fcmToken: string): Promise<boolean> {
    const result = await this.updateOne({ fcm_token: fcmToken } as any, {
      $set: { is_active: false, updated_at: new Date() },
    });
    return !!result;
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    const collection = this.getCollection();
    await collection.updateMany({ user_id: userId } as any, {
      $set: { is_active: false, updated_at: new Date() },
    });
  }

  async removeInactiveTokens(fcmTokens: string[]): Promise<void> {
    if (fcmTokens.length === 0) return;
    const collection = this.getCollection();
    await collection.updateMany({ fcm_token: { $in: fcmTokens } } as any, {
      $set: { is_active: false, updated_at: new Date() },
    });
  }
}

export const deviceTokenRepository = new DeviceTokenRepository();
